import type { VcsAction } from '../../actions/actionHelper.js';

export type VcsTreeNodeItem = {
  name: string;
  /** An optional translatable title. */
  title?: string;
  tooltip?: string;
  /** Whether this item reacts to click events. */
  clickable?: boolean;
  /** Whether this item should be displayed as disabled. */
  disabled?: boolean;
  /** An array of actions associated with this item. */
  actions?: ReadonlyArray<Readonly<VcsAction>>;
  /** An array of child items. */
  children?: VcsTreeNodeItem[];
  /** An optional icon for the item. Can be a string, HTMLCanvasElement, or HTMLImageElement. */
  icon?: string | HTMLCanvasElement | HTMLImageElement;
  /** A callback called when the item is clicked. */
  clicked?: (event: PointerEvent) => void | Promise<void>;
  /** Forwards the blockOverflow setting to the ActionButtonList, if true will reserve some space for an overflow. */
  blockOverflow?: boolean;
  /** Forces the item to display as a node (with chevron) even when it has no children. */
  forceNodeDisplay?: boolean;
};
