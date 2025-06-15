// @ts-check
import { defineConfig } from 'astro/config'

import cloudflare from '@astrojs/cloudflare'
import tailwindcss from '@tailwindcss/vite'

const isDev = process.env.NODE_ENV === 'development'

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: isDev
    ? undefined
    : cloudflare({
        platformProxy: {
          enabled: true
        }
      }),
  devToolbar: {
    enabled: false
  },
  vite: {
    plugins: [tailwindcss()]
  }
})
