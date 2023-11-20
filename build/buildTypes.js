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

async function run() {
  if (existsSync(indexDTs)) {
    await unlink(indexDTs);
  }
  // eslint-disable-next-line no-restricted-syntax
  for await (const file of getFilesInDirectory('src')) {
    if (/\.d\.ts/.test(file)) {
      await rm(file);
    }
  }
  console.log('building vue-tsc declarations');
  const { stderr: vueTscError } = await execPromisify(
    'npx vue-tsc --emitDeclarationOnly',
  );
  if (vueTscError) {
    console.error(vueTscError);
    process.exitCode = 1;
    return;
  }
  console.log('exporting types');
  await addTypeExports();
  const { stdErr: validError } = await execPromisify('npx tsc --noEmit');
  if (validError) {
    console.error(validError);
    process.exitCode = 1;
  } else {
    console.log('all declarations valid');
  }
}

await run();
