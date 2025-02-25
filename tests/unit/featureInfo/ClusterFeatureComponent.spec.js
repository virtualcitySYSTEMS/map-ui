import { VectorLayer } from '@vcmap/core';
import { shallowMount } from '@vue/test-utils';
import {
  describe,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
  it,
  expect,
} from 'vitest';
import { createVuetify } from 'vuetify';
import { createSafeI18n, createVueI18n } from '../../../src/vuePlugins/i18n.js';
import { ClusterFeatureComponent, VcsUiApp } from '../../../index.js';
import Icons from '../../../src/components/icons/+all.js';

describe('ClusterFeatureComponent', () => {
  let vcsApp;
  let layer1;
  let layer2;

  beforeAll(() => {
    vcsApp = new VcsUiApp();
    layer1 = new VectorLayer({});
    layer2 = new VectorLayer({});
    vcsApp.layers.add(layer1);
    vcsApp.layers.add(layer2);
  });

  afterAll(() => {
    vcsApp.destroy();
  });

  describe('deactivating a layer', () => {
    let component;

    beforeEach(async () => {
      const vueI18n = createVueI18n();
      const safeI18n = createSafeI18n();
      const vuetify = createVuetify({
        icons: {
          aliases: {
            ...Icons,
          },
        },
      });
      await layer1.activate();
      await layer2.activate();

      const items = [
        {
          name: 'foo',
          title: 'foo',
          group: layer1.name,
        },
        {
          name: 'bar',
          title: 'foo',
          group: layer1.name,
        },
        {
          name: 'bar',
          title: 'bar',
          group: layer2.name,
        },
      ];
      const groups = [
        {
          name: layer1.name,
          title: 'layer1',
        },
        {
          name: layer2.name,
          title: 'layer2',
        },
      ];

      component = shallowMount(ClusterFeatureComponent, {
        props: { items, groups },
        global: {
          plugins: [vueI18n, safeI18n, vuetify],
          provide: {
            vcsApp,
          },
        },
      });
    });

    afterEach(() => {
      component.unmount();
    });

    it('should render a group for each layer', () => {
      expect(component.vm.groups).toHaveLength(2);
    });

    it('should remove groups, if the layer they belong to is no longer active', () => {
      layer1.deactivate();
      expect(component.vm.groups).toHaveLength(1);
    });

    it('should emit close, if all layers are deactivated', () => {
      layer1.deactivate();
      layer2.deactivate();
      expect(component.emitted('close')).toHaveLength(1);
    });
  });
});
