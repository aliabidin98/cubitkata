import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    base: process.env.BASE_URL || './',
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'generate-404-and-docs',
        closeBundle() {
          try {
            const distDir = path.resolve(process.cwd(), 'dist');
            const distIndex = path.resolve(distDir, 'index.html');
            const dist404 = path.resolve(distDir, '404.html');
            if (fs.existsSync(distIndex)) {
              fs.copyFileSync(distIndex, dist404);
            }

            // Also mirror dist to docs for users who deploy via "main branch -> /docs folder"
            const docsDir = path.resolve(process.cwd(), 'docs');
            fs.cpSync(distDir, docsDir, { recursive: true });
          } catch (e) {
            // ignore
          }
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
