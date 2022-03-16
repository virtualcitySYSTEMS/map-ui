import './src/setup.js';
import './src/styles/main.scss';

export { WindowManager, windowSlot, WINDOW_POSITIONS } from './src/manager/window/windowManager.js';
export { default as ButtonManager, ButtonLocation } from './src/manager/buttonManager.js';
export * from './src/actions/actionHelper.js';
export { default as initApp } from './src/init.js';
export { vuetify } from './src/vuePlugins/vuetify.js';
export { default as EmptyCmpt } from './src/application/empty-cmp.vue';

