import type { BrowserContext, WebSocketRoute } from "@playwright/test";
// Test-only Phoenix/Realtime protocol simulator. The browser uses the real Supabase SDK.
// No production runtime, fallback transport, database, or public room service uses this file.
type Payload = Record<string, unknown>;
type Frame = [string | null, string | null, string, string, Payload];
interface Peer {
  ws: WebSocketRoute;
  context: string;
  topic: string;
  ref: string | null;
  key: string;
  presence?: Payload;
  closed: boolean;
  revision: number;
}
function decode(raw: string | Buffer): Frame {
  if (typeof raw === "string") return JSON.parse(raw) as Frame;
  if (raw[0] !== 3) throw Error("Unexpected Realtime binary frame");
  let offset = 7;
  const take = (n: number) => {
    const s = raw.subarray(offset, offset + n).toString("utf8");
    offset += n;
    return s;
  };
  const join = take(raw[1]),
    ref = take(raw[2]),
    topic = take(raw[3]),
    event = take(raw[4]);
  take(raw[5]);
  return [
    join,
    ref,
    topic,
    "broadcast",
    {
      type: "broadcast",
      event,
      payload: JSON.parse(raw.subarray(offset).toString("utf8")),
    },
  ];
}
export class SupabaseMock {
  peers: Peer[] = [];
  messages: Payload[] = [];
  private offline = new Set<string>();
  private send(
    p: Peer,
    event: string,
    payload: Payload,
    ref: string | null = null,
  ) {
    if (!p.closed)
      p.ws.send(JSON.stringify([p.ref, ref, p.topic, event, payload]));
  }
  private sync(topic: string) {
    const state: Payload = {};
    for (const p of this.peers.filter(
      (p) => p.topic === topic && !p.closed && p.presence,
    ))
      state[p.key] = {
        metas: [{ ...p.presence, phx_ref: `${p.key}-${p.ref}-${p.revision}` }],
      };
    for (const p of this.peers.filter((p) => p.topic === topic && !p.closed))
      this.send(p, "presence_state", state);
  }
  private close(p: Peer) {
    if (p.closed) return;
    p.closed = true;
    p.presence = undefined;
    this.sync(p.topic);
  }
  async attach(context: BrowserContext, name: string) {
    await context.routeWebSocket("**/realtime/v1/websocket**", (ws) => {
      const p: Peer = {
        ws,
        context: name,
        topic: "",
        ref: null,
        key: "",
        closed: false,
        revision: 0,
      };
      this.peers.push(p);
      if (this.offline.has(name)) {
        p.closed = true;
        ws.close();
        return;
      }
      ws.onClose(() => this.close(p));
      ws.onMessage((raw) => {
        const [join, ref, topic, event, payload] = decode(raw);
        if (event === "heartbeat") {
          ws.send(
            JSON.stringify([
              join,
              ref,
              topic,
              "phx_reply",
              { status: "ok", response: {} },
            ]),
          );
          return;
        }
        p.topic = topic;
        if (event === "phx_join") {
          p.ref = join || ref;
          const config = payload.config as { presence?: { key?: string } };
          p.key = config.presence?.key || name;
          this.send(
            p,
            "phx_reply",
            { status: "ok", response: { postgres_changes: [] } },
            ref,
          );
          this.sync(topic);
        } else if (event === "heartbeat") {
          this.send(p, "phx_reply", { status: "ok", response: {} }, ref);
        } else if (event === "presence") {
          p.revision++;
          p.presence =
            payload.event === "track"
              ? (payload.payload as Payload)
              : undefined;
          this.send(p, "phx_reply", { status: "ok", response: {} }, ref);
          this.sync(topic);
        } else if (event === "broadcast") {
          this.messages.push(payload.payload as Payload);
          this.send(p, "phx_reply", { status: "ok", response: {} }, ref);
          for (const other of this.peers.filter(
            (q) => q !== p && q.topic === topic && !q.closed,
          ))
            this.send(other, "broadcast", payload);
        } else if (event === "phx_leave") {
          this.send(p, "phx_reply", { status: "ok", response: {} }, ref);
          this.close(p);
        } else if (event === "access_token") {
          this.send(p, "phx_reply", { status: "ok", response: {} }, ref);
        }
      });
    });
  }
  setOffline(context: string, value: boolean) {
    if (value) {
      this.offline.add(context);
      for (const p of this.peers.filter(
        (p) => p.context === context && !p.closed,
      )) {
        this.close(p);
        p.ws.close();
      }
    } else this.offline.delete(context);
  }
}
