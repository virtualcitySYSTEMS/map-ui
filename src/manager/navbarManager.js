import { check, ofEnum, optional } from '@vcsuite/check';
import ButtonManager, { sortByWeight } from './buttonManager.js';
import { vcsAppSymbol } from '../pluginHelper.js';

export const locationSymbol = Symbol('location');
export const deviceSymbol = Symbol('device');

/**
 * sorts by owner and optionally plugin order
 * @param {string | symbol} ownerA
 * @param {string | symbol} ownerB
 * @param {string[]} [order] order of owners to sort by
 * @returns {number}
 */
export function sortByOwner(ownerA, ownerB, order = []) {
  const sorted = [vcsAppSymbol, ...order];
  const indexA = sorted.indexOf(ownerA);
  const indexB = sorted.indexOf(ownerB);

  if (indexA === indexB) {
    return 0;
  }

  if (indexA === -1) {
    return 1;
  }

  if (indexB === -1) {
    return -1;
  }
  return indexA - indexB;
}

/**
 * filters actions by button location and returns actions (optionally sorted)
 * @param {Array<import("./buttonManager.js").ButtonComponent>} buttonComponents
 * @param {ButtonLocation} location Button render position
 * @param {string[]} [order] optional order to sort by (plugin names)
 * @param {function(import("./buttonManager.js").ButtonComponent, import("./buttonManager.js").ButtonComponent):number} [compareFn=sortByOwner] Per default components are sorted by weight (highest first) and owner (app first, then plugins)
 * @returns {Array<import("../actions/actionHelper.js").VcsAction>}
 */
export function getActionsByLocation(
  buttonComponents,
  location,
  order = [],
  compareFn = (a, b) =>
    sortByWeight(a.weight, b.weight) || sortByOwner(a.owner, b.owner, order),
) {
  return [...buttonComponents]
    .filter((b) => b[locationSymbol] === location)
    .sort(compareFn)
    .map((b) => b.action);
}

/**
 * Possible render positions of buttons in navbar from left to right
 * @enum {number}
 * @property {number} MAP - map buttons (2D, 3D, oblique)
 * @property {number} CONTENT - content buttons (tree, category component view)
 * @property {number} TOOL - tool buttons (toolbox, legend)
 * @property {number} PROJECT - project buttons (project selector)
 * @property {number} SHARE - share buttons rendered in dropdown menu (create link, print)
 * @property {number} MENU - menu buttons rendered in dropdown menu (settings)
 */
export const ButtonLocation = {
  MAP: 0,
  CONTENT: 1,
  TOOL: 2,
  PROJECT: 3,
  SHARE: 4,
  MENU: 5,
};

/**
 * @typedef {import("../vcsUiApp.js").VcsComponentManager<import("./buttonManager.js").ButtonComponent,import("./buttonManager.js").ButtonComponentOptions>} INavbarManager
 */

/**
 * @typedef {Object} DeviceOptions
 * @property {boolean?} desktop
 * @property {boolean?} tablet
 * @property {boolean?} mobile
 */

/**
 * @class NavbarManager
 * @description Manages a set of Map Buttons in the Navbar
 * @implements {INavbarManager}
 */
class NavbarManager extends ButtonManager {
  /**
   * adds a buttonComponent
   * @param {import("./buttonManager.js").ButtonComponentOptions} buttonComponentOptions
   * @param {string|symbol} owner pluginName or vcsAppSymbol
   * @param {ButtonLocation} location Button render position
   * @param {DeviceOptions} [device={destop: true, tablet: true}] Device - optional device configuration
   * @throws {Error} if a buttonComponent with the same ID has already been added
   * @returns {import("./buttonManager.js").ButtonComponent}
   */
  add(
    buttonComponentOptions,
    owner,
    location,
    device = { desktop: true, tablet: true },
  ) {
    check(location, ofEnum(ButtonLocation));
    check(device, {
      desktop: optional(Boolean),
      tablet: optional(Boolean),
      mobile: optional(Boolean),
    });
    const buttonComponent = super.add(buttonComponentOptions, owner);
    buttonComponent[locationSymbol] = location;
    buttonComponent[deviceSymbol] = device;
    return buttonComponent;
  }

  /**
   * Toggles a button of provided id by executing its callback.
   * Use active flag to force a state to be applied.
   * @param {string} id
   * @param {boolean} [active]
   */
  toggle(id, active) {
    check(id, String);
    if (this.has(id)) {
      const { action } = this.get(id);
      if (action.disabled) {
        return;
      }

      if (active != null) {
        const isActionActive = action.active && !action.background;
        if (isActionActive !== active) {
          action.callback();
        }
      } else {
        action.callback();
      }
    }
  }
}

export default NavbarManager;
