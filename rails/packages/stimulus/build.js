import { copyFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Ensure dist directory exists
mkdirSync(join(__dirname, 'dist'), { recursive: true });

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

console.log('Build complete!');
