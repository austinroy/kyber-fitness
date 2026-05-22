import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import netlify from '@netlify/vite-plugin-tanstack-start'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const __dirname = dirname(fileURLToPath(import.meta.url))

const config = defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: {
      'use-sync-external-store/shim/index.js': resolve(
        __dirname,
        'src/lib/use-sync-external-store-shim.ts',
      ),
    },
  },
  plugins: [devtools(), tailwindcss(), tanstackStart(), netlify(), viteReact()],
  ssr: {
    noExternal: ['@clerk/tanstack-start']
  }
})

export default config
