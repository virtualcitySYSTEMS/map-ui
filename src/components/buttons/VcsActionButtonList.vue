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
  </div>
</template>
<script>
  import { VIcon, VMenu, VSpacer } from 'vuetify/components';
  import VcsButton from './VcsButton.vue';
  import VcsToolButton from './VcsToolButton.vue';
  import VcsFormButton from './VcsFormButton.vue';
  import VcsActionList, { validateActions } from '../lists/VcsActionList.vue';

  /**
   * compares two strings token based
   * @param {string} str1
   * @param {string} str2
   * @returns {number} the convergence of both strings in percent
   */
  function jaccardSimilarity(str1, str2) {
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
        return this.actions
          .filter((i) => !buttonsNames.includes(i.name))
          .map((i) => {
            const { title, ...button } = i;
            if (
              title &&
              jaccardSimilarity(this.$t(i.name), this.$t(title)) > 0.5
            ) {
              return button;
            }
            return i;
          });
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
