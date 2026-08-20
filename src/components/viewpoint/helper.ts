import { Viewpoint, type ViewpointOptions } from '@vcmap/core';
import type VcsUiApp from '../../vcsUiApp.js';

export async function gotoViewpointOptions(
  app: VcsUiApp,
  options: ViewpointOptions,
): Promise<void> {
  const viewpoint = new Viewpoint({
    ...options,
    animate: false,
  });
  if (app.maps.activeMap && viewpoint.isValid()) {
    await app.maps.activeMap.gotoViewpoint(viewpoint);
  }
}
