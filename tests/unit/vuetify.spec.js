import {
  describe,
  it,
  expect,
} from 'vitest';
import { vuetify, defaultPrimaryColor, getColorByKey } from '../../src/vuePlugins/vuetify.js';

/**
 * copied from browser
 */
const cssColors = {
  '--v-primary-base': '#409d76',
  '--v-primary-lighten5': '#cdfffe',
  '--v-primary-lighten4': '#b0ffe2',
  '--v-primary-lighten3': '#94f1c6',
  '--v-primary-lighten2': '#78d4aa',
  '--v-primary-lighten1': '#5cb890',
  '--v-primary-darken1': '#20825d',
  '--v-primary-darken2': '#006946',
  '--v-primary-darken3': '#00502f',
  '--v-primary-darken4': '#00381a',
  '--v-base-base': '#9e9e9e',
  '--v-base-lighten5': '#ffffff',
  '--v-base-lighten4': '#f8f8f8',
  '--v-base-lighten3': '#ebebeb',
  '--v-base-lighten2': '#d0d0d0',
  '--v-base-lighten1': '#b8b8b8',
  '--v-base-darken1': '#858585',
  '--v-base-darken2': '#6b6b6b',
  '--v-base-darken3': '#525252',
  '--v-base-darken4': '#383838',
};

const variations = [
  'base',
  ...[1, 2, 3, 4, 5].map(idx => `lighten${idx}`),
  ...[1, 2, 3, 4].map(idx => `darken${idx}`),
];

describe('vuetify', () => {
  describe('getColorByKey', () => {
    describe('from color defined as string without custom variations', () => {
      it('should return primary base, when not providing a variant', () => {
        expect(getColorByKey('primary')).to.equal(defaultPrimaryColor.light);
      });
      it('should consider dark mode', () => {
        vuetify.framework.theme.isDark = true;
        expect(getColorByKey('primary')).to.equal(defaultPrimaryColor.dark);
        vuetify.framework.theme.isDark = false;
      });
      it('should return primary variations', () => {
        variations.forEach((v) => {
          expect(getColorByKey('primary', v).toUpperCase()).to.equal(cssColors[`--v-primary-${v}`].toUpperCase());
        });
      });
    });

    describe('from color defined as object with custom variations', () => {
      it('should return base color, when not providing a variant', () => {
        expect(getColorByKey('base')).to.equal('#9E9E9E');
      });
      it('should return base variations', () => {
        variations.forEach((v) => {
          console.log(v);
          expect(getColorByKey('base', v).toUpperCase()).to.equal(cssColors[`--v-base-${v}`].toUpperCase());
        });
      });
    });

    describe('color not defined in theme', () => {
      it('should return undefined, if a color is not defined in the vuetify theme', () => {
        expect(getColorByKey('pink')).to.undefined;
      });
    });
  });
});
