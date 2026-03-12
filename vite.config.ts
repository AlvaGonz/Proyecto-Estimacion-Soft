import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './vitest.setup.ts',
      include: ['**/*.test.{ts,tsx}'],
      exclude: ['**/node_modules/**', '**/server/**', '**/dist/**'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'lcov', 'html'],
        exclude: ['node_modules/', 'dist/', '*.config.*', 'PWF*/**'],
        thresholds: {
          lines: 70,
          functions: 70,
          branches: 60,
          statements: 70,
        },
      },
    },
    server: {
      port: 3001,
      host: '0.0.0.0',
      hmr: {
        port: 3001,
      },
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
    }
  };
});
