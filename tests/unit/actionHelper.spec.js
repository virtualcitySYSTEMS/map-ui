import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  beforeAll,
  afterAll,
} from 'vitest';
import {
  FlatGeobufTileProvider,
  MapCollection,
  PanoramaDatasetLayer,
  Extent,
} from '@vcmap/core';
import { getPanoramaMap } from '@vcmap/core/dist/tests/unit/helpers/panoramaHelpers.js';
import {
  callSafeAction,
  createMapButtonAction,
} from '../../src/actions/actionHelper.ts';
import {
  validateAction,
  validateActions,
} from '../../src/actions/actionValidation.ts';
import { sleep } from '../helpers.js';

describe('actionHelpers', () => {
  describe('validateAction', () => {
    it('accepts an action with only required properties', () => {
      expect(validateAction({ name: 'action', callback: vi.fn() })).to.be.true;
    });

    it('accepts valid optional properties', () => {
      expect(
        validateAction({
          name: 'action',
          callback: vi.fn(),
          title: 'Action title',
          icon: '$vcsInfo',
          active: true,
          background: false,
          hasUpdate: true,
          disabled: false,
        }),
      ).to.be.true;
    });

    it('rejects missing properties and invalid property types', () => {
      const callback = vi.fn();
      const invalidActions = [
        { callback },
        { name: 'action' },
        { name: 1, callback },
        { name: 'action', callback: 'invalid' },
        { name: 'action', callback, title: false },
        { name: 'action', callback, icon: false },
        { name: 'action', callback, active: 'invalid' },
        { name: 'action', callback, background: 'invalid' },
        { name: 'action', callback, hasUpdate: 'invalid' },
        { name: 'action', callback, disabled: 'invalid' },
      ];
      for (const action of invalidActions) {
        expect(validateAction(action)).to.be.false;
      }
    });
  });

  describe('validateActions', () => {
    it('accepts an empty array', () => {
      expect(validateActions([])).to.be.true;
    });

    it('accepts an array of valid actions', () => {
      expect(
        validateActions([
          { name: 'first', callback: vi.fn() },
          { name: 'second', callback: vi.fn(), disabled: true },
        ]),
      ).to.be.true;
    });

    it('rejects an array containing an invalid action', () => {
      expect(
        validateActions([
          { name: 'valid', callback: vi.fn() },
          { name: 'invalid' },
        ]),
      ).to.be.false;
    });
  });

  describe('callSafeAction helper', () => {
    it('should call the callback and log no error when the callback is synchronous and succeeds', () => {
      const action = {
        name: 'syncSuccessfulAction',
        title: 'Sync Successful Action',
        callback: vi.fn(),
      };
      callSafeAction(action);
      expect(action.callback).toBeCalled;
    });

    it('should catch and log an error when the synchronous callback throws an error', () => {
      const action = {
        name: 'syncThrowingAction',
        title: 'Sync Throwing Action',
        callback: vi.fn(() => {
          throw new Error('Something went wrong');
        }),
      };
      callSafeAction(action);
      expect(action.callback).toBeCalled;
    });

    it('should handle a promise returning asynchronous callback and log no error when it resolves', async () => {
      const action = {
        name: 'asyncSuccessfulAction',
        title: 'Async Successful Action',
        callback: vi.fn(async () => Promise.resolve()),
      };
      callSafeAction(action);
      await sleep();
      expect(action.callback).toBeCalled;
    });

    it('should catch and log an error when the asynchronous callback throws an error', async () => {
      const action = {
        name: 'asyncThrowingAction',
        title: 'Async Throwing Action',
        callback: vi.fn(async () =>
          Promise.reject(new Error('Something went wrong')),
        ),
      };
      callSafeAction(action);
      await sleep();
      expect(action.callback).toBeCalled;
    });
  });

  describe('setupDisablePanorama', () => {
    beforeAll(() => {
      vi.spyOn(
        FlatGeobufTileProvider.prototype,
        'getLevelExtent',
      ).mockImplementation(() => Promise.resolve(new Extent()));
    });

    afterAll(() => {
      vi.resetAllMocks();
    });

    describe('with a panorama dataset', () => {
      let dataset;
      let dataset2;
      let panoramaMap;
      let mapCollection;
      let mapAction;
      let destroyAction;

      beforeEach(() => {
        dataset = new PanoramaDatasetLayer({ url: 'http://localhost/foo.fgb' });
        dataset2 = new PanoramaDatasetLayer({
          url: 'http://localhost/foo.fgb',
        });
        mapCollection = new MapCollection();
        panoramaMap = getPanoramaMap({ name: 'panoramaMap' });
        mapCollection.add(panoramaMap);
        panoramaMap.layerCollection.add(dataset);
        panoramaMap.layerCollection.add(dataset2);
        ({ action: mapAction, destroy: destroyAction } = createMapButtonAction(
          { name: 'testAction', title: 'Test Action' },
          'panoramaMap',
          mapCollection,
        ));
      });

      afterEach(() => {
        mapCollection.destroy();
        panoramaMap.destroy();
        destroyAction();
        dataset.destroy();
        dataset2.destroy();
      });

      it('should disable the action, if no dataset is active', () => {
        expect(mapAction.disabled).to.be.true;
      });

      it('should not be disabled, if there is an active dataset', async () => {
        await dataset.activate();
        expect(mapAction.disabled).to.be.false;
      });

      it('should disable the action, if the active dataset is deactivated', async () => {
        await dataset.activate();
        expect(mapAction.disabled).to.be.false;
        dataset.deactivate();
        expect(mapAction.disabled).to.be.true;
      });

      it('should not be disabled, if at least ONE dataset is active', async () => {
        await dataset.activate();
        await dataset2.activate();
        expect(mapAction.disabled).to.be.false;
        dataset.deactivate();
        expect(mapAction.disabled).to.be.false;
      });

      it('should be disabled, if removing the only active dataset', async () => {
        await dataset.activate();
        expect(mapAction.disabled).to.be.false;
        panoramaMap.layerCollection.remove(dataset);
        expect(mapAction.disabled).to.be.true;
      });

      it('should no longer listen to removed datasets', async () => {
        panoramaMap.layerCollection.remove(dataset);
        await dataset.activate();
        expect(mapAction.disabled).to.be.true;
      });
    });

    describe('when adding a dataset', () => {
      let dataset;
      let panoramaMap;
      let mapCollection;
      let mapAction;
      let destroyAction;

      beforeEach(() => {
        dataset = new PanoramaDatasetLayer({ url: 'foo ' });
        mapCollection = new MapCollection();
        panoramaMap = getPanoramaMap({ name: 'panoramaMap' });
        mapCollection.add(panoramaMap);
        ({ action: mapAction, destroy: destroyAction } = createMapButtonAction(
          { name: 'testAction', title: 'Test Action' },
          'panoramaMap',
          mapCollection,
        ));
      });

      afterEach(() => {
        mapCollection.destroy();
        panoramaMap.destroy();
        destroyAction();
        dataset.destroy();
      });

      it('should disable the action, if there are no datasets', () => {
        expect(mapAction.disabled).to.be.true;
      });

      it('should listen to changes of added datasets', async () => {
        panoramaMap.layerCollection.add(dataset);
        expect(mapAction.disabled).to.be.true;
        await dataset.activate();
        expect(mapAction.disabled).to.be.false;
      });

      it('should not be disabled, if the dataset added is also active', async () => {
        await dataset.activate();
        panoramaMap.layerCollection.add(dataset);
        expect(mapAction.disabled).to.be.false;
      });
    });
  });
});
