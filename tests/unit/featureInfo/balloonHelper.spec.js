import {
  describe,
  beforeAll,
  afterAll,
  expect,
  it,
  vi,
} from 'vitest';

import { getCesiumMap } from '@vcmap/core/tests/unit/helpers/cesiumHelpers.js';
import { getObliqueCollection } from '@vcmap/core/tests/unit/helpers/obliqueHelpers.js';
import { ObliqueMap, OpenlayersMap } from '@vcmap/core';
import { Cartesian2, SceneTransforms } from '@vcmap/cesium';
import VcsUiApp from '../../../src/vcsUiApp.js';
import { balloonOffset, setupBalloonPositionListener } from '../../../src/featureInfo/balloonHelper.js';
import BalloonComponent from '../../../src/featureInfo/BalloonComponent.vue';
import { sleep } from '../../helpers.js';

const clickedPosition = [1489140.34538515, 6894774.914271692, 59.57478554330297];
const rect = { left: 0, top: 0, height: 500, width: 500 };

/**
 * @param {VcsUiApp} app
 * @param {import("@vcmap/core").VcsMap} map
 * @returns {Promise<function(): void>} destroy
 */
async function setupAppForEvents(app, map) {
  app.maps.add(map);
  await app.maps.setActiveMap(map.name);
  const target = document.createElement('div');
  target.classList.add('mapElement');
  document.body.append(target);
  app.maps.setTarget(target);

  app.windowManager.add({
    id: 'balloon',
    component: BalloonComponent,
    props: {
      position: clickedPosition,
    },
  }, 'test');

  return () => {
    app.maps.setTarget(null);
    app.destroy();
  };
}


describe('BalloonHelper', () => {
  let app;

  describe('setupBalloonPositionListener for CesiumMap', () => {
    let destroy;

    beforeAll(async () => {
      app = new VcsUiApp();
      destroy = await setupAppForEvents(app, getCesiumMap());
      await setupBalloonPositionListener(app, 'balloon', clickedPosition);
    });

    afterAll(() => {
      destroy();
      vi.spyOn(SceneTransforms, 'wgs84ToWindowCoordinates').mockClear();
    });

    it('should update position on render', () => {
      const { activeMap } = app.maps;
      vi.spyOn(SceneTransforms, 'wgs84ToWindowCoordinates').mockImplementationOnce(() => new Cartesian2());
      activeMap.getScene().postRender.raiseEvent(activeMap.getScene());
      expect(app.windowManager.get('balloon').position.left).to.equal(`${rect.left - balloonOffset.x}px`);
      expect(app.windowManager.get('balloon').position.bottom).to.equal(`${balloonOffset.y}px`);
    });
  });

  describe('setupBalloonPositionListener for OpenlayersMap', () => {
    let destroy;

    beforeAll(async () => {
      app = new VcsUiApp();
      destroy = await setupAppForEvents(app, new OpenlayersMap({}));
      await setupBalloonPositionListener(app, 'balloon', clickedPosition);
    });

    afterAll(() => {
      destroy();
      vi.spyOn(app.maps.activeMap.olMap, 'getPixelFromCoordinate').mockClear();
    });

    it('should update position on render', async () => {
      const { activeMap } = app.maps;
      vi.spyOn(activeMap.olMap, 'getPixelFromCoordinate').mockImplementationOnce(() => [0, 0]);
      activeMap.olMap.renderSync();
      await sleep();
      expect(app.windowManager.get('balloon').position.left).to.equal(`${rect.left - balloonOffset.x}px`);
      expect(app.windowManager.get('balloon').position.bottom).to.equal(`${balloonOffset.y}px`);
    });
  });

  describe('setupBalloonPositionListener for ObliqueMap', () => {
    let destroy;

    beforeAll(async () => {
      app = new VcsUiApp();
      const map = new ObliqueMap({});
      await map.setCollection(getObliqueCollection());
      await map.initialize();
      await map.setImageByName('036_064_116005331');
      destroy = await setupAppForEvents(app, map);
      await setupBalloonPositionListener(app, 'balloon', clickedPosition);
    });

    afterAll(() => {
      destroy();
      vi.spyOn(app.maps.activeMap.olMap, 'getPixelFromCoordinate').mockClear();
    });

    it('should update position on render', async () => {
      const { activeMap } = app.maps;
      vi.spyOn(activeMap.olMap, 'getPixelFromCoordinate').mockImplementationOnce(() => [0, 0]);
      activeMap.olMap.renderSync();
      await sleep();
      expect(app.windowManager.get('balloon').position.left).to.equal(`${rect.left - balloonOffset.x}px`);
      expect(app.windowManager.get('balloon').position.bottom).to.equal(`${balloonOffset.y}px`);
    });

    it('should update position after image change', async () => {
      const { activeMap } = app.maps;
      await activeMap.setCollection(getObliqueCollection());
      await activeMap.initialize();
      vi.spyOn(activeMap.olMap, 'getPixelFromCoordinate').mockImplementationOnce(() => [0, 0]);
      await activeMap.setImageByName('otherImage');
      activeMap.olMap.renderSync();
      await sleep();
      expect(app.windowManager.get('balloon').position.left).to.equal(`${rect.left - balloonOffset.x}px`);
      expect(app.windowManager.get('balloon').position.bottom).to.equal(`${balloonOffset.y}px`);
    });
  });
});
