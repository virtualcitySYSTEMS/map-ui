import { readFile } from 'node:fs/promises';
import { EOL } from 'node:os';
import { getFilesInDirectory } from './buildHelpers.js';

const anyRegex = /:[^\n,;]+\bany\b/;

async function lintTypes() {
  let errors = 0;

  for await (const path of getFilesInDirectory('./src')) {
    if (path.endsWith('.d.ts') && !path.endsWith('vue.d.ts')) {
      const content = await readFile(path, 'utf8');
      if (path.endsWith('vcsUiApp.d.ts')) {
        // we do not check the vcsUiApp.d.ts, because the vuetify return Type has several occurances of any
        // eslint-disable-next-line no-continue
        continue;
      }
      if (path.endsWith('uiConfig.d.ts')) {
        // we do not check the vcsUiApp.d.ts, because import("vue").DeepReadonly creates an any type
        // eslint-disable-next-line no-continue
        continue;
      }
      // eslint-disable-next-line no-loop-func
      content.split(EOL).forEach((line, index) => {
        const matches = line.match(anyRegex);
        if (matches?.index != null) {
          errors += 1;
          console.error(`found any: ${path}:${index + 1}:${matches.index}`);
        }
      });
    }
  }
  return errors;
}

const errors = await lintTypes();
if (errors) {
  console.error(`Found ${errors} errors`);
  process.exit(1);
}
