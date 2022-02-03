import './styles/main.scss';
import './treeview/treeViewItems.js';

import Vue from 'vue';
import VueCompositionAPI from '@vue/composition-api';
// eslint-disable-next-line no-unused-vars
import * as core from '@vcmap/core'; // pull in entire core for vcsClassRegistry

import App from './App.vue';
import { i18n } from './plugins/i18n.js';
import { vuetify } from './plugins/vuetify.js';

Vue.config.productionTip = false;

Vue.use(VueCompositionAPI);

window.CESIUM_BASE_URL = '/node_modules/@vcmap/cesium/Source/';

new Vue({
  vuetify,
  i18n,
  render: h => h(App),
}).$mount('#app');
