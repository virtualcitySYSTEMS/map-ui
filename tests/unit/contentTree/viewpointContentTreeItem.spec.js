import { Viewpoint } from '@vcmap/core';
import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  beforeAll,
  afterAll,
} from 'vitest';
import VcsUiApp from '../../../src/vcsUiApp.js';
import ViewpointContentTreeItem from '../../../src/contentTree/viewpointContentTreeItem.js';

describe('ViewpointContentTreeItem', () => {
  describe('if there is a viewpoint', () => {
    let item;
    /** @type {VcsUiApp} */
    let app;
    let viewpoint;

    beforeEach(() => {
      app = new VcsUiApp();
      viewpoint = new Viewpoint({});
      app.viewpoints.add(viewpoint);
      item = new ViewpointContentTreeItem(
        { name: 'foo', viewpointName: viewpoint.name },
        app,
      );
    });

    afterEach(() => {
      app.destroy();
      item.destroy();
    });

    it('should be visible', () => {
      expect(item.visible).to.be.true;
    });

    it('should no longer be visible, if the viewpoint is removed', () => {
      app.viewpoints.remove(viewpoint);
      expect(item.visible).to.be.false;
    });
  });

  describe('if viewpoint is not present', () => {
    it('should not be visible', () => {
      const app = new VcsUiApp();
      const item = new ViewpointContentTreeItem(
        { name: 'foo', viewpointName: 'foo' },
        app,
      );
      expect(item.visible).to.be.false;
      item.destroy();
      app.destroy();
    });
  });

  describe('serialize', () => {
    let app;

    beforeAll(() => {
      app = new VcsUiApp();
    });

    afterAll(() => {
      app.destroy();
    });

    describe('of an empty item', () => {
      it('should serialize name, type and layerName', () => {
        const item = new ViewpointContentTreeItem(
          { name: 'foo', viewpointName: 'foo' },
          app,
        );
        const config = item.toJSON();
        expect(config).to.have.all.keys(['name', 'type', 'viewpointName']);
        item.destroy();
      });
    });

    describe('of a fully configured item', () => {
      let inputConfig;
      let outputConfig;

      beforeAll(() => {
        inputConfig = {
          name: 'foo',
          icon: '$vcsPen',
          viewpointName: 'foo',
        };
        const item = new ViewpointContentTreeItem(inputConfig, app);
        outputConfig = item.toJSON();
        item.destroy();
      });

      it('should configure icon', () => {
        expect(outputConfig).to.have.property('icon', inputConfig.icon);
      });
    });
  });
});
