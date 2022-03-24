import {
  describe,
  beforeAll,
  afterAll,
  expect,
  it,
} from 'vitest';
import { VcsObject } from '@vcmap/core';
import VcsObjectContentTreeItem from '../../../src/contentTree/vcsObjectContentTreeItem.js';
import VcsUiApp from '../../../src/vcsUiApp.js';

describe('VcsObjectContentTreeItem', () => {
  let app;
  beforeAll(() => {
    app = new VcsUiApp();
  });

  afterAll(() => {
    app.destroy();
  });

  describe('serialize an item', () => {
    describe('with no properties set from an object', () => {
      let inputConfig;
      let outputConfig;

      beforeAll(() => {
        inputConfig = {
          name: 'foo',
          title: 'foo',
          icon: 'foo.png',
          infoUrl: 'localhost',
        };

        outputConfig = new VcsObjectContentTreeItem(inputConfig, app).toJSON();
      });

      it('should serialize name', () => {
        expect(outputConfig).to.have.property('name', inputConfig.name);
      });

      it('should serialize title', () => {
        expect(outputConfig).to.have.property('title', inputConfig.title);
      });

      it('should serialize icon', () => {
        expect(outputConfig).to.have.property('icon', inputConfig.icon);
      });

      it('should serialize infoUrl', () => {
        expect(outputConfig).to.have.property('infoUrl', inputConfig.infoUrl);
      });
    });

    describe('with all properties set from an object', () => {
      let inputConfig;
      let outputConfig;

      beforeAll(() => {
        inputConfig = {
          name: 'foo',
        };
        const item = new VcsObjectContentTreeItem(inputConfig, app);
        const object = new VcsObject({
          properties: {
            title: 'foo',
            icon: 'foo.png',
            infoUrl: 'localhost',
          },
        });
        item.setPropertiesFromObject(object);
        outputConfig = item.toJSON();
      });

      it('should serialize name', () => {
        expect(outputConfig).to.have.property('name', inputConfig.name);
      });

      it('should only serialize name & type', () => {
        expect(outputConfig).to.have.all.keys(['name', 'type']);
      });
    });

    describe('with some properties overridden by the item config', () => {
      let inputConfig;
      let outputConfig;

      beforeAll(() => {
        inputConfig = {
          name: 'foo',
          icon: 'bar.png',
        };
        const item = new VcsObjectContentTreeItem(inputConfig, app);
        const object = new VcsObject({
          properties: {
            title: 'foo',
            icon: 'foo.png',
            infoUrl: 'localhost',
          },
        });
        item.setPropertiesFromObject(object);
        outputConfig = item.toJSON();
      });

      it('should serialize name', () => {
        expect(outputConfig).to.have.property('name', inputConfig.name);
      });

      it('should serialize overridden icon', () => {
        expect(outputConfig).to.have.property('icon', inputConfig.icon);
      });

      it('should only serialize name, type & overridden icon', () => {
        expect(outputConfig).to.have.all.keys(['name', 'type', 'icon']);
      });
    });

    describe('with some properties identical on object & item config', () => {
      let inputConfig;
      let outputConfig;

      beforeAll(() => {
        inputConfig = {
          name: 'foo',
          icon: 'foo.png',
        };
        const item = new VcsObjectContentTreeItem(inputConfig, app);
        const object = new VcsObject({
          properties: {
            title: 'foo',
            icon: 'foo.png',
            infoUrl: 'localhost',
          },
        });
        item.setPropertiesFromObject(object);
        outputConfig = item.toJSON();
      });

      it('should serialize name', () => {
        expect(outputConfig).to.have.property('name', inputConfig.name);
      });

      it('should serialize icon allthought its also defined on the properties', () => {
        expect(outputConfig).to.have.property('icon', inputConfig.icon);
      });

      it('should only serialize name, type & overridden icon', () => {
        expect(outputConfig).to.have.all.keys(['name', 'type', 'icon']);
      });
    });
  });

  describe('setting of item properties', () => {
    describe('with no properties set from an object', () => {
      let inputConfig;
      let item;

      beforeAll(() => {
        inputConfig = {
          name: 'foo',
          title: 'foo',
          icon: 'foo.png',
          infoUrl: 'localhost',
        };

        item = new VcsObjectContentTreeItem(inputConfig, app);
        item.setPropertiesFromObject(new VcsObject({}));
      });

      it('should set name from config', () => {
        expect(item).to.have.property('name', inputConfig.name);
      });

      it('should set title from config', () => {
        expect(item).to.have.property('title', inputConfig.title);
      });

      it('should set icon from config', () => {
        expect(item).to.have.property('icon', inputConfig.icon);
      });

      it('should set infoUrl from config', () => {
        expect(item).to.have.property('infoUrl', inputConfig.infoUrl);
      });
    });

    describe('with all properties set from an object', () => {
      let inputConfig;
      let item;
      let object;

      beforeAll(() => {
        inputConfig = {
          name: 'foo',
        };
        item = new VcsObjectContentTreeItem(inputConfig, app);
        object = new VcsObject({
          properties: {
            title: 'foo',
            icon: 'foo.png',
            infoUrl: 'localhost',
          },
        });
        item.setPropertiesFromObject(object);
      });

      it('should set name from config', () => {
        expect(item).to.have.property('name', inputConfig.name);
      });

      it('should set title from object properties', () => {
        expect(item).to.have.property('title', object.properties.title);
      });

      it('should set icon from object properties', () => {
        expect(item).to.have.property('icon', object.properties.icon);
      });

      it('should set infoUrl from object properties', () => {
        expect(item).to.have.property('infoUrl', object.properties.infoUrl);
      });
    });

    describe('with some properties overridden by the item config', () => {
      let inputConfig;
      let item;
      let object;

      beforeAll(() => {
        inputConfig = {
          name: 'foo',
          icon: 'bar.png',
        };
        item = new VcsObjectContentTreeItem(inputConfig, app);
        object = new VcsObject({
          properties: {
            title: 'foo',
            icon: 'foo.png',
            infoUrl: 'localhost',
          },
        });
        item.setPropertiesFromObject(object);
      });

      it('should set name from config', () => {
        expect(item).to.have.property('name', inputConfig.name);
      });

      it('should set title from object properties', () => {
        expect(item).to.have.property('title', object.properties.title);
      });

      it('should set overridden icon from config', () => {
        expect(item).to.have.property('icon', inputConfig.icon);
      });

      it('should set infoUrl from object properties', () => {
        expect(item).to.have.property('infoUrl', object.properties.infoUrl);
      });
    });
  });
});
