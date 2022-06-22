import { ref, reactive, computed } from '@vue/composition-api';
import { check, checkMaybe } from '@vcsuite/check';
import { parseBoolean, parseNumber } from '@vcsuite/parsers';
import { ClassRegistry, VcsEvent } from '@vcmap/core';
import { createLinkAction } from '../actions/actionHelper.js';
import { createStateRefAction, StateActionState } from '../actions/stateRefAction.js';

/**
 * @typedef {Object} ContentTreeItemOptions
 * @property {string} name
 * @property {Object<string, string>|string} [title] - may be unset, if set from object properties later on. required otherwise
 * @property {string|HTMLCanvasElement|HTMLImageElement|undefined} icon - an icon URL or element to display
 * @property {number} [weight]
 * @property {string} [infoUrl]
 * @property {boolean} [initOpen=false]
 */

/**
 * A readonly rendering interface of a ContentTreeItem.
 * @typedef {Object} TreeViewItem
 * @property {string} name
 * @property {boolean} visible
 * @property {boolean} clickable
 * @property {boolean} disabled
 * @property {StateActionState} state
 * @property {Object<string, string>|string} title
 * @property {string|HTMLCanvasElement|HTMLImageElement|undefined} icon
 * @property {Array<VcsAction>} actions
 * @property {Array<TreeViewItem>} children
 * @property {Array<TreeViewItem>} visibleChildren - computed property
 * @property {function():Promise<void>} clicked
 */

/**
 * @type {symbol}
 */
const actionWeightSymbol = Symbol('ActionWeight');

/**
 * @type {ClassRegistry<ContentTreeItem>}
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
  static get className() { return 'ContentTreeItem'; }

  /**
   * @param {ContentTreeItemOptions} options
   * @param {VcsUiApp} app
   */
  constructor(options, app) {
    /**
     * @protected
     * @type {VcsUiApp}
     */
    this._app = app;

    /**
     * @type {import("@vue/composition-api").Ref<Array<VcsAction>>}
     * @private
     */
    this._actions = ref([]);

    /**
     * @type {string}
     * @private
     */
    this._name = options.name; // XXX ensure name is a string here?

    /**
     * Whether to display this item or not.
     * @type {import("@vue/composition-api").Ref<boolean>}
     * @private
     */
    this._visible = ref(true);

    /**
     * Whether this item reacts to click events, e.g. with visual feedback
     * @type {import("@vue/composition-api").Ref<boolean>}
     * @private
     */
    this._clickable = ref(true);

    /**
     * Whether this item should be displayed as disabled.
     * @type {import("@vue/composition-api").Ref<boolean>}
     * @private
     */
    this._disabled = ref(false);

    /**
     * The state of this item. NONE if this item cannot have a state.
     * @type {import("@vue/composition-api").Ref<StateActionState>}
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
     * @type {import("@vue/composition-api").Ref<Object<string, string>|string|undefined>}
     * @private
     */
    this._title = ref(options.title);

    /**
     * An optional icon to display with this item. Can be an URL or HTMLElement.
     * @type {import("@vue/composition-api").Ref<string|HTMLCanvasElement|HTMLImageElement|undefined>}
     * @private
     */
    this._icon = ref(options.icon);

    /**
     * @type {import("@vue/composition-api").Ref<Array<TreeViewItem>>}
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
     * @type {VcsEvent<number>}
     */
    this.weightChanged = new VcsEvent();
  }

  /**
   * @readonly
   * @type {string}
   */
  get className() {
    return this.constructor.className;
  }

  /**
   * @type {string}
   * @readonly
   */
  get name() {
    return this._name;
  }

  /**
   * A slice of the underlying actions array. Use add/removeAction to manipulate the actions array.
   * @type {Array<VcsAction>}
   * @readonly
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
    check(state, Object.values(StateActionState));

    if (this._state.value !== state) {
      this._state.value = state;
      this._setStateAction();
    }
  }

  /**
   * @type {string|null}
   */
  get infoUrl() { return this._infoUrl; }

  /**
   * @param {string} url
   */
  set infoUrl(url) {
    checkMaybe(url, String);

    if (this._infoUrl !== url) {
      this._infoUrl = url;
      const name = 'infoUrl';
      if (this._infoUrl) {
        const action = createLinkAction({
          name,
          title: 'content.infoAction.title',
          icon: '$vcsInfo',
        }, this._infoUrl);
        this.addAction(action, 6);
      } else {
        this.removeAction(name);
      }
    }
  }

  /**
   * @type {string|Object<string>|undefined}
   */
  get title() {
    return this._title.value;
  }

  /**
   * @param {string|Object<string>|undefined} title
   */
  set title(title) {
    checkMaybe(title, [String, Object]);

    this._title.value = title;
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
    checkMaybe(icon, [String, HTMLElement]);

    this._icon.value = icon;
  }

  /**
   * @type {number}
   */
  get weight() { return this._weight; }

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
    } else if (this._stateActionListener && this.state === StateActionState.NONE) {
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
    return this._actions.value.findIndex(a => a.name === actionName);
  }

  /**
   * Adds an action to this item. The predefined actions have the following weights:
   * StateAction: 0
   * GoToViewpoint: 2
   * StyleSelector: 4
   * InfoUrl: 6
   * GoToExtent: 8
   * The default weight is set to always push new actions past these.
   * @param {VcsAction} action
   * @param {number} [weight=0]
   */
  addAction(action, weight = 11) {
    check(action.name, String);
    checkMaybe(weight, Number);

    const index = this._getActionIndex(action.name);
    if (index > -1) {
      throw new Error('Action names must be unique');
    }
    action[actionWeightSymbol] = weight;
    const insertIndex = this._actions.value.findIndex(a => a[actionWeightSymbol] > weight);
    if (insertIndex > -1) {
      this._actions.value.splice(insertIndex, 0, action);
    } else {
      this._actions.value.push(action);
    }
  }

  /**
   * @param {string} actionName
   */
  removeAction(actionName) {
    const index = this._getActionIndex(actionName);
    if (index > -1) {
      this._actions.value.splice(index, 1);
    }
  }

  /**
   * A callback called once the item is clicked.
   * @returns {Promise<void>}
   */
  // eslint-disable-next-line class-methods-use-this,no-empty-function
  async clicked() {}

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
      icon: this._icon,
      actions: this._actions,
      children: this._children,
      visibleChildren: computed(() => this._children.value.filter(c => c.visible)),
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

contentTreeClassRegistry.registerClass(ContentTreeItem.className, ContentTreeItem);
export default ContentTreeItem;
