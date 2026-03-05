import { defineConfig } from 'tsdown';

export default defineConfig([
  // CLI dispatcher (for Claude to run)
  // Must be self-contained with all dependencies bundled
  {
    entry: ['src/cli/dispatcher.ts'],
    format: ['cjs'],
    outDir: 'dist/cli',
    clean: false,
    dts: false,
    sourcemap: false,
    // Bundle all dependencies so scripts are self-contained
    // These packages must be inlined since scripts run in user projects without node_modules
    noExternal: ['gray-matter', 'fuse.js', 'js-yaml', 'fast-xml-parser', 'zod', 'slugify']
  },
  // Build tools
  {
    entry: ['tools/build.ts'],
    format: ['esm'],
    outDir: 'dist/tools',
    clean: false,
    dts: false
  }
]);
