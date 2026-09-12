import type { ChannelFactory } from "./types";
export class MultiplayerConfigError extends Error {}
export function validateConfiguration(url: unknown, key: unknown) {
  if (
    typeof url !== "string" ||
    !url.trim() ||
    typeof key !== "string" ||
    !key.trim()
  )
    throw new MultiplayerConfigError(
      "Main Bersama belum disiapkan. Main Sendiri tetap tersedia.",
    );
  try {
    const parsed = new URL(url);
    if (
      parsed.username ||
      parsed.password ||
      parsed.search ||
      parsed.hash ||
      !(
        parsed.protocol === "https:" ||
        (parsed.protocol === "http:" &&
          ["localhost", "127.0.0.1"].includes(parsed.hostname))
      )
    )
      throw Error();
    const claims = JSON.parse(
      atob(key.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
    );
    if (claims.role !== "anon") throw Error();
  } catch {
    throw new MultiplayerConfigError(
      "Konfigurasi Main Bersama belum sesuai. Gunakan URL Supabase dan anon key; Main Sendiri tetap tersedia.",
    );
  }
  return { url: url.trim(), key: key.trim() };
}
export const createRealtimeChannel: ChannelFactory = async (
  code,
  playerId,
  handlers,
) => {
  const { url, key } = validateConfiguration(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY,
  );
  const { createClient } = await import("@supabase/supabase-js");
  const client = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    realtime: { params: { eventsPerSecond: 15 } },
  });
  // This project has no Auth or membership RLS. Code-only fallback is explicit, not
  // an automatic downgrade from failed private authorization. See MULTIPLAYER.md.
  const channel = client.channel(`game-room:${code}`, {
    config: {
      private: false,
      presence: { key: playerId },
      broadcast: { ack: true, self: false },
    },
  });
  channel
    .on("presence", { event: "sync" }, () =>
      handlers.presence(Object.values(channel.presenceState()).flat()),
    )
    .on("broadcast", { event: "game" }, ({ payload }) =>
      handlers.message(payload),
    );
  return {
    subscribe: () => {
      channel.subscribe((status) =>
        handlers.status(
          status === "SUBSCRIBED" ? "subscribed" : "disconnected",
        ),
      );
    },
    track: async (record) => {
      const result = await channel.track(record);
      if (result !== "ok") throw Error("Presence unavailable");
    },
    send: async (message) => {
      const result = await channel.send({
        type: "broadcast",
        event: "game",
        payload: message,
      });
      if (result !== "ok") throw Error("Broadcast unavailable");
    },
    close: async () => {
      await client.removeChannel(channel);
      client.realtime.disconnect();
    },
  };
};
