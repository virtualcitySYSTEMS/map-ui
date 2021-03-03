const getRootCssValue = varName => getComputedStyle(document.documentElement).getPropertyValue(varName);

// eslint-disable-next-line import/prefer-default-export
export { getRootCssValue };
