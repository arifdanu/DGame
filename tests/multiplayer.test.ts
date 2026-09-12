import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MultiplayerService } from "../src/multiplayer/multiplayerService";
import {
  generateRoomCode,
  validRoomCode,
  NICKNAMES,
} from "../src/multiplayer/roomCode";
import {
  interpolatePose,
  readPlayer,
  REMOVE_AFTER,
} from "../src/multiplayer/playerSync";
import {
  MultiplayerConfigError,
  validateConfiguration,
} from "../src/multiplayer/realtimeChannel";
import type {
  ChannelFactory,
  RoomPresence,
  TransportHandlers,
  WireMessage,
  SessionOptions,
} from "../src/multiplayer/types";
interface Client {
  code: string;
  id: string;
  handlers: TransportHandlers;
  presence?: RoomPresence;
  online: boolean;
}
class FakeRealtime {
  clients: Client[] = [];
  sent: { at: number; id: string; message: WireMessage }[] = [];
  sync(code: string) {
    const records = this.clients
      .filter((c) => c.code === code && c.online && c.presence)
      .map((c) => c.presence!);
    for (const c of this.clients.filter((c) => c.code === code && c.online))
      c.handlers.presence(structuredClone(records));
  }
  factory: ChannelFactory = async (code, id, handlers) => {
    const client: Client = { code, id, handlers, online: false };
    this.clients.push(client);
    return {
      subscribe: () => {
        client.online = true;
        handlers.status("subscribed");
        this.sync(code);
      },
      track: async (p) => {
        client.presence = structuredClone(p);
        this.sync(code);
      },
      send: async (message) => {
        if (!client.online) throw Error("offline");
        this.sent.push({
          at: Date.now(),
          id,
          message: structuredClone(message),
        });
        for (const other of this.clients.filter(
          (c) => c !== client && c.online && c.code === code,
        ))
          other.handlers.message(structuredClone(message));
      },
      close: async () => {
        client.online = false;
        client.presence = undefined;
        this.sync(code);
      },
    };
  };
  disconnect(id: string) {
    const c = this.clients.find((c) => c.id === id)!;
    c.online = false;
    c.handlers.status("disconnected");
    this.sync(c.code);
  }
  reconnect(id: string) {
    const c = this.clients.find((c) => c.id === id)!;
    c.online = true;
    c.handlers.status("subscribed");
    this.sync(c.code);
  }
}
const options = (i = 0): SessionOptions => ({
  nickname: NICKNAMES[i],
  avatarId: String(i % 3) as SessionOptions["avatarId"],
  profileId: i % 2 ? "delisha" : "dinar",
});
describe("multiplayer rooms", () => {
  let network: FakeRealtime;
  let services: MultiplayerService[];
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(100000);
    network = new FakeRealtime();
    services = [];
  });
  afterEach(async () => {
    for (const s of services) await s.leave();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });
  const make = () => {
    const s = new MultiplayerService(network.factory);
    services.push(s);
    return s;
  };
  async function host(mapId: "krakatau" | "raja-ampat" = "krakatau") {
    const s = make();
    await s.begin({ ...options(), mode: "create", mapId });
    await vi.advanceTimersByTimeAsync(900);
    return s;
  }
  async function join(code: string, i = 1) {
    const s = make();
    await s.begin({ ...options(i), mode: "join", roomCode: code });
    await vi.advanceTimersByTimeAsync(600);
    return s;
  }
  it("creates a room, admits guests to the host map and never shares progress", async () => {
    const h = await host("raja-ampat");
    const room = h.getSnapshot().room!;
    expect(validRoomCode(room.roomCode)).toBe(true);
    const g = await join(room.roomCode.toLowerCase());
    expect(g.getSnapshot().status).toBe("connected");
    expect(g.getSnapshot().room).toEqual(room);
    expect(h.getSnapshot().players).toHaveLength(1);
    expect(g.getSnapshot().self!.mapId).toBe("raja-ampat");
    h.setPlayerStatus("playing");
    g.setPlayerStatus("playing");
    const snapshot = h.getSnapshot();
    h.setPose({
      position: { x: 4, y: 1, z: 8 },
      rotation: 0.8,
      animation: "jumping",
    });
    expect(h.getSnapshot()).toBe(snapshot);
    await vi.advanceTimersByTimeAsync(200);
    expect(g.getSnapshot().players[0].player.position).toEqual({
      x: 4,
      y: 1,
      z: 8,
    });
    expect(g.getSnapshot().players[0].player.animation).toBe("jumping");
    const payload = JSON.stringify(network.sent);
    expect(payload).not.toMatch(/completed|inventory|badges|email|points/);
  });
  it("serializes simultaneous join requests so a fifth player is rejected", async () => {
    const h = await host(),
      code = h.getSnapshot().room!.roomCode;
    const guests = [1, 2, 3, 4].map(() => make());
    await Promise.all(
      guests.map((s, i) =>
        s.begin({ ...options(i + 1), mode: "join", roomCode: code }),
      ),
    );
    await vi.advanceTimersByTimeAsync(700);
    expect(
      guests.filter((s) => s.getSnapshot().status === "connected"),
    ).toHaveLength(3);
    expect(
      guests.filter((s) => s.getSnapshot().status === "full"),
    ).toHaveLength(1);
    expect(h.getSnapshot().players).toHaveLength(3);
  });
  it("rate limits poses, ignores duplicate sequences and wrong-map payloads", async () => {
    const h = await host(),
      g = await join(h.getSnapshot().room!.roomCode);
    h.setPlayerStatus("playing");
    network.sent = [];
    for (let i = 0; i < 60; i++) {
      h.setPose({
        position: { x: i / 10, y: 0, z: 11 },
        rotation: i / 50,
        animation: "walking",
      });
      await vi.advanceTimersByTimeAsync(16);
    }
    const poses = network.sent.filter(
      (m) =>
        m.message.type === "pose" && m.id === h.getSnapshot().self!.playerId,
    );
    expect(poses.length).toBeLessThanOrEqual(10);
    expect(poses.length).toBeGreaterThan(5);
    const guestClient = network.clients.find(
      (c) => c.id === g.getSnapshot().self!.playerId,
    )!;
    const prior = g.getSnapshot().players[0].player;
    guestClient.handlers.message(poses[0].message);
    expect(g.getSnapshot().players[0].player).toEqual(prior);
    guestClient.handlers.message({
      type: "pose",
      roomId: h.getSnapshot().room!.roomId,
      sequence: 999,
      player: { ...prior, mapId: "raja-ampat" },
    });
    expect(g.getSnapshot().players[0].player).toEqual(prior);
  });
  it("handles graceful guest leave, capacity release and host close", async () => {
    const h = await host(),
      g = await join(h.getSnapshot().room!.roomCode);
    await g.leave();
    expect(h.getSnapshot().players).toHaveLength(0);
    const next = await join(h.getSnapshot().room!.roomCode, 2);
    await h.leave();
    expect(next.getSnapshot().status).toBe("closed");
    expect(next.getSnapshot().players).toHaveLength(0);
  });
  it("marks a dropped guest disconnected, removes it, and releases its slot", async () => {
    const h = await host(),
      g = await join(h.getSnapshot().room!.roomCode);
    network.disconnect(g.getSnapshot().self!.playerId);
    expect(h.getSnapshot().players[0].disconnected).toBe(true);
    await vi.advanceTimersByTimeAsync(REMOVE_AFTER + 500);
    expect(h.getSnapshot().players).toHaveLength(0);
  });
  it("recovers a brief connection break but closes the room after host timeout", async () => {
    const h = await host(),
      g = await join(h.getSnapshot().room!.roomCode);
    const id = h.getSnapshot().self!.playerId;
    network.disconnect(id);
    expect(h.getSnapshot().status).toBe("disconnected");
    await vi.advanceTimersByTimeAsync(1500);
    network.reconnect(id);
    await vi.advanceTimersByTimeAsync(1100);
    expect(h.getSnapshot().status).toBe("connected");
    expect(g.getSnapshot().status).toBe("connected");
    network.disconnect(id);
    await vi.advanceTimersByTimeAsync(REMOVE_AFTER + 1500);
    expect(g.getSnapshot().status).toBe("closed");
  });
  it("reports malformed/nonexistent codes and connection failures without a room", async () => {
    const invalid = await join("!");
    expect(invalid.getSnapshot().status).toBe("not-found");
    const missing = await join("ZZZZ99");
    await vi.advanceTimersByTimeAsync(10500);
    expect(missing.getSnapshot().status).toBe("not-found");
    const unconfigured = new MultiplayerService(async () => {
      throw new MultiplayerConfigError("Belum tersedia");
    });
    services.push(unconfigured);
    await unconfigured.begin({
      ...options(),
      mode: "create",
      mapId: "krakatau",
    });
    expect(unconfigured.getSnapshot().status).toBe("unconfigured");
    expect(unconfigured.getSnapshot().room).toBeNull();
  });
  it("shows a safe error when browser cryptography is unavailable", async () => {
    vi.stubGlobal("crypto", {});
    const service = make();
    await service.begin({ ...options(), mode: "create", mapId: "krakatau" });
    expect(service.getSnapshot().status).toBe("error");
    expect(service.getSnapshot().message).toContain("HTTPS");
    expect(service.getSnapshot().room).toBeNull();
    expect(network.clients).toHaveLength(0);
  });
  it("cleans up a canceled connection and does not resurrect a left room", async () => {
    let resolve: () => void = () => {};
    const delayed = new MultiplayerService(async (...args) => {
      await new Promise<void>((r) => {
        resolve = r;
      });
      return network.factory(...args);
    });
    services.push(delayed);
    const pending = delayed.begin({
      ...options(),
      mode: "create",
      mapId: "krakatau",
    });
    await Promise.resolve();
    await delayed.leave();
    resolve();
    await pending;
    await vi.advanceTimersByTimeAsync(1000);
    expect(delayed.getSnapshot().status).toBe("idle");
    expect(network.clients.every((c) => !c.online)).toBe(true);
  });
});
describe("wire validation and interpolation", () => {
  it("generates six-character codes using crypto randomness", () => {
    const codes = Array.from({ length: 100 }, generateRoomCode);
    expect(codes.every(validRoomCode)).toBe(true);
    expect(new Set(codes).size).toBe(100);
  });
  it("only accepts anon keys and safe endpoints; refuses service-role/secret keys", () => {
    const jwt = (role: string) =>
      `eyJhbGciOiJIUzI1NiJ9.${btoa(JSON.stringify({ role }))}.signature`;
    expect(
      validateConfiguration("https://example.supabase.co", jwt("anon")).url,
    ).toBe("https://example.supabase.co");
    for (const key of [
      jwt("service_role"),
      "sb_secret_hidden",
      "",
      jwt("authenticated"),
    ])
      expect(() =>
        validateConfiguration("https://example.supabase.co", key),
      ).toThrow(MultiplayerConfigError);
    expect(() =>
      validateConfiguration("http://public.example", jwt("anon")),
    ).toThrow();
  });
  it("rejects arbitrary nickname text, NaN, out-of-bounds positions and invalid avatar IDs", () => {
    const player = {
      ...options(),
      playerId: crypto.randomUUID(),
      mapId: "krakatau",
      position: { x: 0, y: 0, z: 11 },
      rotation: 0,
      animation: "idle",
      lastSeen: 1,
      status: "lobby",
    };
    expect(readPlayer(player)).not.toBeNull();
    for (const change of [
      { nickname: "email@example.com" },
      { position: { x: 1000, y: 0, z: 0 } },
      { rotation: NaN },
      { avatarId: "9" },
    ])
      expect(readPlayer({ ...player, ...change })).toBeNull();
    expect(readPlayer({ ...player, inventory: "private" })).not.toHaveProperty(
      "inventory",
    );
  });
  it("smooths position and takes the shortest angle without instant teleporting", () => {
    const a = {
        position: { x: 0, y: 0, z: 0 },
        rotation: 3.1,
        animation: "idle" as const,
      },
      b = {
        position: { x: 10, y: 2, z: 5 },
        rotation: -3.1,
        animation: "walking" as const,
      };
    const next = interpolatePose(a, b, 1 / 60);
    expect(next.position.x).toBeGreaterThan(0);
    expect(next.position.x).toBeLessThan(3);
    expect(Math.abs(next.rotation - a.rotation)).toBeLessThan(0.1);
  });
});
