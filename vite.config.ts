import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png', 'offline.html'],
        manifest: {
          name: 'Subul - Gas Distribution System',
          short_name: 'Subul',
          description: 'Gas distribution and delivery management system',
          theme_color: '#ffffff',
          icons: [
            {
              src: '/icons/icon-192x192.svg',
              sizes: '192x192',
              type: 'image/svg+xml'
            },
            {
              src: '/icons/icon-512x512.svg',
              sizes: '512x512',
              type: 'image/svg+xml'
            }
          ]
        },
        workbox: {
          // Never cache the API calls or authenticated routes
          navigateFallbackDenylist: [/^\/api\//, /^\/admin\//, /^\/distributor\//],
          
          // Skip service worker registration after login
          skipWaiting: true,
          clientsClaim: true,
          
          // Improved cache management
          cleanupOutdatedCaches: true,
          
          // Disable runtime caching for authenticated routes
          runtimeCaching: [
            // Root page - network first with short cache
            {
              urlPattern: /\/$/,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'start-url',
                expiration: {
                  maxEntries: 1,
                  maxAgeSeconds: 60 * 5 // 5 minutes
                }
              }
            },
            
            // Login page - ALWAYS use network only (never cache)
            {
              urlPattern: /^\/login\/?$/,
              handler: 'NetworkOnly',
              options: {
                cacheName: 'login-page'
              }
            },
            
            // JavaScript and CSS files - network first with medium cache
            {
              urlPattern: /\.(?:js|css)$/,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'js-css',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 // 1 hour
                }
              }
            },
            
            // Images - cache first with long cache
            {
              urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'images',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 // 24 hours
                }
              }
            },
            
            // Google Fonts stylesheets
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
                }
              }
            },
            
            // Google Fonts webfonts
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
                }
              }
            }
          ]
        },
        devOptions: {
          enabled: false
        }
      })
    ],
    define: {
      'import.meta.env': env
    },
    optimizeDeps: {
      exclude: ['lucide-react']
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts']
    }
  };
});
