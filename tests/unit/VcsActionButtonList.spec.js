import { createLocalVue, mount } from '@vue/test-utils';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Vuetify from 'vuetify';
import VcsActionButtonList from '../../src/components/buttons/VcsActionButtonList.vue';

describe('VcsActionButtonList', () => {
  let localVue;
  let vuetify;
  let actions;
  let cmp;

  beforeEach(() => {
    localVue = createLocalVue();
    vuetify = new Vuetify();
    actions = [
      { name: 'foo', callback() {} },
      { name: 'bar', callback() {} },
      { name: 'icon', icon: '$vcsIcon', callback() {} },
      { name: 'icon2', icon: '$vcsIcon2', callback() {} },
    ];
    cmp = mount(VcsActionButtonList, {
      localVue,
      vuetify,
      propsData: {
        actions,
      },
    });
  });

  afterEach(() => cmp.destroy());

  describe('compute buttons and overflow buttons', () => {
    it('should filter actions with no icon', () => {
      expect(cmp.vm.actions).toMatchObject(actions);
      expect(cmp.vm.buttons).toMatchObject([actions[2], actions[3]]);
      expect(cmp.vm.overflowButtons).toMatchObject([actions[0], actions[1]]);
    });

    it('should filter by overflowCount', () => {
      cmp.vm.$props.overflowCount = 1;
      expect(cmp.vm.actions).toMatchObject(actions);
      expect(cmp.vm.buttons).toMatchObject([actions[2]]);
      expect(cmp.vm.overflowButtons).toMatchObject([actions[0], actions[1], actions[3]]);
    });
  });
});
