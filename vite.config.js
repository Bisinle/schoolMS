import { defineConfig } from 'vite'
import laravel from 'laravel-vite-plugin'
import react from '@vitejs/plugin-react'

// Use esbuild-wasm fallback
import * as esbuild from 'esbuild-wasm'

export default defineConfig({
  plugins: [
    laravel({
      input: ['resources/js/app.jsx'],
      refresh: true,
    }),
    react(),
  ],
  optimizeDeps: {
    esbuildOptions: {
      // Ensure we use the wasm version instead of the native binary
      plugins: [],
      loader: {
        '.js': 'jsx',
      },
    },
  },
  build: {
    target: 'esnext',
  },
})
