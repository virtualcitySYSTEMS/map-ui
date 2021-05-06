export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
};
import Vue from 'vue';
import Vuetify from 'vuetify';
import 'vuetify/dist/vuetify.min.css';
import '@mdi/font/css/materialdesignicons.css';
import { DocsContainer, DocsPage } from '@storybook/addon-docs/blocks';
import { addDecorator, addParameters } from '@storybook/vue';

import { vuetify } from '../src/plugins/vuetify';
import { i18n } from '../src/plugins/i18n';
import '../src/filters';

import '../src/styles/main.scss';

import './styles.css';

Vue.use(Vuetify);

/**
 * Root element for all stories.
 * Needs vuetify as wrapper for styles.
 */
addDecorator(() => ({
  vuetify,
  i18n,
  template: `
    <v-app class="storybook">
      <v-main>
        <v-container fluid >
          <story/>
        </v-container>
      </v-main>
    </v-app>
    `,
}));

addParameters({
  docs: {
    container: DocsContainer,
    page: DocsPage,
  },
});
