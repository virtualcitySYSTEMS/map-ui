import vcsOl from '@vcmap/rollup-plugin-vcs-ol';
import { join as joinPath } from 'path';
import tar from 'tar';
import { cp, rm } from 'fs/promises';
import { createGzip } from 'zlib';
import { pipeline } from 'stream';
import { createReadStream, createWriteStream } from 'fs';
import { buildPluginsForBundle, getProjectPath } from './buildHelpers.js';

await import('./build.js');
console.log('ui built');

await buildPluginsForBundle({
  configFile: './build/commonViteConfig.js',
  plugins: [vcsOl()],
});

const distDir = getProjectPath('dist');

const rootFiles = ['package.json', 'README.md', 'CHANGELOG.md'];
await Promise.all(
  rootFiles.map((entry) => cp(getProjectPath(entry), joinPath(distDir, entry))),
);

const file = joinPath(distDir, 'vcmap-bundle.tar');

await tar.c(
  {
    file,
    cwd: distDir,
    prefix: '@vcmap/ui',
  },
  ['index.html', 'assets', ...rootFiles],
);

await tar.u(
  {
    file,
    cwd: joinPath(distDir, 'plugins', '@vcmap'),
    prefix: '@vcmap',
  },
  ['.'],
);

await new Promise((res, rej) => {
  pipeline(
    [createReadStream(file), createGzip(), createWriteStream(`${file}.gz`)],
    (err) => {
      if (err) {
        rej(err);
      } else {
        res();
      }
    },
  );
});
await rm(file);
