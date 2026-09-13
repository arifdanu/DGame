import { MAPS } from "../game/maps/mapRegistry";
import {
  generateRoomCode,
  normalizeRoomCode,
  validNickname,
  validRoomCode,
} from "./roomCode";
import {
  asRecord,
  readPlayer,
  readPresence,
  readRoom,
  MAX_PLAYERS,
  REMOVE_AFTER,
  SEND_INTERVAL,
  STALE_AFTER,
} from "./playerSync";
import {
  createRealtimeChannel,
  MultiplayerConfigError,
} from "./realtimeChannel";
import type {
  ChannelFactory,
  MultiplayerPlayer,
  PlayerPose,
  RoomChannel,
  RoomMetadata,
  RoomPresence,
  RoomRequest,
  RoomState,
  WireMessage,
  ConnectionState,
} from "./types";
const empty = (): RoomState => ({
  status: "idle",
  message: "",
  room: null,
  self: null,
  players: [],
});
/** Client-host admission serializes simultaneous joins. It is not server authorization. */
export class MultiplayerService {
  private state = empty();
  private listeners = new Set<() => void>();
  private channel: RoomChannel | null = null;
  private generation = 0;
  private timer: ReturnType<typeof setInterval> | null = null;
  private records: RoomPresence[] = [];
  private spawnSlots = new Map<string, number>();
  private members = new Map<string, MultiplayerPlayer>();
  private sequences = new Map<string, number>();
  private request: RoomRequest | null = null;
  private code = "";
  private connected = false;
  private subscribedAt = 0;
  private startedAt = 0;
  private lastControl = 0;
  private lastPose = 0;
  private latestPose: PlayerPose | null = null;
  private sequence = 0;
  private hostSeen = 0;
  private absent = new Map<string, number>();
  private pendingTrack = false;
  private sending = false;
  constructor(
    private factory: ChannelFactory = createRealtimeChannel,
    private now = Date.now,
  ) {}
  getSnapshot = () => this.state;
  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };
  private patch(patch: Partial<RoomState>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((fn) => fn());
  }
  private get isHost() {
    return (
      !!this.state.room && this.state.room.hostId === this.state.self?.playerId
    );
  }
  async begin(request: RoomRequest) {
    const attempt = this.generation + 1;
    await this.leave();
    if (attempt !== this.generation) return;
    this.request = request;
    if (
      !validNickname(request.nickname) ||
      !["0", "1", "2"].includes(request.avatarId) ||
      !["dinar", "delisha"].includes(request.profileId)
    ) {
      this.patch({
        status: "error",
        message: "Pilih nama panggilan dan avatar yang tersedia.",
      });
      return;
    }
    if (
      typeof globalThis.crypto?.randomUUID !== "function" ||
      typeof globalThis.crypto?.getRandomValues !== "function"
    ) {
      this.patch({
        status: "error",
        message:
          "Buka game melalui HTTPS atau localhost untuk Main Bersama. Main Sendiri tetap tersedia.",
      });
      return;
    }
    this.code =
      request.mode === "create"
        ? generateRoomCode()
        : normalizeRoomCode(request.roomCode);
    if (!validRoomCode(this.code)) {
      this.patch({
        status: "not-found",
        message: "Kode harus berisi 6 huruf atau angka yang sesuai.",
      });
      return;
    }
    const mapId = request.mode === "create" ? request.mapId : "krakatau";
    if (!MAPS[mapId]) {
      this.patch({ status: "error", message: "Map tidak tersedia." });
      return;
    }
    const spawn = MAPS[mapId].spawn,
      now = this.now();
    const self: MultiplayerPlayer = {
      playerId: crypto.randomUUID(),
      nickname: request.nickname,
      avatarId: request.avatarId,
      profileId: request.profileId,
      mapId,
      position: { x: spawn[0], y: 0, z: spawn[1] },
      rotation: Math.PI,
      animation: "idle",
      lastSeen: now,
      status: "lobby",
    };
    this.patch({
      status: "connecting",
      message: "Menghubungkan ke room…",
      self,
    });
    const generation = this.generation;
    this.startedAt = now;
    try {
      const channel = await this.factory(this.code, self.playerId, {
        status: (status) => {
          if (generation !== this.generation) return;
          this.connected = status === "subscribed";
          if (this.connected) {
            this.subscribedAt = this.now();
            this.lastControl = 0;
            if (this.state.room) {
              this.track();
              this.patch({ status: "connected", message: "" });
            }
          } else if (this.state.room)
            this.patch({
              status: "disconnected",
              message: "Koneksi terputus. Sedang mencoba menyambung kembali…",
            });
        },
        presence: (raw) => {
          if (generation !== this.generation) return;
          this.records = raw
            .map(readPresence)
            .filter((p): p is RoomPresence => !!p);
          this.presence();
        },
        message: (raw) => {
          if (generation === this.generation) this.receive(raw);
        },
      });
      if (generation !== this.generation) {
        void channel.close().catch(() => {});
        return;
      }
      this.channel = channel;
      this.timer = setInterval(() => this.tick(), SEND_INTERVAL);
      channel.subscribe();
    } catch (error) {
      if (generation === this.generation)
        this.fail(
          error instanceof MultiplayerConfigError ? "unconfigured" : "error",
          error instanceof MultiplayerConfigError
            ? error.message
            : "Main Bersama belum dapat terhubung. Coba lagi atau Main Sendiri.",
        );
    }
  }
  retry = () => {
    if (this.request) void this.begin(this.request);
  };
  private fail(status: ConnectionState, message: string) {
    this.connected = false;
    this.generation++;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    const channel = this.channel;
    this.channel = null;
    void channel?.close().catch(() => {});
    this.patch({ status, message, players: [] });
  }
  private send(message: WireMessage) {
    if (!this.connected || !this.channel) return;
    const generation = this.generation;
    void this.channel.send(message).catch(() => {
      if (generation === this.generation) {
        this.connected = false;
        this.patch({
          status: "disconnected",
          message: "Koneksi terputus. Coba lagi atau Main Sendiri.",
        });
      }
    });
  }
  private track() {
    if (
      !this.channel ||
      !this.state.room ||
      !this.state.self ||
      !this.connected ||
      this.pendingTrack
    )
      return;
    this.pendingTrack = true;
    const generation = this.generation;
    const record: RoomPresence = {
      version: 1,
      player: { ...this.state.self, ...this.latestPose },
      roomId: this.state.room.roomId,
      ...(this.isHost ? { room: this.state.room } : {}),
    };
    void this.channel
      .track(record)
      .catch(() => {
        if (generation === this.generation)
          this.patch({
            status: "disconnected",
            message: "Koneksi room belum stabil. Coba lagi atau Main Sendiri.",
          });
      })
      .finally(() => {
        if (generation === this.generation) this.pendingTrack = false;
      });
  }
  private presence() {
    const { room, self } = this.state;
    if (!self) return;
    const hosts = this.records.filter((r) => r.room?.roomCode === this.code);
    if (room && this.isHost) {
      const winner = hosts
        .map((r) => r.room!)
        .concat(room)
        .sort(
          (a, b) =>
            a.createdAt - b.createdAt || a.hostId.localeCompare(b.hostId),
        )[0];
      if (winner.roomId !== room.roomId) {
        this.fail("closed", "Kode room bertabrakan. Buat room baru.");
        return;
      }
    }
    if (!room) return;
    const present = new Set(
      this.records
        .filter((r) => r.roomId === room.roomId)
        .map((r) => r.player.playerId),
    );
    const now = this.now();
    for (const id of this.members.keys())
      if (id !== self.playerId) {
        if (present.has(id)) this.absent.delete(id);
        else if (!this.absent.has(id)) this.absent.set(id, now);
      }
    this.patch({
      players: this.state.players.map((p) => ({
        ...p,
        disconnected:
          !present.has(p.player.playerId) || now - p.receivedAt > STALE_AFTER,
      })),
    });
  }
  private roster() {
    if (this.state.room && this.isHost)
      this.send({
        type: "roster",
        room: this.state.room,
        members: [...this.members.values()],
      });
  }
  private acceptRoom(room: RoomMetadata, members: MultiplayerPlayer[]) {
    const self = this.state.self;
    if (
      !self ||
      room.roomCode !== this.code ||
      !members.some((p) => p.playerId === room.hostId) ||
      !members.some((p) => p.playerId === self.playerId) ||
      members.length > MAX_PLAYERS
    )
      return;
    const first = !this.state.room;
    if (!first && this.state.room!.roomId !== room.roomId) return;
    this.hostSeen = this.now();
    this.members = new Map(members.map((p) => [p.playerId, p]));
    const admitted = members.find((p) => p.playerId === self.playerId)!;
    const local = {
      ...self,
      mapId: room.mapId,
      ...(first ? { position: { ...admitted.position } } : {}),
    };
    const old = new Map(this.state.players.map((p) => [p.player.playerId, p]));
    this.patch({
      room,
      self: local,
      status: "connected",
      message: "",
      players: members
        .filter((p) => p.playerId !== self.playerId)
        .map(
          (player) =>
            old.get(player.playerId) || {
              player,
              receivedAt: this.now(),
              disconnected: false,
            },
        ),
    });
    if (first) this.track();
  }
  private receive(raw: unknown) {
    if (!asRecord(raw) || typeof raw.type !== "string" || !this.state.self)
      return;
    const { self, room } = this.state,
      now = this.now();
    if (raw.type === "request" && this.isHost && room) {
      const player = readPlayer(raw.player);
      if (!player || player.playerId === self.playerId) return;
      if (
        !this.members.has(player.playerId) &&
        this.members.size >= MAX_PLAYERS
      ) {
        this.send({
          type: "reject",
          roomId: room.roomId,
          recipient: player.playerId,
          reason: "full",
        });
        return;
      }
      // Reserve synchronously before any async send/Presence operation.
      if (!this.members.has(player.playerId)) {
        const map = MAPS[room.mapId];
        const slot = [1, 2, 3].find(
          (i) => ![...this.spawnSlots.values()].includes(i),
        )!;
        this.spawnSlots.set(player.playerId, slot);
        const spawn = map.spawnPoints?.[slot] || map.spawn;
        const admitted = {
          ...player,
          mapId: room.mapId,
          position: { x: spawn[0], y: map.ground(...spawn), z: spawn[1] },
        };
        this.members.set(player.playerId, admitted);
        this.absent.set(player.playerId, now);
        this.patch({
          players: [
            ...this.state.players,
            { player: admitted, receivedAt: now, disconnected: false },
          ],
        });
      }
      this.send({
        type: "welcome",
        room,
        recipient: player.playerId,
        members: [...this.members.values()],
      });
      this.roster();
      return;
    }
    if (raw.type === "welcome" || raw.type === "roster") {
      if (this.isHost) return;
      const metadata = readRoom(raw.room);
      if (
        !metadata ||
        metadata.roomCode !== this.code ||
        !Array.isArray(raw.members) ||
        raw.members.length > MAX_PLAYERS
      )
        return;
      if (!room) {
        if (raw.type !== "welcome" || raw.recipient !== self.playerId) return;
        if (
          !this.records.some(
            (p) =>
              p.room?.roomId === metadata.roomId &&
              p.player.playerId === metadata.hostId,
          )
        )
          return;
      } else if (
        metadata.roomId !== room.roomId ||
        metadata.hostId !== room.hostId ||
        metadata.mapId !== room.mapId
      )
        return;
      const members = raw.members.map(readPlayer);
      if (
        members.some((p) => !p || p.mapId !== metadata.mapId) ||
        new Set(members.map((p) => p?.playerId)).size !== members.length
      )
        return;
      if (room && !members.some((p) => p?.playerId === self.playerId)) {
        this.fail(
          "closed",
          "Sesi room berakhir. Gabung kembali dengan kode room.",
        );
        return;
      }
      this.acceptRoom(metadata, members as MultiplayerPlayer[]);
      return;
    }
    if (
      raw.type === "reject" &&
      !room &&
      raw.recipient === self.playerId &&
      raw.reason === "full" &&
      this.records.some((p) => p.room?.roomId === raw.roomId)
    ) {
      this.fail("full", "Room penuh. Maksimal 4 penjelajah dalam satu room.");
      return;
    }
    if (!room || raw.roomId !== room.roomId) return;
    if (raw.type === "closed" && raw.hostId === room.hostId && !this.isHost) {
      this.fail(
        "closed",
        "Host keluar. Room ditutup; kamu dapat Main Sendiri atau gabung room baru.",
      );
      return;
    }
    if (
      raw.type === "leave" &&
      typeof raw.playerId === "string" &&
      this.members.has(raw.playerId)
    ) {
      if (raw.playerId === room.hostId) {
        this.fail("closed", "Host keluar. Room ditutup.");
        return;
      }
      this.removeMember(raw.playerId);
      if (this.isHost) this.roster();
      return;
    }
    if (raw.type === "pose") {
      const player = readPlayer(raw.player);
      if (
        !player ||
        player.playerId === self.playerId ||
        player.mapId !== room.mapId ||
        !this.members.has(player.playerId) ||
        !Number.isSafeInteger(raw.sequence) ||
        (raw.sequence as number) < 0 ||
        (raw.sequence as number) <= (this.sequences.get(player.playerId) ?? -1)
      )
        return;
      const admitted = this.members.get(player.playerId)!;
      if (
        player.nickname !== admitted.nickname ||
        player.avatarId !== admitted.avatarId ||
        player.profileId !== admitted.profileId
      )
        return;
      this.sequences.set(player.playerId, raw.sequence as number);
      this.members.set(player.playerId, player);
      this.absent.delete(player.playerId);
      if (player.playerId === room.hostId) this.hostSeen = now;
      this.patch({
        players: this.state.players.map((p) =>
          p.player.playerId === player.playerId
            ? { player, receivedAt: now, disconnected: false }
            : p,
        ),
      });
    }
  }
  private removeMember(id: string) {
    this.spawnSlots.delete(id);
    this.members.delete(id);
    this.absent.delete(id);
    this.sequences.delete(id);
    this.patch({
      players: this.state.players.filter((p) => p.player.playerId !== id),
    });
  }
  private tick() {
    const now = this.now(),
      { room, self } = this.state;
    if (!self) return;
    if (!room) {
      if (now - this.startedAt > 10000) {
        this.fail(
          this.connected ? "not-found" : "disconnected",
          this.connected
            ? "Room tidak ditemukan. Periksa kode atau minta host membuat room."
            : "Supabase belum dapat terhubung. Coba lagi atau Main Sendiri.",
        );
        return;
      }
      if (!this.connected) return;
      if (this.request?.mode === "create" && now - this.subscribedAt >= 700) {
        if (this.records.some((r) => r.room?.roomCode === this.code)) {
          this.fail("error", "Kode room telah dipakai. Coba buat room lagi.");
          return;
        }
        const metadata: RoomMetadata = {
          roomCode: this.code,
          roomId: crypto.randomUUID(),
          hostId: self.playerId,
          mapId: self.mapId,
          createdAt: now,
        };
        this.members.set(self.playerId, self);
        this.hostSeen = now;
        this.patch({ room: metadata, status: "connected", message: "" });
        this.track();
      } else if (
        this.request?.mode === "join" &&
        now - this.lastControl >= 500
      ) {
        this.lastControl = now;
        this.send({ type: "request", player: self });
      }
      return;
    }
    if (
      this.state.status === "disconnected" &&
      now - this.hostSeen > REMOVE_AFTER + 2000
    ) {
      this.fail(
        "disconnected",
        "Koneksi room terputus. Coba Lagi untuk membuka sesi baru, atau Main Sendiri.",
      );
      return;
    }
    if (!this.isHost && now - this.hostSeen > REMOVE_AFTER + 1000) {
      this.fail(
        "closed",
        "Host terputus. Room ditutup; Main Sendiri tetap tersedia.",
      );
      return;
    }
    if (this.isHost && this.connected) this.hostSeen = now;
    let changed = false;
    for (const remote of [...this.state.players]) {
      const absentAt = this.absent.get(remote.player.playerId);
      const age = now - remote.receivedAt;
      if (
        age > REMOVE_AFTER ||
        (absentAt !== undefined && now - absentAt > REMOVE_AFTER)
      ) {
        if (this.isHost) {
          this.removeMember(remote.player.playerId);
          changed = true;
        } else
          this.patch({
            players: this.state.players.filter((p) => p !== remote),
          });
      } else if (age > STALE_AFTER && !remote.disconnected)
        this.patch({
          players: this.state.players.map((p) =>
            p === remote ? { ...p, disconnected: true } : p,
          ),
        });
    }
    if (this.connected && now - this.lastControl >= 1000) {
      this.lastControl = now;
      if (this.isHost) {
        this.members.set(self.playerId, { ...self, ...this.latestPose });
        this.roster();
      }
    }
    if (changed) this.roster();
    if (
      this.connected &&
      !this.sending &&
      now - this.lastPose >= (self.status === "playing" ? SEND_INTERVAL : 1000)
    ) {
      this.lastPose = now;
      this.sending = true;
      const generation = this.generation;
      const player = { ...self, ...this.latestPose, lastSeen: now };
      void this.channel
        ?.send({
          type: "pose",
          roomId: room.roomId,
          player,
          sequence: ++this.sequence,
        })
        .catch(() => {
          if (generation === this.generation)
            this.patch({
              status: "disconnected",
              message: "Koneksi terputus. Coba Lagi atau Main Sendiri.",
            });
        })
        .finally(() => {
          if (generation === this.generation) this.sending = false;
        });
    }
  }
  setPose = (pose: PlayerPose) => {
    if (!this.state.self) return;
    const player = readPlayer({
      ...this.state.self,
      ...pose,
      rotation: Math.atan2(Math.sin(pose.rotation), Math.cos(pose.rotation)),
      lastSeen: this.now(),
    });
    // Keep the latest pose without notifying React 60 times/s; the network timer samples it.
    if (player)
      this.latestPose = {
        position: player.position,
        rotation: player.rotation,
        animation: player.animation,
      };
  };
  setPlayerStatus = (status: MultiplayerPlayer["status"]) => {
    if (this.state.self) {
      if (this.latestPose)
        this.latestPose = { ...this.latestPose, animation: "idle" };
      this.patch({
        self: {
          ...this.state.self,
          ...this.latestPose,
          status,
          animation: "idle",
        },
      });
      this.track();
    }
  };
  async leave() {
    const { room, self } = this.state,
      channel = this.channel;
    if (room && self && channel && this.connected) {
      void channel
        .send(
          this.isHost
            ? { type: "closed", roomId: room.roomId, hostId: self.playerId }
            : { type: "leave", roomId: room.roomId, playerId: self.playerId },
        )
        .catch(() => {});
    }
    this.generation++;
    this.connected = false;
    this.channel = null;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.records = [];
    this.members.clear();
    this.spawnSlots.clear();
    this.sequences.clear();
    this.absent.clear();
    this.pendingTrack = false;
    this.sending = false;
    this.lastPose = 0;
    this.latestPose = null;
    this.lastControl = 0;
    this.sequence = 0;
    this.patch(empty());
    if (channel)
      await Promise.race([
        channel.close().catch(() => {}),
        new Promise<void>((resolve) => setTimeout(resolve, 1500)),
      ]);
  }
}
