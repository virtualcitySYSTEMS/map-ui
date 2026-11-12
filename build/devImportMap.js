import { existsSync } from 'node:fs';
import { normalizePath } from 'vite';
import { getProjectPath, libraries } from './buildHelpers.js';

const probeId = 'virtual:vcmap-import-map-probe';
const resolvedProbeId = `\0${probeId}`;
// Plugins are built with @vcmap/rollup-plugin-vcs-ol, which rewrites `ol/*` imports to the flat exports of olLib
// (e.g. `ol$Feature`). The `ol` entry must therefore point to olLib, as the production ol.js does.
const olLib = getProjectPath('build', 'lib', 'olLib.js');

/**
 * Dev counterpart of createImportMap. Plugins loaded from other origins are not transformed by vite, so their bare
 * imports need an import map. To share module instances with the app, the map must point to the exact urls vite
 * rewrites the app's own imports to (e.g. including the `?v=` hash of optimized dependencies). We therefore let vite
 * transform a probe module importing all libraries and read the rewritten urls from the result.
 * @returns {import("vite").Plugin}
 */
export default function devImportMap() {
  const specifiers = Object.keys(libraries);
  return {
    name: 'vcmap-dev-import-map',
    apply: 'serve',
    resolveId(id) {
      return id === probeId ? resolvedProbeId : undefined;
    },
    load(id) {
      if (id === resolvedProbeId) {
        const hasOlLib = existsSync(olLib);
        if (!hasOlLib) {
          this.warn(
            `${olLib} is missing, run a build to generate it. Until then, plugins importing ol cannot be loaded from other origins.`,
          );
        }
        return specifiers
          .map((s) => {
            const source = s === 'ol' && hasOlLib ? normalizePath(olLib) : s;
            return `import ${JSON.stringify(source)};`;
          })
          .join('\n');
      }
      return undefined;
    },
    transformIndexHtml: {
      order: 'pre',
      async handler(html, ctx) {
        if (!ctx.server) {
          return undefined;
        }
        const result = await ctx.server.transformRequest(probeId);
        if (!result) {
          return undefined;
        }
        const urls = [...result.code.matchAll(/^import\s+"([^"]+)";?/gm)].map(
          (m) => m[1],
        );
        if (urls.length !== specifiers.length) {
          ctx.server.config.logger.warn(
            '[vcmap-dev-import-map] could not determine library urls',
          );
          return undefined;
        }
        const imports = Object.fromEntries(
          specifiers.map((s, i) => [s, urls[i]]),
        );
        return [
          {
            tag: 'script',
            attrs: { type: 'importmap' },
            children: JSON.stringify({ imports }, null, 2),
            injectTo: 'head-prepend',
          },
        ];
      },
    },
  };
}
