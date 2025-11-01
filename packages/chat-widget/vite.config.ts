import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig(({ command }) => ({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'ChatDesk',
      fileName: () => 'widget.js',
      formats: ['iife'],
    },
    outDir: 'dist',
    emptyOutDir: true,
    minify: 'terser',
    sourcemap: true,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(command === 'serve' ? 'development' : 'production'),
  },
  server: {
    port: 3001,
    cors: true,
    open: false,
  },
  // In dev mode, serve from root. In production, the built widget.js will be used
  root: command === 'serve' ? __dirname : undefined,
}));

