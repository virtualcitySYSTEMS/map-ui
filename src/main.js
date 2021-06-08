import './styles/main.scss';
import './filters';
import './treeview/treeViewItems';

import Vue from 'vue';
import VueCompositionAPI from '@vue/composition-api';

import App from './App.vue';
import { i18n } from './plugins/i18n';
import { vuetify } from './plugins/vuetify';


Vue.config.productionTip = false;

Vue.use(VueCompositionAPI);

window.CESIUM_BASE_URL = process.env.VUE_APP_CESIUM_BASE_URL;

new Vue({
  vuetify,
  i18n,
  render: h => h(App),
}).$mount('#app');
