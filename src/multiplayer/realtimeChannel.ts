import type { ChannelFactory } from "./types";
export class MultiplayerConfigError extends Error {}
const textValue = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

export function validateConfiguration(
  url: unknown,
  anonKey: unknown,
  publishableKey?: unknown,
) {
  const endpoint = textValue(url);
  // Prefer the explicit publishable key; empty values fall back to the legacy name.
  const publishable = textValue(publishableKey);
  const key = publishable || textValue(anonKey);
  const keyName = publishable
    ? "VITE_SUPABASE_PUBLISHABLE_KEY"
    : "VITE_SUPABASE_ANON_KEY";
  const missing = [
    ...(!endpoint ? ["VITE_SUPABASE_URL"] : []),
    ...(!key
      ? [
          "VITE_SUPABASE_ANON_KEY atau VITE_SUPABASE_PUBLISHABLE_KEY (isi salah satu)",
        ]
      : []),
  ];
  if (missing.length)
    throw new MultiplayerConfigError(
      `Environment belum tersedia pada build: ${missing.join("; ")}. Periksa environment Vercel (Production/Preview), lalu build ulang atau redeploy. Main Sendiri tetap tersedia.`,
    );
  try {
    const parsed = new URL(endpoint);
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
  } catch {
    throw new MultiplayerConfigError(
      "VITE_SUPABASE_URL tidak valid. Gunakan URL project Supabase (HTTPS). Main Sendiri tetap tersedia.",
    );
  }
  try {
    // Publishable keys are opaque, not JWTs. Either env name can contain one.
    if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)) {
      const claims = JSON.parse(
        atob(key.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
      );
      if (claims.role !== "anon") throw Error();
    }
  } catch {
    throw new MultiplayerConfigError(
      `${keyName} tidak valid. Gunakan publishable key (sb_publishable_...) atau legacy anon key; jangan gunakan service_role atau secret key. Main Sendiri tetap tersedia.`,
    );
  }
  return { url: endpoint, key };
}

let lastConfigWarning = "";
export function readRealtimeConfiguration() {
  try {
    const config = validateConfiguration(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY,
      import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    );
    lastConfigWarning = "";
    return config;
  } catch (error) {
    // Only our static, sanitized diagnostics are logged. Never log env values,
    // the config object, or exceptions from URL/JWT parsing. Avoid retry spam.
    if (
      error instanceof MultiplayerConfigError &&
      error.message !== lastConfigWarning
    ) {
      lastConfigWarning = error.message;
      console.warn(`[Multiplayer config] ${error.message}`);
    }
    throw error;
  }
}
export const createRealtimeChannel: ChannelFactory = async (
  code,
  playerId,
  handlers,
) => {
  const { url, key } = readRealtimeConfiguration();
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
