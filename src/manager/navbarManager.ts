import { check, ofEnum, optional } from '@vcsuite/check';
import type {
  ButtonComponent,
  ButtonComponentOptions,
} from './buttonManager.js';
import ButtonManager, { sortByWeight } from './buttonManager.js';
import { vcsAppSymbol } from '../pluginHelper.js';
import type { VcsAction } from '../actions/actionHelper.js';
import { callSafeAction } from '../actions/actionHelper.js';

export const locationSymbol = Symbol('location');
export const deviceSymbol = Symbol('device');

/**
 * sorts by owner and optionally plugin order
 * @param order order of owners to sort by
 */
export function sortByOwner(
  ownerA: string | symbol,
  ownerB: string | symbol,
  order: string[] = [],
): number {
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
 * @param location Button render position
 * @param order optional order to sort by (plugin names)
 * @param compareFn Per default components are sorted by weight (highest first) and owner (app first, then plugins)
 */
export function getActionsByLocation(
  buttonComponents: NavbarButtonComponent[],
  location: ButtonLocation,
  order: string[] = [],
  compareFn: (a: NavbarButtonComponent, b: NavbarButtonComponent) => number = (
    a,
    b,
  ) => sortByWeight(a.weight, b.weight) || sortByOwner(a.owner, b.owner, order),
): VcsAction[] {
  return [...buttonComponents]
    .filter((b) => b[locationSymbol] === location)
    .sort(compareFn)
    .map((b) => b.action);
}

/**
 * Possible render positions of buttons in navbar from left to right
 */
export enum ButtonLocation {
  /** map buttons (2D, 3D, oblique) */
  MAP = 0,
  /** content buttons (tree, category component view) */
  CONTENT = 1,
  /** tool buttons (toolbox, legend) */
  TOOL = 2,
  /** project buttons (project selector) */
  PROJECT = 3,
  /** share buttons rendered in dropdown menu (create link, print) */
  SHARE = 4,
  /** menu buttons rendered in dropdown menu (settings) */
  MENU = 5,
}

export type Device = 'desktop' | 'tablet' | 'mobile';

export type DeviceOptions = Partial<Record<Device, boolean>>;

export type NavbarButtonComponent = ButtonComponent & {
  [locationSymbol]: ButtonLocation;
  [deviceSymbol]: DeviceOptions;
};

/**
 * @class NavbarManager
 * @description Manages a set of Map Buttons in the Navbar
 */
class NavbarManager extends ButtonManager {
  /**
   * adds a buttonComponent
   * @param owner pluginName or vcsAppSymbol
   * @param location Button render position
   * @param device Device - optional device configuration
   * @throws {Error} if a buttonComponent with the same ID has already been added
   */
  add(
    buttonComponentOptions: ButtonComponentOptions,
    owner: string | symbol,
    location: ButtonLocation = ButtonLocation.TOOL,
    device: DeviceOptions = { desktop: true, tablet: true },
  ): NavbarButtonComponent {
    check(location, ofEnum(ButtonLocation));
    check(device, {
      desktop: optional(Boolean),
      tablet: optional(Boolean),
      mobile: optional(Boolean),
    });
    const buttonComponent = super.add(
      buttonComponentOptions,
      owner,
    ) as NavbarButtonComponent;
    buttonComponent[locationSymbol] = location;
    buttonComponent[deviceSymbol] = device;
    return buttonComponent;
  }

  get(id: string): NavbarButtonComponent | undefined {
    return super.get(id) as NavbarButtonComponent | undefined;
  }

  /**
   * Toggles a button of provided id by executing its callback.
   * Use active flag to force a state to be applied.
   */
  toggle(id: string, active?: boolean): void {
    check(id, String);
    if (this.has(id)) {
      const { action } = this.get(id)!;
      if (action.disabled) {
        return;
      }

      if (active != null) {
        const isActionActive = action.active && !action.background;
        if (isActionActive !== active) {
          callSafeAction(action);
        }
      } else {
        callSafeAction(action);
      }
    }
  }
}

export default NavbarManager;
