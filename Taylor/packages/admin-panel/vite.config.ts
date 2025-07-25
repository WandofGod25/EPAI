import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import path from "path"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  server: {
    fs: {
      // Allow serving files from the root node_modules directory
      allow: [
        '.', // The project root (packages/admin-panel)
        path.resolve(__dirname, '..', '..', 'node_modules'), // The root node_modules
        path.resolve(__dirname, '..'), // Allow access to sibling packages
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@epai/insight-sdk": path.resolve(__dirname, "../insight-sdk/src"),
    },
  },
  optimizeDeps: {
    exclude: ['recharts', 'd3-shape'],
    include: ['@epai/insight-sdk'],
  },
}) 