import Vue from 'vue';
import VueCompositionAPI from '@vue/composition-api';
// eslint-disable-next-line no-unused-vars
import * as core from '@vcmap/core'; // pull in entire core for vcsClassRegistry

Vue.config.productionTip = false;

Vue.use(VueCompositionAPI);

window.CESIUM_BASE_URL = '/node_modules/@vcmap/cesium/Source/';
