import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import tsconfigPaths from 'vite-tsconfig-paths'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    fs: {
      // Allow serving files from one level up to the project root
      allow: ['..'],
    },
  },
  optimizeDeps: {
    include: [
      'react-router-dom',
      'lucide-react',
      '@radix-ui/react-slot',
      '@radix-ui/react-label',
      '@radix-ui/react-toast',
      '@radix-ui/react-alert-dialog'
    ],
  },
})
