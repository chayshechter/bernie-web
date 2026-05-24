import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const pkg = JSON.parse(
  readFileSync(fileURLToPath(new URL('./package.json', import.meta.url)), 'utf-8'),
) as { version: string }

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    sentryVitePlugin({
      org: 'bernie-daily',
      project: 'javascript-react',
      authToken: process.env.SENTRY_AUTH_TOKEN,
      disable: !process.env.SENTRY_AUTH_TOKEN,
      sourcemaps: {
        filesToDeleteAfterUpload: ['./dist/**/*.map'],
      },
    }),
  ],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  build: {
    sourcemap: true,
  },
})