import { useEffect } from "react";
import { OFFLINE } from "../content/levels";
interface WebContext {
  registerTool(
    tool: {
      name: string;
      title: string;
      description: string;
      inputSchema: object;
      annotations: { readOnlyHint: boolean };
      execute: (input: unknown) => unknown;
    },
    options: { signal: AbortSignal },
  ): void | Promise<void>;
}
// Hanya materi publik; tidak mengekspos PIN, statistik, atau perubahan batas waktu.
export function useWebTools() {
  useEffect(() => {
    const context = (document as Document & { modelContext?: WebContext })
      .modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    try {
      void Promise.resolve(
        context.registerTool(
          {
            name: "read_offline_activities",
            title: "Ide kegiatan tanpa layar",
            description:
              "Baca dua belas kegiatan aman untuk dilakukan bersama pendamping setelah bermain.",
            inputSchema: {
              type: "object",
              properties: {},
              additionalProperties: false,
            },
            annotations: { readOnlyHint: true },
            execute(input) {
              if (
                typeof input !== "object" ||
                input === null ||
                Array.isArray(input) ||
                Object.keys(input).length
              )
                throw new Error("Masukan harus objek kosong.");
              return OFFLINE.map(([title, instruction]) => ({
                title,
                instruction,
              }));
            },
          },
          { signal: lifecycle.signal },
        ),
      ).catch(() => {
        /* API eksperimental bersifat opsional. */
      });
    } catch {
      /* UI tetap tersedia jika WebMCP tidak didukung. */
    }
    return () => lifecycle.abort();
  }, []);
}
