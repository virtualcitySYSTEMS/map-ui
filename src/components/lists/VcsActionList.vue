<template>
  <v-list v-if="actions.length > 0">
    <VcsTooltip
      v-for="(action, index) in actions"
      :key="`${action.name}-${index}`"
      :tooltip="action.title"
      :tooltip-position="tooltipPosition"
      v-bind="{ ...tooltipProps }"
    >
      <template #activator="{ on, attrs }">
        <v-list-item
          :class="action.active ? 'primary--text' : ''"
          :disabled="action.disabled || disabled"
          @click="action.callback($event)"
          v-bind="{ ...$attrs, ...attrs }"
          v-on="{ ...$listeners, ...on }"
        >
          <v-list-item-icon v-if="showIcon && action.icon">
            <v-icon small>{{ action.icon }}</v-icon>
          </v-list-item-icon>
          <v-list-item-content class="vcs-action-list">
            <v-list-item-title>{{ $t(action.name) }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </template>
    </VcsTooltip>
  </v-list>
</template>
<style lang="scss">
  .vcs-action-list {
    width: 100%;
    &:hover {
      color: var(--v-primary-base);
    }
  }
</style>
<script>
  import { is } from '@vcsuite/check';
  import {
    VIcon,
    VList,
    VListItem,
    VListItemContent,
    VListItemIcon,
    VListItemTitle,
  } from 'vuetify/lib';
  import VcsTooltip from '../notification/VcsTooltip.vue';

  /**
   * pattern to check actions
   * @type {Object}
   */
  export const ActionPattern = {
    name: String,
    title: [undefined, String],
    icon: [undefined, String],
    callback: Function,
    active: [undefined, Boolean],
    background: [undefined, Boolean],
    hasUpdate: [undefined, Boolean],
    disabled: [undefined, Boolean],
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
   * A component rendering a list of actions with overflow mechanic using
   * {@link https://vuetifyjs.com/en/api/v-list-item-group/|vuetify v-list-item-group} and {@link VcsTooltip}.
   * @vue-prop {Array<VcsAction>} actions - Array of actions
   * @vue-prop {('bottom' | 'left' | 'top' | 'right')}  tooltipPosition - Position of the tooltip.
   * @vue-prop {Object<string, any>}                    tooltipProps - Properties to be passed to VcsTooltip {@link https://vuetifyjs.com/en/api/v-tooltip/#props|vuetify v-tooltip}
   * @vue-prop {boolean}                                [showIcon=false] - Whether list item icons should be displayed.
   * @vue-prop {boolean}                                [disabled=false] - disable all actions
   */
  export default {
    name: 'VcsActionList',
    components: {
      VcsTooltip,
      VList,
      VListItem,
      VListItemIcon,
      VIcon,
      VListItemTitle,
      VListItemContent,
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
  };
</script>
