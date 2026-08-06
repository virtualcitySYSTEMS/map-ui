import type { Ref } from 'vue';
import { reactive, watch } from 'vue';
import { check, ofEnum } from '@vcsuite/check';
import type { DestroyableAction } from './actionHelper.ts';

export enum StateActionState {
  NONE = 0,
  INACTIVE = 1,
  LOADING = 2,
  ACTIVE = 3,
  INDETERMINATE = 4,
}

const stateIconMap: Record<StateActionState, string> = {
  [StateActionState.NONE]: '',
  [StateActionState.INACTIVE]: '$vcsCheckbox',
  [StateActionState.ACTIVE]: '$vcsCheckboxChecked',
  [StateActionState.INDETERMINATE]: '$vcsCheckboxIndeterminate',
  [StateActionState.LOADING]: '$vcsProgress',
};

export function createStateRefAction(
  name: string,
  stateRef: Ref<StateActionState>,
  callback: () => void,
): DestroyableAction {
  check(name, String);
  check(stateRef?.value, ofEnum(StateActionState));
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

  return { action, destroy };
}
