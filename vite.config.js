import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 5190 },
  build: {
    rollupOptions: {
      output: {
        // Clearpath ships as ONE self-contained HTML file, so the build must
        // produce one JS chunk. Without this, Vite splits the lazily imported
        // Firebase SDK into separate files that the single-file build cannot
        // inline, and sign-in 404s wherever that file is served from.
        inlineDynamicImports: true,
      },
    },
    chunkSizeWarningLimit: 1600,
  },
})
