import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        filename: 'manifest.json',
        devOptions: {
          enabled: false,
          type: 'module'
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          navigateFallback: '/index.html',
          navigateFallbackAllowlist: [/^(?!\/__).*/],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /^https:\/\/(images\.unsplash\.com|cdn-icons-png\.flaticon\.com)\/.*/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'external-images-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 30 // <== 30 days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        },
        manifest: {
          id: '/',
          name: 'متجر النخبة للإلكترونيات',
          short_name: 'النخبة',
          description: 'متجر النخبة للإلكترونيات ومنظومات الطاقة الشمسية - الوجهة الأولى للأجهزة التقنية والطاقة المتجددة في اليمن',
          theme_color: '#C5A059',
          background_color: '#0F172A',
          display: 'standalone',
          display_override: ['window-controls-overlay', 'standalone', 'minimal-ui'],
          scope: '/',
          start_url: '/',
          orientation: 'portrait',
          categories: ['electronics', 'shopping'],
          shortcuts: [
            {
              name: 'طلباتي',
              short_name: 'طلباتي',
              description: 'عرض ومتابعة طلباتك السابقة',
              url: '/profile?tab=orders',
              icons: [{ src: 'https://cdn-icons-png.flaticon.com/512/1008/1008010.png', sizes: '192x192' }]
            },
            {
              name: 'العروض الجديدة',
              short_name: 'العروض',
              description: 'تصفح أحدث الخصومات والعروض',
              url: '/deals',
              icons: [{ src: 'https://cdn-icons-png.flaticon.com/512/732/732158.png', sizes: '192x192' }]
            },
            {
              name: 'بحث عن منتج',
              short_name: 'بحث',
              description: 'البحث السريع في المتجر',
              url: '/search',
              icons: [{ src: 'https://cdn-icons-png.flaticon.com/512/622/622669.png', sizes: '192x192' }]
            }
          ],
          screenshots: [
            {
              src: 'https://picsum.photos/seed/elite-mobile/1080/1920',
              sizes: '1080x1920',
              type: 'image/png',
              form_factor: 'narrow',
              label: 'واجهة متجر النخبة على الجوال'
            },
            {
              src: 'https://picsum.photos/seed/elite-desktop/1920/1080',
              sizes: '1920x1080',
              type: 'image/png',
              form_factor: 'wide',
              label: 'واجهة متجر النخبة على الحاسوب'
            }
          ],
          icons: [
            {
              src: 'https://images.unsplash.com/photo-1546768292-fb12f6c92568?auto=format&fit=crop&q=80&w=192&h=192',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: 'https://images.unsplash.com/photo-1546768292-fb12f6c92568?auto=format&fit=crop&q=80&w=512&h=512',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: 'https://images.unsplash.com/photo-1546768292-fb12f6c92568?auto=format&fit=crop&q=80&w=512&h=512',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            }
          ]
        }
      })
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY || env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
