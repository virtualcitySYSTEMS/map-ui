import { watch } from 'vue';
import { parseBoolean } from '@vcsuite/parsers';
import type VcsUiApp from '../vcsUiApp.js';
import ContentTreeItem, {
  type ContentTreeItemOptions,
  contentTreeClassRegistry,
} from './contentTreeItem.js';

type NodeContentTreeItemOptions = ContentTreeItemOptions & {
  /** optional flag to disable the contentTreeItem if all children are disabled. defaults to false */
  disableIfChildrenDisabled?: boolean;
};

/**
 * A group item which has _no click handler_
 */
class NodeContentTreeItem extends ContentTreeItem {
  static get className(): string {
    return 'NodeContentTreeItem';
  }

  private _disableIfChildrenDisabled: boolean;
  private _childWatcher: () => void;

  constructor(options: NodeContentTreeItemOptions, app: VcsUiApp) {
    super(options, app);
    this.clickable = false;

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
      },
      { deep: true, immediate: true },
    );
  }

  toJSON(): NodeContentTreeItemOptions {
    const config = super.toJSON() as NodeContentTreeItemOptions;
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

export default NodeContentTreeItem;
contentTreeClassRegistry.registerClass(
  NodeContentTreeItem.className,
  NodeContentTreeItem,
);
