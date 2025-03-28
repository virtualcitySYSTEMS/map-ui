import { join as joinPath } from 'node:path';
import { existsSync } from 'node:fs';
import { EOL } from 'node:os';
import { unlink, readFile, writeFile, rm } from 'node:fs/promises';
import { promisify } from 'node:util';
import { exec } from 'node:child_process';
import { getFilesInDirectory } from './buildHelpers.js';

const indexDTs = joinPath(process.cwd(), 'index.d.ts');

const execPromisify = promisify(exec);

const exportFromJSPattern = /export.*(from.*["'].*)\.js(["'])/;
const exportFromVuePattern = /export.*(from.*["'].*\.vue)(["'])/;

/**
 * @param {string} line
 * @param {RegExp} pattern
 * @returns {string|undefined}
 */
function getExportFromLine(line, pattern) {
  if (pattern.test(line)) {
    const newLine = line.replace(pattern, 'export type * $1.d.ts$2');
    return newLine;
  }
  return undefined;
}

/**
 * Adds `export types * from '...d.t.s';` to each line of imports
 * @returns {Promise<void>}
 */
async function addTypeExports() {
  const content = await readFile(indexDTs, 'utf-8');
  const newContent = content
    .split(';')
    .flatMap((line, index) => {
      let newLine = getExportFromLine(line, exportFromJSPattern);
      newLine = newLine ?? getExportFromLine(line, exportFromVuePattern);

      if (newLine) {
        if (index === 0) {
          newLine = `${EOL}${newLine}`;
        }
        return [line, newLine];
      }
      return [line];
    })
    .join(';');
  await writeFile(indexDTs, newContent);
}

/**
 * TS is way more picky with extension than JS. These classes do not properly extend their parents, the below defined
 * methods are not compatible in TS, so we ignore them to not break.
 * @type {Array<{ file:string, replacement: Array<{ regex: RegExp, replace: string }> }>}
 */
const knownExtensionErrors = [
  {
    file: './src/search/search.d.ts',
    replacements: [
      {
        regex: /(add\(item)/,
        replace: '// @ts-ignore\n$1',
      },
    ],
  },
  {
    file: './src/manager/navbarManager.d.ts',
    replacements: [
      {
        regex: /(add\(buttonComponentOptions)/,
        replace: '// @ts-ignore\n$1',
      },
    ],
  },
  {
    file: './src/manager/panel/panelManager.d.ts',
    replacements: [
      {
        regex: /(add\(panelComponentOptions)/,
        replace: '// @ts-ignore\n$1',
      },
    ],
  },
  {
    file: './src/manager/toolbox/toolboxManager.d.ts',
    replacements: [
      {
        regex: /(add\(toolboxComponentOptions)/,
        replace: '// @ts-ignore\n$1',
      },
    ],
  },
];

/**
 * @returns {Promise<void>}
 */
async function fixTemplateFunctions() {
  await Promise.all(
    knownExtensionErrors.map(async ({ file, replacements }) => {
      let content = await readFile(file, 'utf8');
      replacements.forEach(({ regex, replace }) => {
        content = content.replace(regex, replace);
      });
      await writeFile(file, content);
    }),
  );
}

async function vueAugmentations() {
  let content = await readFile('./index.d.ts', 'utf-8');
  content = `${content}
declare module 'vue' {
  interface ComponentCustomProperties {
    $st(key: string | number | undefined | null): string;
    $st(key: string | number | undefined | null, plural: number, options?: import("vue-i18n").TranslateOptions<import("vue-i18n").Locale>): string;
    $st(key: string | number | undefined | null, defaultMsg: string, options?: import("vue-i18n").TranslateOptions<import("vue-i18n").Locale>): string;
    $st(key: string | number | undefined | null, list: unknown[], options?: import("vue-i18n").TranslateOptions<import("vue-i18n").Locale>): string;
    $st(key: string | number | undefined | null, list: unknown[], plural: number): string;
    $st(key: string | number | undefined | null, list: unknown[], defaultMsg: string): string;
    $st(key: string | number | undefined | null, named: import("vue-i18n").NamedValue, options?: import("vue-i18n").TranslateOptions<import("vue-i18n").Locale>): string;
    $st(key: string | number | undefined | null, named: import("vue-i18n").NamedValue, plural: number): string;
    $st(key: string | number | undefined | null, named: import("vue-i18n").NamedValue, defaultMsg: string): string;
  }
}
`;
  await writeFile('./index.d.ts', content);
}

function printTypeErrors(stdout) {
  let withinNodeModule = false;
  const lines = stdout.split(EOL).filter((line) => {
    if (!line) {
      return false;
    }
    if (line.startsWith('node_modules')) {
      withinNodeModule = true;
      return false;
    }
    if (line.startsWith(' ')) {
      return !withinNodeModule;
    }
    withinNodeModule = false;
    return true;
  });

  lines.forEach((line) => {
    console.error(line);
  });

  return lines.length > 0;
}

async function run() {
  if (existsSync(indexDTs)) {
    await unlink(indexDTs);
  }

  for await (const file of getFilesInDirectory('src')) {
    if (/\.d\.ts/.test(file)) {
      await rm(file);
    }
  }
  console.log('building vue-tsc declarations');
  const { stderr: vueTscError } = await execPromisify(
    'npx vue-tsc --emitDeclarationOnly --skipLibCheck',
  );
  if (vueTscError) {
    console.error(vueTscError);
    process.exitCode = 1;
    return;
  }
  console.log('fixing template functions');
  await fixTemplateFunctions();
  console.log('exporting types');
  await addTypeExports();
  console.log('augmenting vue');
  await vueAugmentations();
  if (process.argv.includes('--skipValidation')) {
    return;
  }
  console.log('validating library');
  let validationFailed = false;
  try {
    await execPromisify('npx vue-tsc --noEmit');
  } catch (e) {
    let hasErrors = e.code !== 2;
    if (e.code === 2) {
      hasErrors = printTypeErrors(e.stdout);
    } else {
      validationFailed = true;
      console.error(e.stderr);
    }
    if (hasErrors) {
      validationFailed = true;
      process.exitCode = 1;
    }
  }

  if (!validationFailed) {
    console.log('all declarations valid');
  }
}

await run();
