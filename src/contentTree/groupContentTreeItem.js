import { watch } from 'vue';
import { parseBoolean } from '@vcsuite/parsers';
import ContentTreeItem, {
  contentTreeClassRegistry,
} from './contentTreeItem.js';
import { StateActionState } from '../actions/stateRefAction.js';

/**
 * @typedef {import("./contentTreeItem.js").ContentTreeItemOptions & { disableIfChildrenDisabled?: boolean }} GroupContentTreeItemOptions
 * @property {boolean} [disableIfChildrenDisabled=false] - optional flag to disable the contentTreeItem if all children are disabled.
 */

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
   * @param {GroupContentTreeItemOptions} options
   * @param {import("@src/vcsUiApp.js").default} app
   */
  constructor(options, app) {
    super(options, app);

    /**
     * @type {boolean}
     * @private
     */
    this._disableIfChildrenDisabled = parseBoolean(
      options.disableIfChildrenDisabled,
      false,
    );

    /**
     * @type {function():void}
     * @private
     */
    this._childWatcher = watch(
      this._children,
      () => {
        const children = this._children.value;
        this.visible = children.some((c) => c.visible);

        if (this._disableIfChildrenDisabled) {
          this.disabled = children.every((c) => c.disabled);
        }
        if (
          children.every((c) => c.state === StateActionState.NONE || !c.visible)
        ) {
          this.state = StateActionState.NONE;
        } else {
          const childrenWithState = children.filter(
            (c) => c.visible && c.state !== StateActionState.NONE,
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
      { deep: true, immediate: true },
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
      .filter((c) => c.visible && !c.disabled && statePredicate(c.state))
      .map((c) => c.clicked());
    await Promise.all(promises);
  }

  /**
   * @returns {GroupContentTreeItemOptions}
   */
  toJSON() {
    const config = super.toJSON();
    if (this._disableIfChildrenDisabled) {
      config.disableIfChildrenDisabled = this._disableIfChildrenDisabled;
    }
    return config;
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
