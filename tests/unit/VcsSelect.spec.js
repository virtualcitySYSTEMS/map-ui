import { createLocalVue, mount } from '@vue/test-utils';
import { describe, it, expect, beforeAll } from 'vitest';
import Vuetify from 'vuetify';
import VcsSelect from '../../src/components/form-inputs-controls/VcsSelect.vue';

describe('VcsSelect', () => {
  let localVue;
  let vuetify;

  beforeAll(() => {
    localVue = createLocalVue();
    vuetify = new Vuetify();
  });

  it('should mount', () => {
    const vm = mount(VcsSelect, {
      localVue,
      vuetify,
      propsData: {
        items: [{ text: 'foo', value: 'foo' }, { text: 'bar', value: 'bar' }],
        width: 100,
        height: 32,
      },
    });
    expect(vm.html()).toMatchSnapshot();
    vm.destroy();
  });
});
