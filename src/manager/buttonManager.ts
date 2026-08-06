import { reactive } from 'vue';
import { VcsEvent } from '@vcmap/core';
import { v4 as uuidv4 } from 'uuid';
import { check, maybe, oneOf } from '@vcsuite/check';
import { vcsAppSymbol } from '../pluginHelper.js';
import { actionPattern } from '../components/lists/VcsActionList.ts.vue';
import type { VcsAction } from '../actions/actionHelper.js';
import { getActionFromOptions } from '../actions/actionHelper.js';
import type { VcsComponentManager } from '../vcsUiApp.js';

export function sortByWeight(weightA = 0, weightB = 0): number {
  return weightB - weightA;
}

export type ButtonComponentOptions = {
  /** Optional ID, If not provided an uuid will be generated. */
  id?: string;
  /** Action performed by button. */
  action: VcsAction;
  /** Optional weight affecting the displaying order */
  weight?: number;
};

export type ButtonComponent = {
  id: string;
  owner: string | symbol;
  action: VcsAction;
  weight: number;
};

type IButtonManager = VcsComponentManager<
  ButtonComponent,
  ButtonComponentOptions
>;

/**
 * @class ButtonManager
 * @description Manages a set of Map Buttons
 * @implements {IButtonManager}
 */
class ButtonManager implements IButtonManager {
  added = new VcsEvent<ButtonComponent>();
  removed = new VcsEvent<ButtonComponent>();
  /** reactive ordered array of ids */
  componentIds = reactive<string[]>([]);
  private _buttonComponents = new Map<string, ButtonComponent>();

  get(id: string): ButtonComponent | undefined {
    return this._buttonComponents.get(id);
  }
  has(id: string): boolean {
    return this._buttonComponents.has(id);
  }

  /**
   * removes a button, Component will not be rendered anymore and will be destroyed. Add ButtonComponent again
   * to show the component again
   */
  remove(id: string): void {
    check(id, String);
    const buttonComponent = this._buttonComponents.get(id);
    if (buttonComponent) {
      const index = this.componentIds.indexOf(id);
      this.componentIds.splice(index, 1);
      this._buttonComponents.delete(id);
      this.removed.raiseEvent(buttonComponent);
    }
  }

  /**
   * adds a buttonComponent
   * @param owner pluginName or vcsAppSymbol
   * @throws {Error} if a buttonComponent with the same ID has already been added
   */
  add(
    buttonComponentOptions: ButtonComponentOptions,
    owner: string | symbol,
  ): ButtonComponent {
    check(buttonComponentOptions.id, maybe(String));
    check(buttonComponentOptions.weight, maybe(Number));
    check(buttonComponentOptions.action, actionPattern);
    check(owner, oneOf(String, vcsAppSymbol));

    if (buttonComponentOptions.id && this.has(buttonComponentOptions.id)) {
      throw new Error(
        `A button with id ${buttonComponentOptions.id} has already been registered.`,
      );
    }
    const id = buttonComponentOptions.id || uuidv4();
    const action = reactive(
      getActionFromOptions(buttonComponentOptions.action),
    );

    const buttonComponent: ButtonComponent = {
      get id(): string {
        return id;
      },
      get owner(): string | symbol {
        return owner;
      },
      get action(): VcsAction {
        return action;
      },
      get weight(): number {
        return buttonComponentOptions.weight || 0;
      },
      set weight(value: number) {
        check(value, Number);
        buttonComponentOptions.weight = value;
      },
    };

    this._buttonComponents.set(id, buttonComponent);
    this.componentIds.push(id);
    this.added.raiseEvent(buttonComponent);
    return buttonComponent;
  }

  /**
   * removes all buttonComponents of a specific owner and fires removed Events
   */
  removeOwner(owner: string | symbol): void {
    const componentIds = [...this.componentIds];
    componentIds.forEach((id) => {
      if (owner === this.get(id)?.owner) {
        this.remove(id);
      }
    });
  }

  /**
   * removes all buttonComponents and fires removed Events
   */
  clear(): void {
    const componentIds = [...this.componentIds];
    componentIds.forEach((id) => {
      this.remove(id);
    });
  }

  /**
   * destroys the ButtonManager;
   */
  destroy(): void {
    this.added.destroy();
    this.removed.destroy();
    this.componentIds.splice(0);
    this._buttonComponents.clear();
  }
}

export default ButtonManager;
