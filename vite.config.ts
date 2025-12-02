import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // A configuração base: './' é CRUCIAL para que o site funcione em subdiretórios
  // como https://thiagodepizzol.com.br/desafio/
  // Isso faz com que os imports sejam "./assets/..." em vez de "/assets/..."
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
})