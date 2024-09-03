<template>
  <v-list v-if="actions.length > 0" rounded class="vcs-action-list">
    <v-list-item
      v-for="(action, index) in actions"
      :key="`${action.name}-${index}`"
      :class="action.active ? 'text-primary' : ''"
      :disabled="action.disabled || disabled"
      @click="action.callback($event)"
      v-bind="{ ...$attrs }"
    >
      <template #prepend v-if="showIcon && action.icon">
        <v-icon :size="iconSize">{{ action.icon }}</v-icon>
      </template>
      <v-list-item-title>{{ $st(action.name) }}</v-list-item-title>
      <v-tooltip
        v-if="action.title"
        activator="parent"
        :text="$st(action.title)"
        :location="tooltipPosition"
        v-bind="{ ...tooltipProps }"
      />
    </v-list-item>
  </v-list>
</template>
<style lang="scss" scoped>
  :deep(.v-list-item:hover) {
    .v-list-item-title {
      color: rgb(var(--v-theme-primary));
    }
    .v-icon {
      // the icon color slightly differs from the text color, darken-1 seems to fit better
      color: rgb(var(--v-theme-primary-darken-1));
    }
  }
  :deep(.v-list-item .v-list-item__prepend .v-list-item__spacer) {
    width: 8px;
  }
</style>
<script>
  import { is, optional } from '@vcsuite/check';
  import {
    VIcon,
    VList,
    VListItem,
    VListItemTitle,
    VTooltip,
  } from 'vuetify/components';
  import { useIconSize } from '../../vuePlugins/vuetify.js';

  /**
   * pattern to check actions
   * @type {Object}
   */
  export const ActionPattern = {
    name: String,
    title: optional(String),
    icon: optional(String),
    callback: Function,
    active: optional(Boolean),
    background: optional(Boolean),
    hasUpdate: optional(Boolean),
    disabled: optional(Boolean),
  };

  /**
   * @param {import("../../actions/actionHelper.js").VcsAction} action
   * @returns {boolean}
   */
  export function validateAction(action) {
    return is(action, ActionPattern);
  }

  /**
   * @param {Array<import("../../actions/actionHelper.js").VcsAction>} actions
   * @returns {boolean}
   */
  export function validateActions(actions) {
    return actions.every(validateAction);
  }

  /**
   * @description
   * A component rendering a list of actions
   * @vue-prop {Array<VcsAction>} actions - Array of actions
   * @vue-prop {('bottom' | 'left' | 'top' | 'right')}  tooltipPosition - Position of the tooltip. (action.title will be rendered as a tooltip)
   * @vue-prop {Object<string, any>}                    tooltipProps - Properties to be passed to v-tooltip
   * @vue-prop {boolean}                                [showIcon=false] - Whether list item icons should be displayed.
   * @vue-prop {boolean}                                [disabled=false] - disable all actions
   */
  export default {
    name: 'VcsActionList',
    components: {
      VList,
      VListItem,
      VIcon,
      VListItemTitle,
      VTooltip,
    },
    props: {
      actions: {
        type: Array,
        required: true,
        validator: validateActions,
      },
      tooltipPosition: {
        type: String,
        default: 'right',
      },
      tooltipProps: {
        type: Object,
        default: () => ({}),
      },
      showIcon: {
        type: Boolean,
        default: false,
      },
      disabled: {
        type: Boolean,
        default: false,
      },
    },
    setup() {
      const iconSize = useIconSize();
      return {
        iconSize,
      };
    },
  };
</script>
