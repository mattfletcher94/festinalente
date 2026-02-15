import { defineConfig } from 'tsdown';

export default defineConfig([
  // Runtime scripts (for Claude to run)
  // These must be self-contained with all dependencies bundled
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
      'src/scripts/get-user-skills.ts',
    ],
    format: ['cjs'],
    outDir: 'dist/scripts',
    clean: false,
    dts: false,
    sourcemap: false,
    // Bundle all dependencies so scripts are self-contained
    // These packages must be inlined since scripts run in user projects without node_modules
    noExternal: ['gray-matter', 'fuse.js', 'js-yaml'],
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
