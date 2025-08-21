import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'samsara-bus-react': '../../src/index.ts',
      'samsara-bus-ts': '../../../samsara-bus-ts/src/index.ts'
    }
  }
})
