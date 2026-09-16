import { type Ref, computed, reactive, ref, shallowRef } from 'vue';
import { check, maybe, ofEnum, oneOf } from '@vcsuite/check';
import { parseBoolean, parseNumber } from '@vcsuite/parsers';
import { ClassRegistry, VcsEvent } from '@vcmap/core';
import type VcsUiApp from '../vcsUiApp.js';
import {
  type VcsCallbackOptions,
  executeCallbacks,
} from '../callback/vcsCallback.js';
import {
  type VcsAction,
  actionWeightSymbol,
  createLinkAction,
} from '../actions/actionHelper.js';
import {
  createStateRefAction,
  StateActionState,
} from '../actions/stateRefAction.js';

export const subTreeSymbol = Symbol('SubTree');
export const subTreeItemWeight = Symbol('SubTreeItemWeight');
export const subTreeOpenStateSymbol = Symbol('SubTreeOpenState');

type WeightedAction = VcsAction & { [actionWeightSymbol]?: number };

export type ContentTreeItemOptions = {
  type?: string;
  /** name of the item defining the structure within the tree using dot notation. */
  name: string;
  /** may be unset, if set from object properties later on. required otherwise */
  title?: string;
  /** may be unset or set from object properties later on. */
  tooltip?: string;
  /** an icon URL or element to display. */
  icon?: string;
  /** optional weighting of the item. higher weights come first. */
  weight?: number;
  /** optional info url providing link with additional information. */
  infoUrl?: string;
  /** groups being initially open or not. * @defaultValue false
   */
  initOpen?: boolean;
  /** optional callback actions executed on click */
  onClick?: VcsCallbackOptions[];
  /** optional callback actions executed on activation of the item */
  onActivate?: VcsCallbackOptions[];
  /** optional callback actions executed on deactivation of the item */
  onDeactivate?: VcsCallbackOptions[];
};

/** A readonly rendering interface of a ContentTreeItem. */
export type TreeViewItem = {
  readonly name: string;
  /** Whether to display this item or not. */
  readonly visible: boolean;
  /** Whether this item reacts to click events, e.g. with visual feedback */
  readonly clickable: boolean;
  /** Whether this item should be displayed as disabled. */
  readonly disabled: boolean;
  /** The state of this item. NONE if this item cannot have a state. */
  readonly state: StateActionState;
  /** The title to be displayed */
  readonly title: string;
  readonly tooltip?: string;
  /** An optional icon to display with this item. Can be an URL or HTMLElement. */
  readonly icon?: string;
  readonly actions: ReadonlyArray<Readonly<VcsAction>>;
  readonly children: TreeViewItem[];
  /** computed property */
  readonly visibleChildren?: TreeViewItem[];
  /** A callback called once the item is clicked. */
  readonly clicked: (event?: PointerEvent) => Promise<void>;
  [subTreeSymbol]?: boolean;
  [subTreeItemWeight]?: number;
  [subTreeOpenStateSymbol]?: string[];
};

export const contentTreeClassRegistry = new ClassRegistry<
  typeof ContentTreeItem
>();

class ContentTreeItem {
  static get className(): string {
    return 'ContentTreeItem';
  }

  protected _app: VcsUiApp;
  private _actions = shallowRef<Array<VcsAction>>([]);
  private _name: string;
  private _visible = ref(true);
  /** Whether this item reacts to click events, e.g. with visual feedback */
  private _clickable = ref(true);
  private _disabled = ref(false);
  /** The state of this item. NONE if this item cannot have a state. */
  private _state = ref(StateActionState.NONE);
  private _stateActionListener: (() => void) | null = null;
  private _infoUrl: string | null = null;
  private _title = ref<string | undefined>();
  private _tooltip = ref<string | undefined>();
  /** An optional icon to display with this item. Can be an URL or HTMLElement. */
  private _icon = ref<string | undefined>();
  protected _children: Ref<TreeViewItem[]> = ref([]);
  private _weight: number;
  initOpen: boolean;
  protected _onClick: VcsCallbackOptions[];
  protected _onActivate: VcsCallbackOptions[];
  protected _onDeactivate: VcsCallbackOptions[];
  weightChanged = new VcsEvent<number>();

  constructor(options: ContentTreeItemOptions, app: VcsUiApp) {
    this._app = app;

    this._name = options.name; // XXX ensure name is a string here?
    if (options.infoUrl) {
      this.infoUrl = options.infoUrl;
    }
    this._title = ref(options.title);
    this._tooltip = ref(options.tooltip);
    this._icon = ref(options.icon);
    this._weight = parseNumber(options.weight, 0);
    this.initOpen = parseBoolean(options.initOpen, false);
    this._onClick = options.onClick ?? [];
    this._onActivate = options.onActivate ?? [];
    this._onDeactivate = options.onDeactivate ?? [];
  }

  get className(): string {
    return (this.constructor as typeof ContentTreeItem).className;
  }

  get name(): string {
    return this._name;
  }

  /** A slice of the underlying actions array. Use add/removeAction to manipulate the actions array. */
  get actions(): VcsAction[] {
    return this._actions.value.slice();
  }

  get visible(): boolean {
    return this._visible.value;
  }

  set visible(visible: boolean) {
    this._visible.value = visible;
  }

  get clickable(): boolean {
    return this._clickable.value;
  }

  set clickable(clickable: boolean) {
    this._clickable.value = clickable;
  }

  get disabled(): boolean {
    return this._disabled.value;
  }

