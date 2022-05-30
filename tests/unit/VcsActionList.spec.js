import { createLocalVue, mount } from '@vue/test-utils';
import { describe, it, expect, beforeAll } from 'vitest';
import Vuetify from 'vuetify';
import VcsActionList from '../../src/components/lists/VcsActionList.vue';

describe('VcsActionList', () => {
  let localVue;
  let vuetify;

  beforeAll(() => {
    localVue = createLocalVue();
    vuetify = new Vuetify();
  });

  it('should mount', () => {
    const vm = mount(VcsActionList, {
      localVue,
      vuetify,
      propsData: {
        actions: [{ name: 'foo', callback() {} }, { name: 'bar', callback() {} }],
        tooltipPosition: 'left',
      },
    });
    expect(vm.html()).toMatchSnapshot();
    vm.destroy();
  });
});
