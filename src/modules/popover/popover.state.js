/* eslint-disable import/prefer-default-export */
/**
 * @type {Coordinates}
 * @property {number} x
 * @property {number} y
 */
/**
 * @type {PopoverState}
 * @property {string | VueComponent} component
 * @property {Coordinates} coordinates
 * @property {Function} callback
 */
/** @constant {PopoverState} popoverState */
export const popoverState = {
  component: null,
  coordinates: {},
  callback: () => { },
  id: null,
};

/**
 * @constant
 * @type {PopoversState}
 * @property {Array<PopoverState>} items
 */
/** @constant {PopoversState} popoversState */
export const popoversState = {
  items: [],
};
