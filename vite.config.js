import { defineConfig } from 'vite'
import eslint from 'vite-plugin-eslint'
import react from '@vitejs/plugin-react'
// import dotenv from 'dotenv';

// dotenv.config();
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), eslint({
    cache: false, emitWarning: true, // Emit warnings instead of errors
    emitError: false, // Avoid stopping the build on errors
    failOnWarning: false,
    failOnError: false,
  })],
  build: {
    sourcemap: true
  },
  server: {
    port: 8675,
  }
})
