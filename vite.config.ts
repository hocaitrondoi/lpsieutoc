// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
// @cloudflare/vite-plugin builds from this — wrangler.jsonc main alone is insufficient.
export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
    prerender: { enabled: false },
  },
  define: {
    'process.env.SUPABASE_URL': JSON.stringify("https://wxunzxeibfkdvpyngazq.supabase.co"),
    'process.env.SUPABASE_PUBLISHABLE_KEY': JSON.stringify("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4dW56eGVpYmZrZHZweW5nYXpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2MTIwOTksImV4cCI6MjA5NTE4ODA5OX0.WNos1fc8tFd0VUrVmV3KIe8NMWgG0pKOFyzR9ATajM0"),
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify("https://wxunzxeibfkdvpyngazq.supabase.co"),
    'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4dW56eGVpYmZrZHZweW5nYXpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2MTIwOTksImV4cCI6MjA5NTE4ODA5OX0.WNos1fc8tFd0VUrVmV3KIe8NMWgG0pKOFyzR9ATajM0")
  }
});
