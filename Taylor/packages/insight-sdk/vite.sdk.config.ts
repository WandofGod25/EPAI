import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      // The entry point for the standalone SDK loader
      entry: resolve(__dirname, 'src/sdk-loader.ts'),
      name: 'EPAIInsightSDK',
      fileName: 'epai-sdk',
      formats: ['es', 'umd', 'iife'],
    },
    outDir: 'dist/standalone',
    emptyOutDir: false, // Don't clear the main build output
    sourcemap: true,
    minify: true,
    rollupOptions: {
      // Make sure to exclude React from the bundle since it's not needed for the standalone SDK
      external: ['react', 'react-dom'],
      output: {
        // Global variable name when included via script tag
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
  },
}); 