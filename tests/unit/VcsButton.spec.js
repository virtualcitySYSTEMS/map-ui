import { createLocalVue, mount } from '@vue/test-utils';
import { describe, it, expect, beforeAll } from 'vitest';
import Vuetify from 'vuetify';
import VcsButton from '../../src/components/buttons/VcsButton.vue';
import VcsBadge from '../../src/components/notification/VcsBadge.vue';

describe('VcsButton', () => {
  let localVue;
  let vuetify;

  beforeAll(() => {
    localVue = createLocalVue();
    vuetify = new Vuetify();
  });

  it('should mount', () => {
    const vm = mount(VcsButton, {
      localVue,
      vuetify,
    });

    expect(vm.html()).toMatchSnapshot();
    vm.destroy();
  });

  it('should render a button with an update', () => {
    const vm = mount(VcsButton, {
      localVue,
      vuetify,
      propsData: {
        hasUpdate: true,
      },
    });

    expect(vm.findComponent(VcsBadge)).to.be.exist;
    vm.destroy();
  });
});
