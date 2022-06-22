import { watch } from '@vue/composition-api';
import { check } from '@vcsuite/check';

/**
 * @enum {number}
 */
export const StateActionState = {
  NONE: 0,
  INACTIVE: 1,
  LOADING: 2,
  ACTIVE: 3,
  INDETERMINATE: 4,
};

const stateIconMap = {
  [StateActionState.INACTIVE]: '$vcsCheckbox',
  [StateActionState.ACTIVE]: '$vcsCheckboxChecked',
  [StateActionState.INDETERMINATE]: '$vcsCheckboxIndeterminate',
  [StateActionState.LOADING]: '$vcsProgress',
};

const stateI18nMap = {
  [StateActionState.INACTIVE]: 'content.stateAction.titleInactive',
  [StateActionState.ACTIVE]: 'content.stateAction.titleActive',
  [StateActionState.INDETERMINATE]: 'content.stateAction.titleIndeterminate',
  [StateActionState.LOADING]: 'content.stateAction.titleLoading',
};


/**
 * Creates an action
 * @param {string} name
 * @param {import("@vue/composition-api").Ref<StateActionState>} stateRef
 * @param {function():void} callback
 * @returns {{ action: VcsAction, destroy: function():void }}
 */
export function createStateRefAction(name, stateRef, callback) {
  check(name, String);
  check(stateRef?.value, Object.values(StateActionState));
  check(callback, Function);

  const currentState = stateRef.value;
  const action = {
    name,
    title: stateI18nMap[currentState],
    icon: stateIconMap[currentState],
    callback,
  };

  const destroy = watch(stateRef, () => {
    action.icon = stateIconMap[stateRef.value];
    action.title = stateI18nMap[stateRef.value];
  });

  return {
    action,
    destroy,
  };
}
