import './styles/main.scss';
import './filters';

import Vue from 'vue';

import App from './App.vue';
import { i18n } from './plugins/i18n';
import { vuetify } from './plugins/vuetify';
import { store } from './store';

Vue.config.productionTip = false;

new Vue({
  store,
  vuetify,
  i18n,
  render: h => h(App),
}).$mount('#app');
