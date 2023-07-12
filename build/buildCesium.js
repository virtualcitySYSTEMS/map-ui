import fs from 'fs';
import path from 'path';

/**
 * copies Cesium Assets and Workers to dist folder
 * @returns {Promise<void>}
 */
export default async function buildCesium() {
  const cesiumPath = path.join(
    process.cwd(),
    'node_modules',
    '@vcmap-cesium',
    'engine',
  );
  const buildPath = path.join(process.cwd(), 'dist', 'assets', 'cesium');
  return Promise.all([
    fs.promises.cp(
      path.join(cesiumPath, 'Source', 'Assets'),
      path.join(buildPath, 'Assets'),
      {
        recursive: true,
      },
    ),
    fs.promises.cp(
      path.join(cesiumPath, 'Build', 'Workers'),
      path.join(buildPath, 'Workers'),
      {
        recursive: true,
      },
    ),
    fs.promises.cp(
      path.join(cesiumPath, 'Source', 'ThirdParty'),
      path.join(buildPath, 'ThirdParty'),
      {
        recursive: true,
      },
    ),
  ]);
}
