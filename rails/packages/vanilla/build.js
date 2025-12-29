import * as esbuild from 'esbuild';
import { copyFileSync, mkdirSync } from 'fs';

const watch = process.argv.includes('--watch');

// Ensure dist directory exists
mkdirSync('dist', { recursive: true });

const buildOptions = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  format: 'esm',
  outdir: 'dist',
  minify: !watch,
  sourcemap: true,
};

async function build() {
  if (watch) {
    const ctx = await esbuild.context(buildOptions);
    await ctx.watch();
    console.log('Watching for changes...');
  } else {
    await esbuild.build(buildOptions);
    console.log('Build complete!');
  }

  // Copy CSS
  copyFileSync('src/styles.css', 'dist/styles.css');
  console.log('CSS copied!');
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