  set disabled(disabled: boolean) {
    this._disabled.value = disabled;
  }

  get state(): StateActionState {
    return this._state.value;
  }

  set state(state: StateActionState) {
    check(state, ofEnum(StateActionState));

    if (this._state.value !== state) {
      this._state.value = state;
      this._setStateAction();
    }
  }

  get infoUrl(): string | null {
    return this._infoUrl;
  }

  set infoUrl(url: string | null) {
    check(url, maybe(String));

    if (this._infoUrl !== url) {
      this._infoUrl = url;
      const name = 'infoUrl';
      if (this._infoUrl) {
        const action = createLinkAction(
          {
            name,
            title: 'content.infoAction.title',
            icon: '$vcsInfo',
          },
          this._infoUrl,
        );
        this.addAction(action, 6);
      } else {
        this.removeAction(name);
      }
    }
  }

  get title(): string | undefined {
    return this._title.value;
  }

  set title(title: string | undefined) {
    check(title, maybe(String));

    this._title.value = title;
  }

  get tooltip(): string | undefined {
    return this._tooltip.value;
  }

  set tooltip(tooltip: string | undefined) {
    check(tooltip, maybe(String));

    this._tooltip.value = tooltip;
  }

  get icon(): string | undefined {
    return this._icon.value;
  }

  set icon(icon: string | undefined) {
    check(icon, maybe(oneOf(String, HTMLElement)));

    this._icon.value = icon;
  }

  get weight(): number {
    return this._weight;
  }

  set weight(weight: number) {
    check(weight, Number);
    if (weight !== this._weight) {
      this._weight = weight;
      this.weightChanged.raiseEvent(weight);
    }
  }

  private _setStateAction(): void {
    const name = 'stateAction';
    if (this.state !== StateActionState.NONE && !this._stateActionListener) {
      const { action, destroy } = createStateRefAction(name, this._state, () =>
        this.clicked.bind(this),
      );
      this.addAction(action, 0);
      this._stateActionListener = (): void => {
        this.removeAction(name);
        destroy();
      };
    } else if (
      this._stateActionListener &&
      this.state === StateActionState.NONE
    ) {
      this._stateActionListener();
      this._stateActionListener = null;
    }
  }

  private _getActionIndex(actionName: string): number {
    return this._actions.value.findIndex((a) => a.name === actionName);
  }

  /**
   * Adds an action to this item. The predefined actions have the following weights:
   * StateAction: 0
   * GoToViewpoint: 2
   * StyleSelector: 4
   * InfoUrl: 6
   * GoToExtent: 8
   * The default weight is set to always push new actions past these.
   */
  addAction(action: WeightedAction, weight = 11): void {
    check(action.name, String);
    check(weight, maybe(Number));

    const index = this._getActionIndex(action.name);
    if (index > -1) {
      throw new Error('Action names must be unique');
    }
    action[actionWeightSymbol] = weight;
    const insertIndex = this._actions.value.findIndex(
      (a) => (a as WeightedAction)[actionWeightSymbol]! > weight,
    );
    if (insertIndex > -1) {
      const newActions = [...this._actions.value];
      newActions.splice(insertIndex, 0, action);
      this._actions.value = newActions;
    } else {
      this._actions.value = [...this._actions.value, action];
    }
  }

  removeAction(actionName: string): void {
    const index = this._getActionIndex(actionName);
    if (index > -1) {
      this._actions.value = this._actions.value.filter((_, i) => i !== index);
    }
  }

  /**
   * A callback called once the item is clicked.
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  async clicked(): Promise<void> {
    executeCallbacks(this._app, this._onClick);
  }

  /**
   * Returns a readonly TreeViewItem used for rendering the current item.
   */
  getTreeViewItem(): TreeViewItem {
    const clicked = this.clicked.bind(this);
    return reactive({
      name: this._name,
      visible: this._visible,
      clickable: this._clickable,
      disabled: this._disabled,
      state: this._state,
      title: this._title.value!,
      tooltip: this._tooltip,
      icon: this._icon,
      actions: this._actions,
      children: this._children,
      visibleChildren: computed(() => {
        const visibleChildren = this._children.value.filter((c) => c.visible);
        return visibleChildren.length > 0 ? visibleChildren : undefined;
      }),
      clicked,
    });
  }

  toJSON(): ContentTreeItemOptions {
    const config: ContentTreeItemOptions = {
      type: this.className,
      name: this.name,
    };

    if (this.title) {
      config.title = this.title;
    }
    if (this.tooltip) {
      config.tooltip = this.tooltip;
    }
    if (this.icon) {
      config.icon = this.icon;
    }
    if (this.infoUrl) {
      config.infoUrl = this.infoUrl;
    }
    if (this.initOpen) {
      config.initOpen = this.initOpen;
    }
    if (this.weight) {
      config.weight = this.weight;
    }
    if (this._onClick.length > 0) {
      config.onClick = this._onClick;
    }
    if (this._onActivate.length > 0) {
      config.onActivate = this._onActivate;
    }
    if (this._onDeactivate.length > 0) {
      config.onDeactivate = this._onDeactivate;
    }
    return config;
  }

  /**
   * Destroys this item and all its actions
   */
  destroy(): void {
    if (this._stateActionListener) {
      this._stateActionListener();
    }
    this.actions.splice(0);
    this._children.value.splice(0);
  }
}

contentTreeClassRegistry.registerClass(
  ContentTreeItem.className,
  ContentTreeItem,
);
export default ContentTreeItem;
