// vite.config.ts
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import tailwindcss from 'tailwindcss';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    /* ---------- global plugins & aliases ---------- */
    plugins: [react()],
    css: {
      postcss: { plugins: [tailwindcss()] },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    define: {
      'process.env': env,
    },

    /* ---------- dev-server settings --------------- */
    server: {
      host: '::',
      port: 8080,
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
        },
        '/events': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },
  };
});
