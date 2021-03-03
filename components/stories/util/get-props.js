/**
 * Gets the name of props from storybook argTypes.
 * This is mostly for rendering the right props in the "View Code" panel.
 * Use options.excludeKeys to
 * @param {Object} argTypes argTypes object from storybook
 * @param {Object} options
 * @param {Array} options.excludeKeys Array of strings containing names of args which should not be added to DOM.
 * @returns {Array} Array of prop names to be rendered in "View Code" panel.
 */
const getProps = (argTypes, { excludeKeys } = { excludeKeys: [] }) => Object
  .keys(argTypes)
  .filter(key => excludeKeys.indexOf(key) < 0);

export default getProps;
