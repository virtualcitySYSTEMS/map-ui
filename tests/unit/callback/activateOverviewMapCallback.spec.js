import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import ActivateOverviewMapCallback from '../../../src/callback/activateOverviewMapCallback.js';
import VcsUiApp from '../../../src/vcsUiApp.js';
import { executeCallbacks } from '../../../src/callback/vcsCallback.js';
import { sleep } from '../../helpers.js';

describe('ActivateOverviewMapCallback', () => {
  let app;

  beforeEach(() => {
    app = new VcsUiApp();
  });

  afterEach(() => {
    app.destroy();
  });

  it('should call activate on overviewMap if present', async () => {
    executeCallbacks(app, [{ type: ActivateOverviewMapCallback.className }]);
    await sleep(100); //
    expect(app.overviewMap.active).to.be.true;
  });

  it('should do nothing if overviewMap is already active', async () => {
    await app.overviewMap.activate();
    executeCallbacks(app, [{ type: ActivateOverviewMapCallback.className }]);
    expect(app.overviewMap.active).to.be.true;
  });
});
