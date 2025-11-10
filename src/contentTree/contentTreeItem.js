import { ref, reactive, computed, shallowRef } from 'vue';
import { check, maybe, ofEnum, oneOf } from '@vcsuite/check';
import { parseBoolean, parseNumber } from '@vcsuite/parsers';
import { ClassRegistry, VcsEvent } from '@vcmap/core';
import { createLinkAction } from '../actions/actionHelper.js';
import {
  createStateRefAction,
  StateActionState,
} from '../actions/stateRefAction.js';
import { executeCallbacks } from '../callback/vcsCallback.js';

/**
 * @typedef {Object} ContentTreeItemOptions
 * @property {string} [type]
 * @property {string} name - name of the item defining the structure within the tree using dot notation.
 * @property {string} [title] - may be unset, if set from object properties later on. required otherwise
 * @property {string} [tooltip] - may be unset or set from object properties later on.
 * @property {string|HTMLCanvasElement|HTMLImageElement|undefined} [icon] - an icon URL or element to display.
 * @property {number} [weight] - optional weighting of the item. higher weights come first.
 * @property {string} [infoUrl] - optional info url providing link with additional information.
 * @property {boolean} [initOpen=false] - groups being initially open or not.
 * @property {import("../callback/vcsCallback.js").VcsCallbackOptions} [onClick] - optional callback actions executed on click
 * @property {import("../callback/vcsCallback.js").VcsCallbackOptions} [onActivate] - optional callback actions executed on activation of the item
 * @property {import("../callback/vcsCallback.js").VcsCallbackOptions} [onDeactivate] - optional callback actions executed on deactivation of the item
 */

/**
 * A readonly rendering interface of a ContentTreeItem.
 * @typedef {Object} TreeViewItem
 * @property {string} name
 * @property {boolean} visible - Whether to display this item or not.
 * @property {boolean} clickable - Whether this item reacts to click events, e.g. with visual feedback
 * @property {boolean} disabled - Whether this item should be displayed as disabled.
 * @property {StateActionState} state - The state of this item. NONE if this item cannot have a state.
 * @property {string} title - The title to be displayed
 * @property {string} [tooltip]
 * @property {string|HTMLCanvasElement|HTMLImageElement|undefined} [icon] - An optional icon to display with this item. Can be an URL or HTMLElement.
 * @property {Array<import("../actions/actionHelper.js").VcsAction>} actions
 * @property {Array<TreeViewItem>} children
 * @property {Array<TreeViewItem>} [visibleChildren] - computed property
 * @property {function(PointerEvent):Promise<void>} clicked - A callback called once the item is clicked.
 */

/**
 * @type {symbol}
 */
const actionWeightSymbol = Symbol('ActionWeight');

/**
 * @type {ClassRegistry<typeof ContentTreeItem>}
 */
export const contentTreeClassRegistry = new ClassRegistry();

/**
 * @class
 * @abstract
 */
class ContentTreeItem {
  /**
   * @type {string}
   */
  static get className() {
    return 'ContentTreeItem';
  }

  /**
   * @param {ContentTreeItemOptions} options
   * @param {import("../vcsUiApp.js").default} app
   */
  constructor(options, app) {
    /**
     * @protected
     * @type {import("../vcsUiApp.js").default}
     */
    this._app = app;

    /**
     * @type {import("vue").ShallowRef<Array<import("../actions/actionHelper.js").VcsAction>>}
     * @private
     */
    this._actions = shallowRef([]);

    /**
     * @type {string}
     * @private
     */
    this._name = options.name; // XXX ensure name is a string here?

    /**
     * Whether to display this item or not.
     * @type {import("vue").Ref<boolean>}
     * @private
     */
    this._visible = ref(true);

    /**
     * Whether this item reacts to click events, e.g. with visual feedback
     * @type {import("vue").Ref<boolean>}
     * @private
     */
    this._clickable = ref(true);

    /**
     * Whether this item should be displayed as disabled.
     * @type {import("vue").Ref<boolean>}
     * @private
     */
    this._disabled = ref(false);

    /**
     * The state of this item. NONE if this item cannot have a state.
     * @type {import("vue").Ref<StateActionState>}
     * @private
     */
    this._state = ref(StateActionState.NONE);

    /**
     * @type {function():void|null}
     * @private
     */
    this._stateActionListener = null;

    /**
     * @type {string|null}
     * @private
     */
    this._infoUrl = null;
    this.infoUrl = options.infoUrl;

    /**
     * @type {import("vue").Ref<string|undefined>}
     * @private
     */
    this._title = ref(options.title);

    /**
     * @type {import("vue").Ref<string|undefined>}
     * @private
     */
    this._tooltip = ref(options.tooltip);

    /**
     * An optional icon to display with this item. Can be an URL or HTMLElement.
     * @type {import("vue").Ref<string|HTMLCanvasElement|HTMLImageElement|undefined>}
     * @private
     */
    this._icon = ref(options.icon);

    /**
     * @type {import("vue").Ref<Array<TreeViewItem>>}
     * @protected
     */
    this._children = ref([]);

    /**
     * @type {number}
     * @private
     */
    this._weight = parseNumber(options.weight, 0);

    /**
     * @type {boolean}
     */
    this.initOpen = parseBoolean(options.initOpen, false);
    /**
     * @type {Array<import("../callback/vcsCallback.js").VcsCallbackOptions>}
     * @protected
     */
    this._onClick = options.onClick ?? [];
    /**
     * @type {Array<import("../callback/vcsCallback.js").VcsCallbackOptions>}
     * @protected
     */
    this._onActivate = options.onActivate ?? [];
    /**
     * @type {Array<import("../callback/vcsCallback.js").VcsCallbackOptions>}
     * @protected
     */
    this._onDeactivate = options.onDeactivate ?? [];
    /**
     * @type {VcsEvent<number>}
     */
    this.weightChanged = new VcsEvent();
  }

