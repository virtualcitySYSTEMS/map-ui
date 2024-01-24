import { readFile } from 'node:fs/promises';
import { EOL } from 'node:os';
import { getFilesInDirectory } from './buildHelpers.js';

const anyRegex = /:[^\n,;]+\bany\b/;

async function lintTypes() {
  let errors = 0;
  // eslint-disable-next-line no-restricted-syntax
  for await (const path of getFilesInDirectory('./src')) {
    if (path.endsWith('.d.ts') && !path.endsWith('vue.d.ts')) {
      const content = await readFile(path, 'utf8');
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
