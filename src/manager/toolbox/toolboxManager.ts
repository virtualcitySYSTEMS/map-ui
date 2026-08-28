import { VcsEvent } from '@vcmap/core';
import { check, maybe, ofEnum, oneOf, optional } from '@vcsuite/check';
import { v4 as uuidv4 } from 'uuid';
import type { Reactive } from 'vue';
import { reactive, ref, shallowReactive } from 'vue';
import type { VcsComponentManager } from '@src/vcsUiApp.js';
import { vcsAppSymbol } from '../../pluginHelper.js';
import ButtonManager from '../buttonManager.js';
import type { ButtonComponent } from '../buttonManager.js';
import { actionPattern } from '../../components/lists/VcsActionList.ts.vue';
import type { VcsAction } from '../../actions/actionHelper.js';
import { getActionFromOptions } from '../../actions/actionHelper.js';
import type { DeviceOptions } from '../navbarManager.js';
import { deviceSymbol } from '../navbarManager.js';

export enum ToolboxType {
  /** ToolboxComponent<ToolboxType.SINGLE> with single toggle action rendered as VcsButton */
  SINGLE = 0,
  /** ToolboxComponent<ToolboxType.SELECT> with one selected item of a list of items */
  SELECT = 1,
  /** ToolboxComponent<ToolboxType.GROUP> with multiple non-exclusive items rendered as VcsButton */
  GROUP = 2,
}

export type ToolboxComponentOptions<T extends ToolboxType = ToolboxType> = {
  /** Optional ID, If not provided an uuid will be generated. */
  id?: string;
  /** Group type, defining the behaviour of the group */
  type: ToolboxType;
  /** optional specific toolboxes to render this component in. */
  toolboxNames?: (string | symbol)[];
  icon?: string;
  title?: string;
  disabled?: boolean;
} & (T extends ToolboxType.SINGLE
  ? {
      type: ToolboxType.SINGLE;
      /** An action of a single tool */
      action: VcsAction;
    }
  : T extends ToolboxType.SELECT
    ? {
        type: ToolboxType.SELECT;
        /** An action determining the behaviour of the select group */
        action: ToolboxSelectAction;
      }
    : T extends ToolboxType.GROUP
      ? {
          type: ToolboxType.GROUP;
          /** Group icon */
          icon: string;
          /** Optional group title, for dropdown */
          title?: string;
          /** Optional disabled state */
          disabled?: boolean;
        }
      : never);

/** Base shape shared by all ToolboxComponent variants, before type specific properties are added */
type ToolboxComponentBase = {
  id: string;
  /** Group type, defining the behaviour of the group */
  type: ToolboxType;
  owner: string | typeof vcsAppSymbol;
  toolboxNames: (string | symbol)[];
  [deviceSymbol]: DeviceOptions;
};

export type ToolboxComponent<T extends ToolboxType = ToolboxType> =
  ToolboxComponentBase &
    (T extends ToolboxType.SINGLE
      ? {
          action: Reactive<VcsAction>;
        }
      : T extends ToolboxType.SELECT
        ? {
            action: Reactive<ToolboxSelectAction>;
          }
        : T extends ToolboxType.GROUP
          ? {
              icon: string;
              title?: string;
              buttonManager: ButtonManager;
              disabled?: boolean;
            }
          : never);

type ToolboxSelectAction = VcsAction & {
  /** A callback determining the select behavior of the group. Should set the currentIndex. */
  selected: (index: number) => void;
  /** A list of exclusive tools belonging to the group */
  tools: ToolboxSelectItem[];
  /** Index of the current item */
  currentIndex: number;
};

type ToolboxSelectItem = {
  name: string;
  title?: string;
  icon: string;
  disabled?: boolean;
};

/**
 * Default groups predefining icon and title of the group
 */
const defaultGroups: ToolboxComponentOptions<ToolboxType.GROUP>[] = [
  {
    id: 'flight',
    type: ToolboxType.GROUP,
    icon: '$vcsVideoRecorder',
    title: 'toolbox.flight',
  },
  {
    id: 'miscellaneous',
    type: ToolboxType.GROUP,
    icon: 'mdi-dots-grid',
    title: 'toolbox.miscellaneous',
  },
];

/**
 * Default order of toolboxComponents shown in the toolbox
 */
const defaultOrder = ['featureInfo', 'flight'];

/**
 * The default toolbox name
 */
export const defaultToolboxName = Symbol('defaultToolboxName');

