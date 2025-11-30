import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'
import { copyFileSync, mkdirSync, existsSync } from 'fs'

function copyManifestPlugin() {
  return {
    name: 'copy-manifest',
    writeBundle() {
      copyFileSync(
        resolve(__dirname, 'manifest.json'),
        resolve(__dirname, 'dist/manifest.json')
      )

      const iconsDir = resolve(__dirname, 'dist/icons')
      if (!existsSync(iconsDir)) {
        mkdirSync(iconsDir, { recursive: true })
      }

      const sourceIconsDir = resolve(__dirname, 'icons')
      if (existsSync(sourceIconsDir)) {
        const sizes = ['16', '32', '48', '128']
        for (const size of sizes) {
          const iconPath = resolve(sourceIconsDir, `icon${size}.png`)
          if (existsSync(iconPath)) {
            copyFileSync(iconPath, resolve(iconsDir, `icon${size}.png`))
          }
        }
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), copyManifestPlugin()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'popup.html'),
        background: resolve(__dirname, 'src/background.ts'),
        content: resolve(__dirname, 'src/content.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '../../packages/ui/src'),
    },
  },
})
