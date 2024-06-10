import { reactive, watch } from 'vue';
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

/**
 * Creates an action
 * @param {string} name
 * @param {import("vue").Ref<StateActionState>} stateRef
 * @param {function():void} callback
 * @returns {{ action: import("./actionHelper.js").VcsAction, destroy: function():void }}
 */
export function createStateRefAction(name, stateRef, callback) {
  check(name, String);
  check(stateRef?.value, Object.values(StateActionState));
  check(callback, Function);

  const currentState = stateRef.value;
  const action = reactive({
    name,
    icon: stateIconMap[currentState],
    callback,
  });

  const destroy = watch(stateRef, () => {
    action.icon = stateIconMap[stateRef.value];
  });

  return {
    action,
    destroy,
  };
}
