import * as esbuild from 'esbuild';
import { copy } from 'esbuild-plugin-copy';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isWatch = process.argv.includes('--watch');

// Code splitting configuration for performance optimization
const ctx = await esbuild.context({
  entryPoints: {
    main: 'src/main.tsx',
    // Separate chunks for heavy dependencies
    vendor: 'src/vendor.ts',
  },
  bundle: true,
  minify: !isWatch,
  sourcemap: isWatch,
  target: ['es2020'],
  outdir: 'dist/assets',
  splitting: true,
  format: 'esm',
  chunkNames: 'chunks/[name]-[hash]',
  assetNames: 'assets/[name]-[hash]',
  metafile: true,
  treeShaking: true,
  loader: {
    '.tsx': 'tsx',
    '.ts': 'ts',
    '.jsx': 'jsx',
    '.js': 'js',
    '.css': 'css',
    '.png': 'file',
    '.jpg': 'file',
    '.svg': 'dataurl',
  },
  define: {
    'process.env.NODE_ENV': isWatch ? '"development"' : '"production"',
  },
  plugins: [
    copy({
      resolveFrom: 'cwd',
      assets: [
        {
          from: ['./public/**/*'],
          to: ['./dist'],
        },
        {
          from: ['./index.html'],
          to: ['./dist'],
        },
      ],
    }),
  ],
  logLevel: 'info',
  // Performance optimizations
  mainFields: ['module', 'main'],
  conditions: ['import', 'module', 'default'],
  resolveExtensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
});

if (isWatch) {
  await ctx.watch();
  console.log('Watching for changes...');
} else {
  const result = await ctx.rebuild();

  // Analyze bundle size
  if (result.metafile) {
    const analysis = await esbuild.analyzeMetafile(result.metafile, {
      verbose: false,
    });
    console.log('\nBundle Analysis:');
    console.log(analysis);
  }

  await ctx.dispose();
  console.log('\nBuild completed with code splitting optimization!');
}

