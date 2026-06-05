import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// Deduplicate React to avoid the two-React-copies hook error.
// The app has React 19 in its own node_modules, but the DS was built
// against the root React 18. Force both to resolve to the same instance.
const reactPath = path.resolve(__dirname, '../../node_modules/react')
const reactDomPath = path.resolve(__dirname, '../../node_modules/react-dom')

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    dedupe: ['react', 'react-dom', 'react/jsx-runtime'],
    alias: {
      react: reactPath,
      'react-dom': reactDomPath,
    },
  },
})
