import fs from 'fs';
import path from 'path';
import vcsOl from '@vcmap/rollup-plugin-vcs-ol';
import { buildPluginsForPreview, getProjectPath } from './buildHelpers.js';

console.log('Building Plugins');
await Promise.all([
  buildPluginsForPreview({
    configFile: './build/commonViteConfig.js',
    plugins: [vcsOl()],
  }, true),
  fs.promises.cp(
    getProjectPath('app.config.json'),
    path.join(process.cwd(), 'dist', 'app.config.json'),
  ),
  fs.promises.cp(
    getProjectPath('config'),
    path.join(process.cwd(), 'dist', 'config'),
    {
      recursive: true,
    },
  ),
  fs.promises.cp(
    getProjectPath('exampleData'),
    path.join(process.cwd(), 'dist', 'exampleData'),
    {
      recursive: true,
    },
  ),
]);
