import { check } from '@vcsuite/check';
import ButtonManager from './buttonManager.js';
import { vcsAppSymbol } from '../pluginHelper.js';

export const locationSymbol = Symbol('location');

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
 * @param {Array<ButtonComponent>} buttonComponents
 * @param {ButtonLocation} location Button render position
 * @param {string[]} [order] optional order to sort by (plugin names)
 * @param {function(ownerA:string, ownerB:string, order: string[]):number} [compareFn=sortByOwner] Per default components are sorted by owner: app first, then plugins
 * @returns {Array<VcsAction>}
 */
export function getActionsByLocation(buttonComponents, location, order = [], compareFn = sortByOwner) {
  return [...buttonComponents]
    .filter(b => b[locationSymbol] === location)
    .sort((a, b) => compareFn(a.owner, b.owner, order))
    .map(b => b.action);
}

/**
 * Possible render positions of buttons in navbar from left to right
 * @enum
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
 * @class NavbarManager
 * @description Manages a set of Map Buttons in the Navbar
 * @implements VcsComponentManager<ButtonComponent,ButtonComponentOptions>
 */
export class NavbarManager extends ButtonManager {
  /**
   * adds a buttonComponent
   * @param {ButtonComponentOptions} buttonComponentOptions
   * @param {string|symbol} owner pluginName or vcsAppSymbol
   * @param {ButtonLocation} location Button render position
   * @throws {Error} if a buttonComponent with the same ID has already been added
   * @returns {ButtonComponent}
   */
  add(buttonComponentOptions, owner, location) {
    check(location, Object.values(ButtonLocation));
    const buttonComponent = super.add(buttonComponentOptions, owner);
    buttonComponent[locationSymbol] = location;
    return buttonComponent;
  }
}
