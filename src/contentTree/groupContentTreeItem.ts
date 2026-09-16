import { watch } from 'vue';
import { parseBoolean } from '@vcsuite/parsers';
import type VcsUiApp from '../vcsUiApp.js';
import ContentTreeItem, {
  type ContentTreeItemOptions,
  contentTreeClassRegistry,
} from './contentTreeItem.js';
import { StateActionState } from '../actions/stateRefAction.js';

type GroupContentTreeItemOptions = ContentTreeItemOptions & {
  /** optional flag to disable the contentTreeItem if all children are disabled. defaults to false */
  disableIfChildrenDisabled?: boolean;
};

/**
 * A clickable group item. When clicked, every child with a state not NONE will also be clicked.
 */
class GroupContentTreeItem extends ContentTreeItem {
  static get className(): string {
    return 'GroupContentTreeItem';
  }

  private _disableIfChildrenDisabled: boolean;
  private _childWatcher: () => void;
  constructor(options: GroupContentTreeItemOptions, app: VcsUiApp) {
    super(options, app);

    this._disableIfChildrenDisabled = parseBoolean(
      options.disableIfChildrenDisabled,
      false,
    );
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

  async clicked(): Promise<void> {
    await super.clicked();
    if (this.state === StateActionState.NONE) {
      return;
    }

    const statePredicate: (state: StateActionState) => boolean =
      this.state === StateActionState.ACTIVE
        ? (state: StateActionState): boolean => state !== StateActionState.NONE
        : (state: StateActionState): boolean =>
            state !== StateActionState.NONE &&
            state !== StateActionState.ACTIVE;

    const promises = this._children.value
      .filter((c) => c.visible && !c.disabled && statePredicate(c.state))
      .map((c) => c.clicked());
    await Promise.all(promises);
  }

  toJSON(): GroupContentTreeItemOptions {
    const config = super.toJSON() as GroupContentTreeItemOptions;
    if (this._disableIfChildrenDisabled) {
      config.disableIfChildrenDisabled = this._disableIfChildrenDisabled;
    }
    return config;
  }

  destroy(): void {
    this._childWatcher();
    super.destroy();
  }
}

export default GroupContentTreeItem;
contentTreeClassRegistry.registerClass(
  GroupContentTreeItem.className,
  GroupContentTreeItem,
);
