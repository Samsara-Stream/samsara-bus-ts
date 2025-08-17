import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'samsara-bus-ts': path.resolve(__dirname, '../../../samsara-bus-ts/src'),
      'samsara-bus-react': path.resolve(__dirname, '../../src'),
    },
  },
})
