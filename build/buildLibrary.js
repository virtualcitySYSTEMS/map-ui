import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { readFile, writeFile, rm } from 'node:fs/promises';
import { execFileSync, spawn } from 'node:child_process';
import { build } from 'vite';
import vue from '@vitejs/plugin-vue';
import { transformAssetUrls } from 'vite-plugin-vuetify';
import { getFilesInDirectory, getProjectPath } from './buildHelpers.js';

/**
 * Builds the library into lib/. Pass --watch to rebuild JS & declarations on changes (e.g. when linking @vcmap/ui
 * into a plugin). In watch mode, lib/ is not cleaned beforehand and only changed JS outputs are written.
 */
const watch = process.argv.includes('--watch');

/**
 * These collection subclasses intentionally narrow their inherited add signatures.
 * @type {Array<{file: string, regex: RegExp}>}
 */
const knownExtensionErrors = [
  { file: 'src/search/search.d.ts', regex: /(add\(item)/ },
  {
    file: 'src/manager/navbarManager.d.ts',
    regex: /(add\(buttonComponentOptions)/,
  },
  {
    file: 'src/manager/panel/panelManager.d.ts',
    regex: /(add\(panelComponentOptions)/,
  },
  {
    file: 'src/manager/toolbox/toolboxManager.d.ts',
    regex: /(add\(toolboxComponentOptions)/,
  },
];

const root = getProjectPath();
const packageJson = JSON.parse(
  await readFile(getProjectPath('package.json'), 'utf8'),
);
const externalPackages = Object.keys({
  ...packageJson.dependencies,
  ...packageJson.peerDependencies,
});

const vueTscArgs = [
  path.join('node_modules', 'vue-tsc', 'bin', 'vue-tsc.js'),
  '-p',
  'build/tsconfig.declarations.json',
  '--pretty',
  'false',
];

/**
 * Removes diagnostics of files within node_modules from vue-tsc output.
 * @param {string} output
 * @returns {string}
 */
function filterDiagnostics(output) {
  return output
    .split(/(?=^[^\r\n]+\(\d+,\d+\): error TS\d+:)/m)
    .filter((diagnostic) => {
      const file = diagnostic.match(
        /^([^\r\n]+)\(\d+,\d+\): error TS\d+:/,
      )?.[1];
      return !file?.split(/[\\/]/).includes('node_modules');
    })
    .join('');
}

/**
 * Fixes known declaration issues and rewrites imports. Idempotent, so it can be run repeatedly in watch mode.
 * Only writes files which actually changed.
 * @returns {Promise<void>}
 */
async function postProcessDeclarations() {
  await Promise.all(
    knownExtensionErrors.map(async ({ file, regex }) => {
      const output = path.join('lib', file);
      const content = await readFile(output, 'utf8');
      const unpatched = new RegExp(`(?<!// @ts-ignore\\n)${regex.source}`);
      const patched = content.replace(unpatched, '// @ts-ignore\n$1');
      if (patched !== content) {
        await writeFile(output, patched);
      }
    }),
  );

  for await (const file of getFilesInDirectory('lib')) {
    if (file.endsWith('.d.ts')) {
      const content = await readFile(file, 'utf8');
      const processed = content
        .replace(/\.vue(['"])/g, '.vue.js$1')
        .replace(/^import ['"][^'"]+\.scss['"];?\r?\n/gm, '')
        .replace(
          /export \{ default as (\w+) \} from ['"][^'"]+\.svg['"];?/g,
          'export declare const $1: string;',
        );
      if (processed !== content) {
        await writeFile(file, processed);
      }
    }
  }
}

const sourceMapComment = /\s*\/\/# sourceMappingURL=\S+\s*$/;

/**
 * @param {string|Uint8Array} content
 * @returns {string}
 */
function hashOutput(content) {
  return createHash('sha1').update(content).digest('hex');
}

/**
 * Hashes an output already written to lib/ (e.g. by a previous build).
 * @param {string} fileName
 * @param {boolean} isChunk
 * @returns {string|undefined}
 */
function hashPreviousOutput(fileName, isChunk) {
  const file = getProjectPath('lib', fileName);
  if (!existsSync(file)) {
    return undefined;
  }
  return hashOutput(
    isChunk
      ? readFileSync(file, 'utf8').replace(sourceMapComment, '')
      : readFileSync(file),
  );
}

/**
 * In watch mode, the bundle is regenerated on every change. To not trigger file watchers of consumers
 * (e.g. the plugin-cli dev server) for every output, unchanged outputs are removed from the bundle before writing.
 * Only a hash per output is kept. The first build compares against the existing lib/ folder.
 * @returns {import("vite").Plugin}
 */
function skipUnchangedOutputs() {
  /** @type {Map<string, string|undefined>} */
  const previousHashes = new Map();
  return {
    name: 'skip-unchanged-outputs',
    enforce: 'post',
    generateBundle(_options, bundle) {
      for (const [fileName, output] of Object.entries(bundle)) {
        const isChunk = output.type === 'chunk';
        const hash = hashOutput(
          isChunk ? output.code.replace(sourceMapComment, '') : output.source,
        );
        if (!previousHashes.has(fileName)) {
          previousHashes.set(fileName, hashPreviousOutput(fileName, isChunk));
        }
        if (previousHashes.get(fileName) === hash) {
          delete bundle[fileName];
        } else {
          previousHashes.set(fileName, hash);
        }
      }
    },
  };
}

/**
 * Emits declarations once, failing on errors outside of node_modules.
 */
function buildDeclarations() {
  console.log('Building vue-tsc declarations');
  try {
    const output = execFileSync(process.execPath, vueTscArgs, {
      stdio: 'pipe',
      encoding: 'utf8',
    });
    if (output) {
      process.stdout.write(output);
    }
  } catch (error) {
    if (![1, 2].includes(error.status) || error.signal) {
      throw error;
    }
    const output = error.stdout?.toString() ?? '';
    const remaining = filterDiagnostics(output);
    if (!output || remaining.trim() || error.stderr?.toString().trim()) {
      if (remaining) {
        process.stdout.write(remaining);
      }
      if (error.stderr) {
        process.stderr.write(error.stderr);
      }
      throw new Error('vue-tsc declaration generation failed');
    }
  }
}

/**
 * @param {number} errors - number of errors outside of node_modules
 * @returns {Promise<void>}
 */
async function finishCycle(errors) {
  try {
    await postProcessDeclarations();
    console.log(
      `${new Date().toLocaleTimeString()} - Declarations updated (${errors} errors). Watching for file changes.`,
    );
  } catch (e) {
    console.error('Failed to post process declarations', e);
  }
}

/**
 * Runs vue-tsc in watch mode and post processes the declarations after every compilation.
 */
function watchDeclarations() {
  console.log('Watching vue-tsc declarations');
  const child = spawn(
    process.execPath,
    [...vueTscArgs, '--watch', '--preserveWatchOutput'],
    { stdio: ['ignore', 'pipe', 'inherit'] },
  );
  const killChild = () => {
    child.kill();
  };
  process.on('exit', killChild);
  ['SIGINT', 'SIGTERM', 'SIGHUP'].forEach((signal) => {
    process.on(signal, () => {
      killChild();
      process.exit(0);
    });
  });

  const cycleEnd = /^.*Found \d+ errors?\. Watching for file changes\.\r?\n/m;
  const diagnosticStart = /^[^\r\n]+\(\d+,\d+\): error TS\d+:/gm;
  let buffer = '';
  let processing = Promise.resolve();
  child.stdout.setEncoding('utf8');
  child.stdout.on('data', (chunk) => {
    buffer += chunk;
    let match = cycleEnd.exec(buffer);
    while (match) {
      const cycle = buffer.slice(0, match.index);
      buffer = buffer.slice(match.index + match[0].length);
      const remaining = filterDiagnostics(cycle).trim();
      const errors = remaining.match(diagnosticStart)?.length ?? 0;
      if (remaining) {
        console.log(remaining);
      }
      processing = processing.then(() => finishCycle(errors));
      match = cycleEnd.exec(buffer);
    }
  });
  child.on('exit', (code) => {
    process.exitCode = code ?? 1;
  });
}

if (!watch) {
  await rm(getProjectPath('lib'), { recursive: true, force: true });
}

await build({
  configFile: false,
  root,
  publicDir: false,
  plugins: [
    vue({ template: { transformAssetUrls } }),
    {
      name: 'validate-library-externals',
      generateBundle(_options, bundle) {
        for (const output of Object.values(bundle).filter(
          (entry) => entry.type === 'chunk',
        )) {
          for (const id of Object.keys(output.modules)) {
            if (id.replaceAll('\\', '/').includes('/node_modules/')) {
              this.error(`Dependency bundled into the library: ${id}`);
            }
          }
          if (output.fileName === 'index.js') {
            output.code = `import "./style.css";\n${output.code}`;
            if (output.map) {
              output.map.mappings = `;${output.map.mappings}`;
            }
          }
        }
      },
    },
    watch ? skipUnchangedOutputs() : undefined,
  ],
  build: {
    outDir: 'lib',
    emptyOutDir: false,
    copyPublicDir: false,
    sourcemap: true,
    minify: false,
    cssCodeSplit: false,
    watch: watch ? {} : null,
    lib: {
      entry: getProjectPath('index.ts'),
      formats: ['es'],
      cssFileName: 'style',
    },
    rolldownOptions: {
      external: (id) =>
        externalPackages.some(
          (dependency) => id === dependency || id.startsWith(`${dependency}/`),
        ),
      output: {
        preserveModules: true,
        preserveModulesRoot: root,
        sourcemapExcludeSources: false,
        entryFileNames(chunk) {
          const id = chunk.facadeModuleId;
          if (id && !id.includes('?') && path.isAbsolute(id)) {
            return `${path
              .relative(root, id)
              .replaceAll('\\', '/')
              .replace(/\.[jt]s$/, '')}.js`;
          }
          return '[name].js';
        },
      },
    },
  },
});

for await (const file of getFilesInDirectory('src')) {
  if (file.endsWith('.d.ts')) {
    await rm(file);
  }
}

if (watch) {
  watchDeclarations();
} else {
  buildDeclarations();
  await postProcessDeclarations();
}
