import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/',
  envDir: false,
  envPrefix: 'DIVAN_BROWSER_PUBLIC_',
  plugins: [react()],
  build: {
    assetsInlineLimit: 0,
    // Vite 8 no longer exports its historical modulepreload-polyfill path.
    // Modern target browsers support modulepreload; disabling the injected
    // compatibility import keeps Rolldown on Vite's public export surface.
    modulePreload: { polyfill: false },
    manifest: false,
    sourcemap: false,
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name]-[hash:16][extname]',
        chunkFileNames: 'assets/[name]-[hash:16].js',
        entryFileNames: 'assets/[name]-[hash:16].js',
        hashCharacters: 'hex',
      },
    },
  },
});
