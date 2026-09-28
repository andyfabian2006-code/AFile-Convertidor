import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  worker: {
    format: 'es'
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        about: resolve(__dirname, 'pages/about.html'),
        contacto: resolve(__dirname, 'pages/contacto.html'),
        privacidad: resolve(__dirname, 'pages/privacidad.html'),
        terminos: resolve(__dirname, 'pages/terminos.html'),
        cookies: resolve(__dirname, 'pages/cookies.html'),
        avisoLegal: resolve(__dirname, 'pages/aviso-legal.html'),
        dmca: resolve(__dirname, 'pages/dmca.html'),
        pngAjpg: resolve(__dirname, 'converters/png-a-jpg.html'),
        jpgAwebp: resolve(__dirname, 'converters/jpg-a-webp.html'),
        webpApng: resolve(__dirname, 'converters/webp-a-png.html'),
      }
    }
  },
  test: {
    include: ['tests/unit/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['tests/e2e/**']
  }
});
