import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      '~bootstrap': path.resolve(__dirname, 'node_modules/bootstrap'),
      'bootstrap': path.resolve(__dirname, 'node_modules/bootstrap'),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        quietDeps: true,
        api: 'modern-compiler',
        loadPaths: [path.resolve(__dirname, 'node_modules')],
        silenceDeprecations: ['import', 'global-builtin', 'color-functions'],
      },
    },
  },
  build: {
    // Vercel warninglarini azaltmak ve cache'i iyilestirmek icin vendor parcalama
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;

          // DO NOT use id.includes('react'): it matches @kinde-oss/kinde-auth-react, react-router, etc.
          // and can bundle unrelated packages with React core → broken Children / duplicate React at runtime.
          if (
            /[/\\]node_modules[/\\]react[/\\]/.test(id) ||
            /[/\\]node_modules[/\\]react-dom[/\\]/.test(id) ||
            /[/\\]node_modules[/\\]scheduler[/\\]/.test(id)
          ) {
            return 'vendor-react';
          }
          if (id.includes('i18next')) return 'vendor-i18n';
          if (id.includes('chart.js') || id.includes('apexcharts') || id.includes('echarts') || id.includes('recharts')) {
            return 'vendor-charts';
          }
          if (id.includes('fullcalendar')) return 'vendor-calendar';
          if (id.includes('ckeditor') || id.includes('tinymce') || id.includes('draft-js')) return 'vendor-editors';

          return 'vendor-misc';
        },
      },
    },
  },
})
