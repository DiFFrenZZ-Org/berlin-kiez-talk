import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
// import { componentTagger } from 'lovable-tagger';
import tailwindcss from 'tailwindcss';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    server: {
      host: '::',
      port: 8080,
      proxy: {
      '/events': 'http://localhost:3000'
    },
    },
    plugins: [
      react(),
    ],
    css: {
      postcss: {
        plugins: [
          tailwindcss()  // Proper Tailwind integration via PostCSS
        ]
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    define: {
      'process.env': env,
    },
  };
});
