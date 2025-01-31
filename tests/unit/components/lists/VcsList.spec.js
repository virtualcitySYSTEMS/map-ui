import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { reactive } from 'vue';
import {
  createSafeI18n,
  createVueI18n,
} from '../../../../src/vuePlugins/i18n.js';
import VcsList from '../../../../src/components/lists/VcsList.vue';

describe('VcsList', () => {
  describe('items which are rendered', () => {
    let items;
    let component;

    beforeEach(() => {
      items = reactive([
        {
          name: 'foo',
          title: 'foo',
        },
        {
          name: 'bar',
          title: 'bar',
        },
        {
          name: 'baz',
          title: 'baz',
          visible: true,
        },
        {
          name: 'foobar',
          title: 'foobar',
        },
        {
          name: 'foobaz',
          title: 'foobaz',
        },
      ]);
      const vueI18n = createVueI18n();
      const safeI18n = createSafeI18n();
      component = shallowMount(VcsList, {
        props: { items },
        global: {
          plugins: [vueI18n, safeI18n],
        },
      });
    });

    afterEach(() => {
      component.unmount();
    });

    it('should not render invisible items', () => {
      items[2].visible = false;
      component.setProps({ items: items.map((i) => ({ ...i })) });
      expect(component.vm.renderingItems).to.not.include(items[2]);
    });

    it('should only rendered queried items', () => {
      component.vm.query = 'foo';
      expect(component.vm.renderingItems).to.have.members([
        items[0],
        items[3],
        items[4],
      ]);
    });
  });
});
