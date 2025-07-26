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
          name: 'سُبل | نظام إدارة الطلبات',
          short_name: 'سُبل',
          description: 'نظام إدارة الطلبات والتوزيع',
          theme_color: '#3b82f6',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          background_color: '#ffffff',
          icons: [
            {
              src: '/icons/icon-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: '/icons/icon-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: '/icons/icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        },
        workbox: {
          // Never cache the API calls
          navigateFallbackDenylist: [/^\/api\//],
          
          // Don't precache authenticated routes
          globIgnores: ['**/admin/**/*', '**/distributor/**/*'],
          
          // Don't allow runtime caching for authenticated routes
          runtimeCaching: [
            // Only cache the root index.html and non-authenticated pages
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
            {
              urlPattern: /^\/login\/?$/,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'login-page',
                expiration: {
                  maxEntries: 1,
                  maxAgeSeconds: 60 * 5 // 5 minutes
                }
              }
            },
            // Cache assets but with a short expiration
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
            // Cache font files
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
        // Don't try to cache authenticated pages
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'sw.js',
        minify: true,
        injectRegister: 'auto',
        // Disable service worker in development
        devOptions: {
          enabled: false,
          type: 'module'
        }
      })
    ],
    define: {
      'import.meta.env': env, // Ensure env variables are available
    },
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
    }
  };
});
