import { createLocalVue, mount } from '@vue/test-utils';
import {
  describe,
  beforeAll,
  expect,
  it,
} from 'vitest';
import Vuetify from 'vuetify';
import VcsCompass from '../../../src/components/navigation/VcsCompass.vue';

describe('VcsCompass', () => {
  let localVue;
  let vuetify;

  beforeAll(() => {
    localVue = createLocalVue();
    vuetify = new Vuetify();
  });

  describe('trackMouse', () => {
    it('should emit a value when the mouse moves', () => {
      const wrapper = mount(VcsCompass, {
        localVue,
        vuetify,
      });

      wrapper.vm.trackMouse(new Event('click'));
      expect(wrapper.emitted()).to.have.property('input').and.to.have.lengthOf(1);
    });

    it('should set \'grabbing\' to true when subscription starts', () => {
      const wrapper = mount(VcsCompass, {
        localVue,
        vuetify,
      });

      wrapper.vm.trackMouse(new Event('click'));
      expect(wrapper.vm.grabbing).to.be.true;
    });

    it('should set \'grabbing\' to false when subscription ends', () => {
      const wrapper = mount(VcsCompass, {
        localVue,
        vuetify,
      });

      wrapper.vm.trackMouse(new Event('click'));
      document.body.dispatchEvent(new Event('mouseup'));

      expect(wrapper.vm.grabbing).to.eq(false);
    });
  });
});
