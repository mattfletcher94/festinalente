import { defineConfig } from 'tsdown';

export default defineConfig([
  // Runtime scripts (for Claude to run)
  {
    entry: [
      'src/scripts/find-task.ts',
      'src/scripts/find-spec.ts',
      'src/scripts/find-plan.ts',
      'src/scripts/list-tasks.ts',
      'src/scripts/next-id.ts',
      'src/scripts/get-date-time.ts',
      'src/scripts/list-product.ts',
      'src/scripts/search-product.ts',
      'src/scripts/check-product.ts',
    ],
    format: ['cjs'],
    outDir: 'dist/scripts',
    clean: false,
    dts: false,
    sourcemap: false,
  },
  // Build tools
  {
    entry: ['tools/build.ts'],
    format: ['esm'],
    outDir: 'dist/tools',
    clean: false,
    dts: false,
  }
]);
