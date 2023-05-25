import { watch } from 'vue';
import ContentTreeItem, {
  contentTreeClassRegistry,
} from './contentTreeItem.js';
import { StateActionState } from '../actions/stateRefAction.js';

/**
 * A clickable group item. When clicked, every child with a state not NONE will also be clicked.
 * @class
 * @extends {ContentTreeItem}
 */
class GroupContentTreeItem extends ContentTreeItem {
  /**
   * @returns {string}
   */
  static get className() {
    return 'GroupContentTreeItem';
  }

  /**
   * @param {ContentTreeItemOptions} options
   * @param {VcsUiApp} app
   */
  constructor(options, app) {
    super(options, app);

    /**
     * @type {function():void}
     * @private
     */
    this._childWatcher = watch(
      this._children,
      () => {
        const children = this._children.value;
        this.visible = children.some((c) => c.visible);
        if (children.every((c) => c.state === StateActionState.NONE)) {
          this.state = StateActionState.NONE;
        } else {
          const childrenWithState = children.filter(
            (c) => c.state !== StateActionState.NONE,
          );
          if (
            childrenWithState.every((c) => c.state === StateActionState.ACTIVE)
          ) {
            this.state = StateActionState.ACTIVE;
          } else if (
            childrenWithState.every(
              (c) => c.state === StateActionState.INACTIVE,
            )
          ) {
            this.state = StateActionState.INACTIVE;
          } else {
            this.state = StateActionState.INDETERMINATE;
          }
        }
      },
      { deep: true },
    );
  }

  async clicked() {
    await super.clicked();
    if (this.state === StateActionState.NONE) {
      return;
    }

    const statePredicate =
      this.state === StateActionState.ACTIVE
        ? (state) => state !== StateActionState.NONE
        : (state) =>
            state !== StateActionState.NONE &&
            state !== StateActionState.ACTIVE;

    const promises = this._children.value
      .filter((c) => c.visible && statePredicate(c.state))
      .map((c) => c.clicked());
    await Promise.all(promises);
  }

  destroy() {
    this._childWatcher();
    super.destroy();
  }
}

export default GroupContentTreeItem;
contentTreeClassRegistry.registerClass(
  GroupContentTreeItem.className,
  GroupContentTreeItem,
);
