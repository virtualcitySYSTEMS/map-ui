import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { reactive } from 'vue';
import { createVuetify } from 'vuetify';
import {
  createSafeI18n,
  createVueI18n,
} from '../../../../src/vuePlugins/i18n.js';
import VcsList from '../../../../src/components/lists/VcsList.vue';
import VcsTreeview from '../../../../src/components/lists/VcsTreeview.vue';
import VcsGroupedList from '../../../../src/components/lists/VcsGroupedList.vue';

[
  ['VcsList', VcsList, 'searchable'],
  ['VcsTreeview', VcsTreeview, 'showSearchbar'],
  ['VcsGroupedList', VcsGroupedList, 'searchable'],
].forEach(([name, componentType, searchbarProp]) => {
  describe(`${name} sticky searchbar`, () => {
    let component;

    beforeEach(() => {
      component = shallowMount(componentType, {
        props: { items: [], [searchbarProp]: true },
        attrs: { class: 'test-layout', style: 'max-height: 600px' },
        global: {
          plugins: [createVuetify(), createVueI18n(), createSafeI18n()],
        },
      });
    });

    afterEach(() => {
      component.unmount();
    });

    it('should use the non-sticky layout by default', () => {
      expect(component.props('stickySearchbar')).to.be.false;
      expect(component.classes()).to.not.include('sticky-searchbar');
      if (name === 'VcsList') {
        expect(component.classes()).to.not.include('d-contents');
      }
    });

    it('should apply height constraints to the outer container', () => {
      expect(component.attributes('style')).to.include('max-height: 600px');
      expect(component.classes()).to.include('test-layout');
    });

    it('should opt into the sticky layout and allow opting out', async () => {
      await component.setProps({ stickySearchbar: true });
      expect(component.classes()).to.include('sticky-searchbar');
      if (name === 'VcsList') {
        expect(component.classes()).to.not.include('d-contents');
      }
      await component.setProps({ stickySearchbar: false });
      expect(component.classes()).to.not.include('sticky-searchbar');
    });

    it('should not change the layout when the searchbar is hidden', async () => {
      await component.setProps({
        stickySearchbar: true,
        [searchbarProp]: false,
      });
      expect(component.classes()).to.not.include('sticky-searchbar');
      if (name === 'VcsList') {
        expect(component.classes()).to.not.include('d-contents');
      }
    });
  });
});

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
