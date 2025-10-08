import { join } from 'node:path';
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

async function fixGeotiff() {
  console.log('Fixing geotiff pool.js...');
  const fileName = join(
    process.cwd(),
    'node_modules',
    'geotiff',
    'dist-module',
    'pool.js',
  );

  if (existsSync(fileName)) {
    const content = await readFile(fileName, 'utf-8');

    const fixedContent = content.replace(
      /worker\.worker\.postMessage\(\{\s*fileDirectory,\s*buffer,\s*id\s*\},\s*\[buffer\]\);/g,
      'worker.worker.postMessage({ fileDirectory: { ...fileDirectory, TileOffsets: undefined, TileByteCounts: undefined }, buffer, id }, [buffer]);',
    );
    await writeFile(fileName, fixedContent);
  } else {
    console.error('missing pool.js file in geotiff module');
  }
}

async function postInstall() {
  console.log('Running post-install script...');
  await Promise.all([fixGeotiff()]);
}
await postInstall();
