import Vue from 'vue';
import Vuex from 'vuex';
import { getField, updateField } from 'vuex-map-fields';


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
});

// eslint-disable-next-line import/prefer-default-export
export { store };
