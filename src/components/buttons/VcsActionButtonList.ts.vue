<template>
  <div
    v-if="actions.length > 0"
    :class="classes"
    class="gc-2 vcs-action-button-list"
  >
    <template v-if="buttons.length > 0">
      <component
        :is="button"
        class="d-flex"
        v-for="(btn, index) in buttons"
        :key="`${btn.name}-${index}`"
        :data-action-name="btn.name"
        :tooltip="btn.title"
        :tooltip-position="tooltipPosition"
        :icon="btn.icon"
        :active="btn.active"
        :disabled="btn.disabled || disabled"
        :has-update="btn.hasUpdate"
        :background="btn.background"
        @click.stop="btn.callback($event)"
      />
    </template>
    <v-menu
      v-if="overflowButtons.length > 0"
      content-class="vcs-overflow-menu-wrap"
      max-width="none"
      location="right"
      :offset="[13, 0]"
    >
      <template #activator="{ props }">
        <component
          :is="button"
          :disabled="disabled"
          v-bind="props"
          class="d-flex"
          :icon="overflowIcon"
        />
      </template>
      <VcsActionList :actions="overflowButtons" :disabled="disabled" />
    </v-menu>
    <v-spacer v-else-if="blockOverflow" />
  </div>
</template>

<script lang="ts">
  import { VIcon, VMenu, VSpacer } from 'vuetify/components';
  import { computed, defineComponent, inject, type PropType } from 'vue';
  import type VcsUiApp from '../../vcsUiApp.js';
  import VcsButton from './VcsButton.ts.vue';
  import VcsToolButton from './VcsToolButton.ts.vue';
  import VcsFormButton from './VcsFormButton.ts.vue';
  import VcsActionList, {
    validateActions,
  } from '../lists/VcsActionList.ts.vue';
  import type { VcsAction } from '../../actions/actionHelper.js';

  /**
   * compares two strings token based
   * @returns the convergence of both strings in percent
   */
  function jaccardSimilarity(str1: string, str2: string): number {
    const set1 = new Set(str1.split(' '));
    const set2 = new Set(str2.split(' '));
    const intersection = new Set([...set1].filter((x) => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
  }

  /**
   * @description
   * A component rendering a list of actions with overflow mechanic using
   * For overflow buttons the title is only rendered, if it differs significantly from the action's name.
   * {@link VcsButton} and {@link VcsActionList}.
   * @vue-prop {Array<VcsAction>} actions - Array of actions
   * @vue-prop {string} [button='VcsButton'] - used button type (one of 'VcsButton', 'VcsToolButton' or 'VcsFormButton)
   * @vue-prop {number} [overflowCount=2] - number of buttons rendered until overflow.
   * @vue-prop {string} [overflowIcon='$vcsKebab'] - optional custom icon for overflow button
   * @vue-prop {boolean} [blockOverflow=false] - if space for the overflow should be blocked or not (e.g. when rendering lists in a grid)
   * @vue-prop {boolean} [forceOverflow=true] - if there is only one overflow button, this button can be rendered instead of the overflow button by setting this option to false
   * @vue-prop {boolean} [disabled=false] - disable all actions
   * @vue-prop {('bottom' | 'left' | 'top' | 'right')}  tooltipPosition - Position of the tooltip.
   * @vue-computed {Array<VcsAction>} buttons - buttons rendered directly, have to provide an icon
   * @vue-computed {Array<VcsAction>} overflowButtons - rest of buttons rendered in overflow
   */
  export default defineComponent({
    name: 'VcsActionButtonList',
    components: {
      VcsActionList,
      VcsButton,
      VcsToolButton,
      VcsFormButton,
      VMenu,
      VIcon,
      VSpacer,
    },
    props: {
      actions: {
        type: Array as PropType<VcsAction[]>,
        required: true,
        validator: validateActions,
      },
      button: {
        type: String,
        default: 'VcsButton',
        validator: (type: string) =>
          ['VcsButton', 'VcsToolButton', 'VcsFormButton'].includes(type),
      },
      overflowCount: {
        type: Number,
        default: 2,
      },
      overflowIcon: {
        type: String,
        default: '$vcsKebab',
      },
      blockOverflow: {
        type: Boolean,
        default: false,
      },
      forceOverflow: {
        type: Boolean,
        default: true,
      },
      disabled: {
        type: Boolean,
        default: false,
      },
      tooltipPosition: {
        type: String,
        default: 'bottom',
      },
    },
    setup(props, { attrs }) {
      const app = inject('vcsApp') as VcsUiApp;
      const right = computed(
        () => attrs.right !== undefined && attrs.right !== false,
      );
      const computedCount = computed(() => {
        if (
          !props.forceOverflow &&
          props.actions.length === props.overflowCount + 1
        ) {
          return props.actions.length;
        }
        return props.overflowCount;
      });
      const buttons = computed(() => {
        const b = props.actions
          .filter((i) => i.icon)
          .slice(0, computedCount.value);
        if (right.value) {
          return b.reverse();
        }
        return b;
      });

      return {
        buttons,
        overflowButtons: computed(() => {
          const buttonsNames = buttons.value.map((i) => i.name);
          return props.actions
            .filter((i) => !buttonsNames.includes(i.name))
            .map((i) => {
              const { title, ...button } = i;
              if (
                title &&
                jaccardSimilarity(app.vueI18n.t(i.name), app.vueI18n.t(title)) >
                  0.5
              ) {
                return button;
              }
              return i;
            });
        }),
        classes: computed(() => {
          const classes = ['d-flex', 'align-center', 'action-btn-wrap'];
          if (right.value) {
            classes.push('justify-end');
          }
          return classes;
        }),
      };
    },
  });
</script>
<style scoped lang="scss">
  :deep(.v-spacer) {
    width: calc(var(--v-vcs-font-size) * 1.25);
  }
</style>
