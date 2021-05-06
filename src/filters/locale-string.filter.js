import Vue from 'vue';

/**
 * @description
 * Converts a number (e.g. 12345678,9) to a locale-aware and
 * dot-seperated string with given amount of fractional digits (e.g. 12.345.678,90)
 */
const localeString = Vue.filter('localeString', (value, { fractionDigits }) => {
  const number = parseInt(value, 10);

  if (Number.isNaN(number)) {
    return number;
  }

  return value.toLocaleString(navigator.language, { maximumFractionDigits: fractionDigits });
});

// eslint-disable-next-line import/prefer-default-export
export { localeString };
