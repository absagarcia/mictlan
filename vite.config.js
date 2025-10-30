import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // HTTP for development
  server: {
    https: false,
    host: true,
    port: 3000
  },
  
  // Preview server also needs HTTPS
  preview: {
    https: true,
    host: true,
    port: 4173
  },

  // Build configuration with code splitting
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          // Three.js in separate chunk
          three: ['three'],
          // AR components in separate chunk
          ar: [
            './src/components/ar/ARAltarComponent.js',
            './src/components/ar/ARManager.js',
            './src/services/ARService.js'
          ],
          // Memory components in separate chunk
          memory: [
            './src/components/memory/MemoryBookComponent.js',
            './src/components/memory/MemoryForm.js',
            './src/components/memory/MemoryGallery.js'
          ]
        }
      }
    }
  },

  // PWA Configuration
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Mictla - Altar de Muertos AR',
        short_name: 'Mictla',
        description: 'Explora altares de muertos en realidad aumentada y crea un libro de memorias familiar',
        theme_color: '#D97706',
        background_color: '#1F2937',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,gltf,glb,jpg,jpeg,webp,mp3,wav}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheKeyWillBeUsed: async ({ request }) => {
                return `${request.url}?v=1`
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|webp|gltf|glb)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          }
        ]
      }
    })
  ],

  // Optimize dependencies
  optimizeDeps: {
    include: ['three']
  },

  // Define global constants
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString())
  }
})