  /**
   * @type {string}
   */
  get className() {
    return this.constructor.className;
  }

  /**
   * @type {string}
   */
  get name() {
    return this._name;
  }

  /**
   * A slice of the underlying actions array. Use add/removeAction to manipulate the actions array.
   * @type {Array<import("../actions/actionHelper.js").VcsAction>}
   */
  get actions() {
    return this._actions.value.slice();
  }

  /**
   * @type {boolean}
   */
  get visible() {
    return this._visible.value;
  }

  /**
   * @param {boolean} visible
   */
  set visible(visible) {
    this._visible.value = !!visible;
  }

  /**
   * @type {boolean}
   */
  get clickable() {
    return this._clickable.value;
  }

  /**
   * @param {boolean} clickable
   */
  set clickable(clickable) {
    this._clickable.value = !!clickable;
  }

  /**
   * @type {boolean}
   */
  get disabled() {
    return this._disabled.value;
  }

  /**
   * @param {boolean} disabled
   */
  set disabled(disabled) {
    this._disabled.value = !!disabled;
  }

  /**
   * @type {StateActionState}
   */
  get state() {
    return this._state.value;
  }

  /**
   * @param {StateActionState} state
   */
  set state(state) {
    check(state, ofEnum(StateActionState));

    if (this._state.value !== state) {
      this._state.value = state;
      this._setStateAction();
    }
  }

  /**
   * @type {string|null}
   */
  get infoUrl() {
    return this._infoUrl;
  }

  /**
   * @param {string} url
   */
  set infoUrl(url) {
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

  /**
   * @type {string|undefined}
   */
  get title() {
    return this._title.value;
  }

  /**
   * @param {string|undefined} title
   */
  set title(title) {
    check(title, maybe(String));

    this._title.value = title;
  }

  /**
   * @type {string|undefined}
   */
  get tooltip() {
    return this._tooltip.value;
  }

  /**
   * @param {string|undefined} tooltip
   */
  set tooltip(tooltip) {
    check(tooltip, maybe(String));

    this._tooltip.value = tooltip;
  }

  /**
   * @type {string|HTMLCanvasElement|HTMLImageElement|undefined}
   */
  get icon() {
    return this._icon.value;
  }

  /**
   * @param {(string|HTMLCanvasElement|HTMLImageElement)=} icon
   */
  set icon(icon) {
    check(icon, maybe(oneOf(String, HTMLElement)));

    this._icon.value = icon;
  }

  /**
   * @type {number}
   */
  get weight() {
    return this._weight;
  }

  /**
   * @param {number} weight
   */
  set weight(weight) {
    check(weight, Number);
    if (weight !== this._weight) {
      this._weight = weight;
      this.weightChanged.raiseEvent(weight);
    }
  }

  /**
   * @private
   */
  _setStateAction() {
    const name = 'stateAction';
    if (this.state !== StateActionState.NONE && !this._stateActionListener) {
      const { action, destroy } = createStateRefAction(
        name,
        this._state,
        this.clicked.bind(this),
      );
      this.addAction(action, 0);
      this._stateActionListener = () => {
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

  /**
   * @param {string} actionName
   * @returns {number}
   * @private
   */
  _getActionIndex(actionName) {
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
   * @param {import("../actions/actionHelper.js").VcsAction} action
   * @param {number} [weight=11]
   */
  addAction(action, weight = 11) {
    check(action.name, String);
    check(weight, maybe(Number));

    const index = this._getActionIndex(action.name);
    if (index > -1) {
      throw new Error('Action names must be unique');
    }
    action[actionWeightSymbol] = weight;
    const insertIndex = this._actions.value.findIndex(
      (a) => a[actionWeightSymbol] > weight,
    );
    if (insertIndex > -1) {
      const newActions = [...this._actions.value];
      newActions.splice(insertIndex, 0, action);
      this._actions.value = newActions;
    } else {
      this._actions.value = [...this._actions.value, action];
    }
  }

  /**
   * @param {string} actionName
   */
  removeAction(actionName) {
    const index = this._getActionIndex(actionName);
    if (index > -1) {
      this._actions.value = this._actions.value.filter((_, i) => i !== index);
    }
  }

  /**
   * A callback called once the item is clicked.
   * @returns {Promise<void>}
   */
  async clicked() {
    executeCallbacks(this._app, this._onClick);
  }

  /**
   * Returns a readonly TreeViewItem used for rendering the current item.
   * @returns {TreeViewItem}
   */
  getTreeViewItem() {
    const clicked = this.clicked.bind(this);
    return reactive({
      name: this._name,
      visible: this._visible,
      clickable: this._clickable,
      disabled: this._disabled,
      state: this._state,
      title: this._title,
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

  /**
   * @returns {ContentTreeItemOptions}
   */
  toJSON() {
    const config = {
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
  destroy() {
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
