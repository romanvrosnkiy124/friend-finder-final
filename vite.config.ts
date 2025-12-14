import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode, command }) => {
    const env = loadEnv(mode, '.', '');
    
    // УМНАЯ ЛОГИКА:
    // Если мы делаем сборку (npm run build) -> ставим путь './' (для телефона)
    // Если мы просто запускаем (npm run dev) -> ставим путь '/' (для компьютера)
    const baseUrl = command === 'build' ? './' : '/';

    return {
      base: baseUrl,
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        outDir: 'dist',
      }
    };
});