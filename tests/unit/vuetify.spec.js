import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  defaultPrimaryColor,
  getColorByKey,
} from '../../src/vuePlugins/vuetify.js';
import { VcsUiApp } from '../../index.js';

/**
 * copied from browser
 */
const cssColors = {
  '--v-theme-primary': '#409d76',
  '--v-theme-primary-lighten-5': '#cdfffe',
  '--v-theme-primary-lighten-4': '#b0ffe2',
  '--v-theme-primary-lighten-3': '#94f1c6',
  '--v-theme-primary-lighten-2': '#78d4aa',
  '--v-theme-primary-lighten-1': '#5cb890',
  '--v-theme-primary-darken-1': '#20825d',
  '--v-theme-primary-darken-2': '#006946',
  '--v-theme-primary-darken-3': '#00502f',
  '--v-theme-primary-darken-4': '#00381a',
  '--v-theme-base': '#9e9e9e',
  '--v-theme-base-lighten-5': '#ffffff',
  '--v-theme-base-lighten-4': '#f8f8f8',
  '--v-theme-base-lighten-3': '#ebebeb',
  '--v-theme-base-lighten-2': '#d0d0d0',
  '--v-theme-base-lighten-1': '#b8b8b8',
  '--v-theme-base-darken-1': '#858585',
  '--v-theme-base-darken-2': '#6b6b6b',
  '--v-theme-base-darken-3': '#525252',
  '--v-theme-base-darken-4': '#383838',
};

const variations = [
  ...[1, 2, 3, 4, 5].map((idx) => `lighten-${idx}`),
  ...[1, 2, 3, 4].map((idx) => `darken-${idx}`),
];

describe('vuetify', () => {
  let app;

  beforeEach(() => {
    app = new VcsUiApp();
  });

  afterEach(() => {
    app.destroy();
  });

  describe('getColorByKey', () => {
    describe('from color defined as string without custom variations', () => {
      it('should return primary base, when not providing a variant', () => {
        expect(getColorByKey(app, 'primary')).to.equal(
          defaultPrimaryColor.light,
        );
      });

      it('should consider dark mode', () => {
        app.vuetify.theme.global.name.value = 'dark';
        expect(getColorByKey(app, 'primary')).to.equal(
          defaultPrimaryColor.dark,
        );
        app.vuetify.theme.global.name.value = 'light';
      });

      it('should return primary variations', () => {
        variations.forEach((v) => {
          expect(getColorByKey(app, 'primary', v).toUpperCase()).to.equal(
            cssColors[`--v-theme-primary-${v}`].toUpperCase(),
          );
        });
      });
    });

    describe('from color defined as object with custom variations', () => {
      it('should return base color, when not providing a variant', () => {
        expect(getColorByKey(app, 'base')).to.equal('#9E9E9E');
      });

      it('should return base variations', () => {
        variations.forEach((v) => {
          expect(getColorByKey(app, 'base', v).toUpperCase()).to.equal(
            cssColors[`--v-theme-base-${v}`].toUpperCase(),
          );
        });
      });
    });

    describe('color not defined in theme', () => {
      it('should return undefined, if a color is not defined in the vuetify theme', () => {
        expect(getColorByKey(app, 'pink')).to.undefined;
      });
    });
  });
});
