/* eslint-disable import/prefer-default-export */
/**
 * @function
 * @param {Object} state Popover injection
 * @param {string} id Id of popover to be removed
 */
export const removePopover = (state, id) => {
  state.items = state.items.filter(p => p.id !== id);
};
