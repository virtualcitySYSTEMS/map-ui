<template>
  <v-list
    v-if="actions.length > 0"
  >
    <VcsTooltip
      v-for="(action, index) in actions"
      :key="`${action.name}-${index}`"
      :tooltip="action.title"
      :tooltip-position="tooltipPosition"
      v-bind="{...tooltipProps}"
    >
      <template #activator="{ on, attrs }">
        <v-list-item
          :class="action.active ? 'primary--text' : ''"
          color="primary"
          @click="action.callback($event)"
          v-bind="{...$attrs, ...attrs}"
          v-on="{...$listeners, ...on}"
        >
          <v-list-item-icon v-if="showIcon && action.icon">
            <v-icon v-text="action.icon" small />
          </v-list-item-icon>
          <v-list-item-content
            class="vcs-action-list"
          >
            <v-list-item-title v-text="$t(action.name)" />
          </v-list-item-content>
        </v-list-item>
      </template>
    </VcsTooltip>
  </v-list>
</template>
<style lang="scss">
.vcs-action-list {
  width: 100%;
  &:hover{
    color: var(--v-primary-base);
  }
}
</style>
<script>
  import { is } from '@vcsuite/check';
  import VcsTooltip from '../notification/VcsTooltip.vue';

  /**
   * @interface VcsAction
   * @property {string} name - reactive and translatable name rendered in overflow
   * @property {string} [title] - reactive and translatable title rendered as tooltip
   * @property {string} [icon] - icon rendered on the button. If no icon provided, item is rendered in overflow
   * @property {Function} callback - callback function is triggered when the button is clicked
   * @property {boolean} [active=false] - optional state of button. If active, button is rendered in primary color
   */

  /**
   * @param {Array<VcsAction>} actions
   * @returns {boolean}
   */
  export function validateActions(actions) {
    return actions.every(item => is(item, {
      name: String,
      title: [undefined, String],
      icon: [undefined, String],
      callback: Function,
      active: [undefined, Boolean],
    }));
  }

  /**
   * @description
   * A component rendering a list of actions with overflow mechanic using
   * {@link https://vuetifyjs.com/en/api/v-list-item-group/|vuetify v-list-item-group} and {@link VcsTooltip}.
   * @vue-prop {Array<VcsAction>} actions - Array of actions
   * @vue-prop {('bottom' | 'left' | 'top' | 'right')}  tooltipPosition - Position of the tooltip.
   * @vue-prop {Object<string, any>}                    tooltipProps - Properties to be passed to VcsTooltip {@link https://vuetifyjs.com/en/api/v-tooltip/#props|vuetify v-tooltip}
   * @vue-prop {boolean}                                [showIcon=false] - Whether list item icons should be displayed.
   */
  export default {
    name: 'VcsActionList',
    components: { VcsTooltip },
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
    },
  };
</script>
