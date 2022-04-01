import fs from 'fs';
import path from 'path';

/**
 * copies Cesium Assets and Workers to dist folder
 * @returns {Promise<void>}
 */
export default async function buildCesium() {
  const cesiumPath = path.join(process.cwd(), 'node_modules', '@vcmap', 'cesium', 'Build', 'Cesium');
  const buildPath = path.join(process.cwd(), 'dist', 'assets', 'cesium');
  return Promise.all([
    fs.promises.cp(path.join(cesiumPath, 'Assets'), path.join(buildPath, 'Assets'), {
      recursive: true,
    }),
    fs.promises.cp(path.join(cesiumPath, 'Workers'), path.join(buildPath, 'Workers'), {
      recursive: true,
    }),
  ]);
}
