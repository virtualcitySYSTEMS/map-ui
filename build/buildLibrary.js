import path from 'node:path';
import { readFile, writeFile, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { build } from 'vite';
import vue from '@vitejs/plugin-vue';
import * as compiler from '@vue/compiler-sfc';
import { transformAssetUrls } from 'vite-plugin-vuetify';
import { getFilesInDirectory, getProjectPath } from './buildHelpers.js';

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

await rm(getProjectPath('lib'), { recursive: true, force: true });

await build({
  configFile: false,
  root,
  publicDir: false,
  plugins: [
    vue({ compiler, template: { transformAssetUrls } }),
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
  ],
  build: {
    outDir: 'lib',
    emptyOutDir: false,
    copyPublicDir: false,
    sourcemap: true,
    minify: false,
    cssCodeSplit: false,
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

console.log('Building vue-tsc declarations');
try {
  const output = execFileSync(
    process.execPath,
    [
      path.join('node_modules', 'vue-tsc', 'bin', 'vue-tsc.js'),
      '-p',
      'build/tsconfig.declarations.json',
      '--pretty',
      'false',
    ],
    { stdio: 'pipe', encoding: 'utf8' },
  );
  if (output) {
    process.stdout.write(output);
  }
} catch (error) {
  if (![1, 2].includes(error.status) || error.signal) {
    throw error;
  }
  const output = error.stdout?.toString() ?? '';
  const remaining = output
    .split(/(?=^[^\r\n]+\(\d+,\d+\): error TS\d+:)/m)
    .filter((diagnostic) => {
      const file = diagnostic.match(
        /^([^\r\n]+)\(\d+,\d+\): error TS\d+:/,
      )?.[1];
      return !file?.split(/[\\/]/).includes('node_modules');
    })
    .join('');
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

await Promise.all(
  knownExtensionErrors.map(async ({ file, regex }) => {
    const output = path.join('lib', file);
    const content = await readFile(output, 'utf8');
    await writeFile(output, content.replace(regex, '// @ts-ignore\n$1'));
  }),
);

for await (const file of getFilesInDirectory('lib')) {
  if (file.endsWith('.d.ts')) {
    const content = await readFile(file, 'utf8');
    await writeFile(
      file,
      content
        .replace(/\.vue(['"])/g, '.vue.js$1')
        .replace(/^import ['"][^'"]+\.scss['"];?\r?\n/gm, '')
        .replace(
          /export \{ default as (\w+) \} from ['"][^'"]+\.svg['"];?/g,
          'export declare const $1: string;',
        ),
    );
  }
}
