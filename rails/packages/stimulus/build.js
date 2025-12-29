import * as esbuild from 'esbuild';
import { copyFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Ensure dist directory exists
mkdirSync(join(__dirname, 'dist'), { recursive: true });

// Bundle with sonner-vanilla included, but keep @hotwired/stimulus external
await esbuild.build({
  entryPoints: [join(__dirname, 'src/index.ts')],
  bundle: true,
  format: 'esm',
  outfile: join(__dirname, 'dist/index.js'),
  minify: true,
  sourcemap: true,
  external: ['@hotwired/stimulus'], // Don't bundle Stimulus - it's a peer dependency
  // sonner-vanilla will be bundled in (not in external)
});

console.log('Build complete! (sonner-vanilla bundled)');

// Copy CSS from vanilla package
try {
  copyFileSync(
    join(__dirname, '../vanilla/dist/styles.css'),
    join(__dirname, 'dist/styles.css')
  );
  console.log('CSS copied from vanilla!');
} catch (e) {
  console.warn('Warning: Could not copy CSS from vanilla. Make sure vanilla is built first.');
}
