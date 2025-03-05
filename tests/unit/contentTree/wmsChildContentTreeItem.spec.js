import { nextTick, ref } from 'vue';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { StateActionState } from '@vcmap/ui';
import VcsUiApp from '../../../src/vcsUiApp.js';
import WMSChildContentTreeItem from '../../../src/contentTree/wmsChildContentTreeItem.js';

describe('ContentTreeItem', () => {
  let app;
  let wmsEntry;
  let wmsChildContentTreeItem;

  beforeAll(() => {
    app = new VcsUiApp();
    wmsEntry = {
      name: 'test',
      active: ref(true),
      activeStyle: ref('testStyle'),
      extent: [0, 0, 0, 0],
      styles: [
        {
          name: 'testStyle',
          title: 'testTitle',
          legend: {
            type: 'ImageLegendItem',
            src: 'test',
          },
        },
        {
          name: 'testStyle2',
          title: 'testTitle2',
        },
      ],
    };
    wmsChildContentTreeItem = new WMSChildContentTreeItem(
      {
        showStyleSelector: true,
        wmsEntry,
      },
      app,
    );
  });

  afterAll(() => {
    app.destroy();
  });

  describe('state', () => {
    it('should set the initial State depending on the input', () => {
      expect(wmsChildContentTreeItem.state).to.be.equal(
        StateActionState.ACTIVE,
      );
    });
    it('should change the state, if the wmsEntry changes', async () => {
      wmsEntry.active.value = false;
      await nextTick();
      expect(wmsChildContentTreeItem.state).to.be.equal(
        StateActionState.INACTIVE,
      );
    });
  });

  describe('actions', () => {
    it('should create extent action', () => {
      const extentAction = wmsChildContentTreeItem.actions.find(
        (action) => action.name === 'content.layerExtentAction.name',
      );
      expect(extentAction).to.not.equal(undefined);
    });
    it('should create style action', () => {
      const extentAction = wmsChildContentTreeItem.actions.find(
        (action) => action.name === 'content.wmsStyleAction.name',
      );
      expect(extentAction).to.not.equal(undefined);
    });
  });
});