function isSingleToolboxComponentOptions(
  toolboxComponentOptions: ToolboxComponentOptions,
): toolboxComponentOptions is ToolboxComponentOptions<ToolboxType.SINGLE> {
  return toolboxComponentOptions.type === ToolboxType.SINGLE;
}

function isSelectToolboxComponentOptions(
  toolboxComponentOptions: ToolboxComponentOptions,
): toolboxComponentOptions is ToolboxComponentOptions<ToolboxType.SELECT> {
  return toolboxComponentOptions.type === ToolboxType.SELECT;
}

function isGroupToolboxComponent(
  toolboxComponent: ToolboxComponent | undefined,
): toolboxComponent is ToolboxComponent<ToolboxType.GROUP> {
  return !!toolboxComponent && toolboxComponent.type === ToolboxType.GROUP;
}

/**
 * sorts by owner and optionally plugin order
 * If both components are owned by vcsApp, defaultOrder is used to compare
 */
function sortByOwner(
  compA: ToolboxComponent | ButtonComponent,
  compB: ToolboxComponent | ButtonComponent,
  order: string[] = [],
): number {
  const sorted = [vcsAppSymbol, ...order];
  let indexA = sorted.indexOf(compA.owner);
  let indexB = sorted.indexOf(compB.owner);

  if (compA.owner === vcsAppSymbol && compB.owner === vcsAppSymbol) {
    indexA = defaultOrder.indexOf(compA.id);
    indexB = defaultOrder.indexOf(compB.id);
  }
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
 * returns ToolboxComponents sorted by owner (or other sort function)
 * @param order optional order to sort by (plugin names)
 * @param compareFn Per default components are sorted by owner: app first, then plugins
 */
export function getComponentsByOrder<
  T extends ToolboxComponent | ButtonComponent,
>(
  components: Array<T>,
  order: string[] = [],
  compareFn: (compA: T, compB: T, order: string[]) => number = sortByOwner,
): Array<T> {
  return [...components].sort((a, b) => compareFn(a, b, order));
}

/**
 * Adds default groups for a toolboxManager.
 * Once requested, group id, icon and title are defined and cannot be changed or overwritten.
 */
export function setupDefaultGroups(
  toolboxManager: ToolboxManager,
  groups: ToolboxComponentOptions<ToolboxType.GROUP>[] = defaultGroups,
): void {
  groups.forEach((toolboxComponentOptions) =>
    toolboxManager.add(toolboxComponentOptions, vcsAppSymbol),
  );
}
type IToolboxManager = VcsComponentManager<
  ToolboxComponent,
  ToolboxComponentOptions
>;

/**
 * @description Manages a set of Toolbox Components
 */
class ToolboxManager implements IToolboxManager {
  added = new VcsEvent<ToolboxComponent>();
  removed = new VcsEvent<ToolboxComponent>();
  /** reactive ordered array of ids */
  componentIds = reactive<string[]>([]);
  open = ref(true);
  private _toolboxGroups = new Map<string, ToolboxComponent>();
  private _toolboxName: symbol | string = defaultToolboxName;
  toolboxNameChanged = new VcsEvent<string | symbol>();

  get toolboxName(): string | symbol {
    return this._toolboxName;
  }

  set toolboxName(name: string | symbol) {
    check(name, oneOf(String, defaultToolboxName));

    if (this._toolboxName !== name) {
      this._toolboxName = name;
      this.toolboxNameChanged.raiseEvent(name);
    }
  }

  setDefaultToolboxName(): void {
    this.toolboxName = defaultToolboxName;
  }

  get(id: string): ToolboxComponent | undefined {
    return this._toolboxGroups.get(id);
  }

  has(id: string): boolean {
    return this._toolboxGroups.has(id);
  }

  /**
   * removes a ToolboxComponent, Component will not be rendered anymore and will be destroyed.
   * Add ToolboxComponent again to show the component again
   */
  remove(id: string): void {
    check(id, String);
    const toolboxComponent = this._toolboxGroups.get(id);
    if (toolboxComponent) {
      const index = this.componentIds.indexOf(id);
      this.componentIds.splice(index, 1);
      this._toolboxGroups.delete(id);
      this.removed.raiseEvent(toolboxComponent);
      if (
        (toolboxComponent as ToolboxComponent<ToolboxType.GROUP>).buttonManager
      ) {
        (
          toolboxComponent as ToolboxComponent<ToolboxType.GROUP>
        ).buttonManager.destroy();
      }
    }
  }

  /**
   * adds a ToolboxComponent
   * @throws {Error} if a toolboxComponent with the same ID has already been added
   */
  add(
    toolboxComponentOptions: ToolboxComponentOptions,
    owner: string | typeof vcsAppSymbol,
    device = { desktop: true, tablet: true },
  ): ToolboxComponent {
    check(toolboxComponentOptions.id, maybe(String));
    check(toolboxComponentOptions.type, ofEnum(ToolboxType));
    check(device, {
      desktop: optional(Boolean),
      tablet: optional(Boolean),
      mobile: optional(Boolean),
    });
    check(owner, oneOf(String, vcsAppSymbol));

    if (toolboxComponentOptions.id && this.has(toolboxComponentOptions.id)) {
      throw new Error(
        `A toolGroup with id ${toolboxComponentOptions.id} has already been registered.`,
      );
    }
    const id = toolboxComponentOptions.id || uuidv4();
    const { type, toolboxNames: toolboxNamesOptions } = toolboxComponentOptions;

    const toolboxNames = toolboxNamesOptions
      ? [...toolboxNamesOptions]
      : [defaultToolboxName];

    let toolboxComponent: ToolboxComponentBase = {
      get id() {
        return id;
      },
      get type() {
        return type;
      },
      get owner() {
        return owner;
      },
      get toolboxNames() {
        return toolboxNames;
      },
      [deviceSymbol]: device,
    };

    if (isSingleToolboxComponentOptions(toolboxComponentOptions)) {
      check(toolboxComponentOptions.action, actionPattern);
      const action = getActionFromOptions(toolboxComponentOptions.action);

      toolboxComponent = {
        ...toolboxComponent,
        get action(): Reactive<VcsAction> {
          return reactive(action);
        },
      };
    } else if (isSelectToolboxComponentOptions(toolboxComponentOptions)) {
      check(toolboxComponentOptions.action, {
        name: String,
        title: optional(String),
        icon: optional(String),
        callback: Function,
        active: optional(Boolean),
        background: optional(Boolean),
        hasUpdate: optional(Boolean),
        selected: Function,
        currentIndex: Number,
        disabled: optional(Boolean),
        tools: [
          {
            name: String,
            title: optional(String),
            icon: String,
            disabled: optional(Boolean),
          },
        ],
      });
      const action = getActionFromOptions(
        toolboxComponentOptions.action,
      ) as ToolboxSelectAction;

      toolboxComponent = {
        ...toolboxComponent,
        get action(): Reactive<ToolboxSelectAction> {
          return reactive(action);
        },
      };
    } else {
      check(toolboxComponentOptions.icon, String);
      check(toolboxComponentOptions.title, maybe(String));
      check(toolboxComponentOptions.disabled, maybe(Boolean));
      const { icon, title, disabled = false } = toolboxComponentOptions;
      const buttonManager = new ButtonManager();

      toolboxComponent = shallowReactive({
        ...toolboxComponent,
        disabled,
        icon,
        title,
        get buttonManager() {
          return buttonManager;
        },
      });
    }

    this._toolboxGroups.set(
      toolboxComponent.id,
      toolboxComponent as ToolboxComponent,
    );
    this.componentIds.push(toolboxComponent.id);
    this.added.raiseEvent(toolboxComponent as ToolboxComponent);
    return toolboxComponent as ToolboxComponent;
  }

  /**
   * removes all {@link ToolboxComponent}s of a specific owner and fires removed Events
   */
  removeOwner(owner: string | typeof vcsAppSymbol): void {
    const componentIds = [...this.componentIds];
    componentIds.forEach((id) => {
      const toolboxComponent = this.get(id);
      if (isGroupToolboxComponent(toolboxComponent)) {
        toolboxComponent.buttonManager.removeOwner(owner);
      }
      if (toolboxComponent && owner === toolboxComponent.owner) {
        this.remove(id);
      }
    });
  }

  /**
   * removes all toolboxComponents and fires removed Events
   */
  clear(): void {
    const componentIds = [...this.componentIds];
    componentIds.forEach((id) => {
      this.remove(id);
    });
  }

  /**
   * destroys the ToolboxManager;
   */
  destroy(): void {
    this.added.destroy();
    this.removed.destroy();
    this.toolboxNameChanged.destroy();
    this.clear();
    this.componentIds.splice(0);
    this._toolboxGroups.clear();
  }
}

export default ToolboxManager;
