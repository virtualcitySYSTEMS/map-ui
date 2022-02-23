import './src/setup.js';
import './src/styles/main.scss';

export { WindowManager, windowSlot, WINDOW_POSITIONS } from './src/modules/window-manager/windowManager.js';
export { default as ButtonManager, ButtonLocation } from './src/modules/component-manager/buttonManager.js';
export { createToggleAction } from './src/actionHelper.js';
export { default as initApp } from './src/init.js';
export { vuetify } from './src/plugins/index.js';

