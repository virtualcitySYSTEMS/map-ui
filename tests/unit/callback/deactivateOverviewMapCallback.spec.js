import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import VcsUiApp from '../../../src/vcsUiApp.js';
import { executeCallbacks } from '../../../src/callback/vcsCallback.js';
import { sleep } from '../../helpers.js';
import DeactivateOverviewMapCallback from '../../../src/callback/deactivateOverviewMapCallback.js';

describe('DeactivateOverviewMapCallback', () => {
  let app;

  beforeEach(() => {
    app = new VcsUiApp();
  });

  afterEach(() => {
    app.destroy();
  });

  it('should call deactivate on overviewMap if present', async () => {
    await app.overviewMap.activate();
    executeCallbacks(app, [{ type: DeactivateOverviewMapCallback.className }]);
    await sleep(100); //
    expect(app.overviewMap.active).to.be.false;
  });

  it('should do nothing if overviewMap is not active', async () => {
    await app.overviewMap.activate();
    executeCallbacks(app, [{ type: DeactivateOverviewMapCallback.className }]);
    expect(app.overviewMap.active).to.be.false;
  });
});
