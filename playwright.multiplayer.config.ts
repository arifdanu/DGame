import { defineConfig } from "@playwright/test";
// Dummy anon JWT: no real Supabase project, privilege or credential. WebSockets are routed in tests.
const anon = `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({ role: "anon", exp: 4102444800 })).toString("base64url")}.test-only`;
export default defineConfig({
  testDir: "./e2e",
  testMatch: "multiplayer.spec.ts",
  fullyParallel: false,
  workers: 1,
  timeout: 90000,
  expect: { timeout: 12000 },
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report-multiplayer", open: "never" }],
  ],
  outputDir: "test-results-multiplayer",
  use: {
    baseURL: "http://127.0.0.1:5176",
    headless: true,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run dev -- --port 5176 --strictPort",
    url: "http://127.0.0.1:5176",
    reuseExistingServer: false,
    env: {
      VITE_SUPABASE_URL: "https://realtime-test.invalid",
      VITE_SUPABASE_ANON_KEY: anon,
    },
  },
  projects: [
    {
      name: "chromium",
      use: {
        browserName: "chromium",
        channel: process.env.PLAYWRIGHT_CHANNEL || "chrome",
      },
    },
  ],
});
