import Vue from 'vue';
import Vuex from 'vuex';
import { getField, updateField } from 'vuex-map-fields';
import draggableWindowStoreModule from '@/modules/draggable-window/draggable-window.store';

Vue.use(Vuex);

const store = new Vuex.Store({
  strict: true,
  state: {},
  getters: {
    getField,
  },
  mutations: {
    updateField,
  },
  actions: {},
  modules: {
    draggableWindowStoreModule,
  },
});

// eslint-disable-next-line import/prefer-default-export
export { store };
