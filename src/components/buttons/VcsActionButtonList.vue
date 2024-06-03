<template>
  <div v-if="actions.length > 0" :class="classes" class="gc-2">
    <template v-if="buttons.length > 0">
      <component
        :is="button"
        class="d-flex"
        v-for="(btn, index) in buttons"
        :key="`${btn.name}-${index}`"
        :tooltip="btn.title"
        :icon="btn.icon"
        :active="btn.active"
        :disabled="btn.disabled || disabled"
        :has-update="btn.hasUpdate"
        :background="btn.background"
        @click.stop="btn.callback($event)"
        v-bind="{ ...$attrs }"
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
        >
          <v-icon>{{ overflowIcon }}</v-icon>
        </component>
      </template>
      <VcsActionList :actions="overflowButtons" :disabled="disabled" />
    </v-menu>
    <v-spacer
      v-else-if="blockOverflow"
      class="flex-grow-0 d-inline-block px-2"
    />
  </div>
</template>
<script>
  import { VIcon, VMenu, VSpacer } from 'vuetify/components';
  import VcsButton from './VcsButton.vue';
  import VcsToolButton from './VcsToolButton.vue';
  import VcsFormButton from './VcsFormButton.vue';
  import VcsActionList, { validateActions } from '../lists/VcsActionList.vue';

  /**
   * @description
   * A component rendering a list of actions with overflow mechanic using
   * {@link VcsButton} and {@link VcsActionList}.
   * @vue-prop {Array<VcsAction>} actions - Array of actions
   * @vue-prop {string} [button='VcsButton'] - used button type (one of 'VcsButton', 'VcsToolButton' or 'VcsFormButton)
   * @vue-prop {number} [overflowCount=2] - number of buttons rendered until overflow.
   * @vue-prop {string} [overflowIcon='$vcsKebab'] - optional custom icon for overflow button
   * @vue-prop {boolean} [blockOverflow=false] - if space for the overflow should be blocked or not (e.g. when rendering lists in a grid)
   * @vue-computed {Array<VcsAction>} buttons - buttons rendered directly, have to provide an icon
   * @vue-computed {Array<VcsAction>} overflowButtons - rest of buttons rendered in overflow
   * @vue-prop {boolean} [disabled=false] - disable all actions
   */
  export default {
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
        type: Array,
        required: true,
        validator: validateActions,
      },
      button: {
        type: String,
        default: 'VcsButton',
        validator: (type) =>
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
      disabled: {
        type: Boolean,
        default: false,
      },
    },
    computed: {
      right() {
        return this.$attrs.right !== undefined && this.$attrs.right !== false;
      },
      buttons() {
        const buttons = this.actions
          .filter((i) => i.icon)
          .slice(0, this.overflowCount);
        if (this.right) {
          return buttons.reverse();
        }
        return buttons;
      },
      overflowButtons() {
        const buttonsNames = this.buttons.map((i) => i.name);
        return this.actions.filter((i) => !buttonsNames.includes(i.name));
      },
      classes() {
        const classes = ['d-flex', 'align-center', 'action-btn-wrap'];
        if (this.right) {
          classes.push('justify-end');
        }
        return classes;
      },
    },
  };
</script>
