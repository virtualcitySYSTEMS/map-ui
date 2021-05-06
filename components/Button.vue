<template>
  <div
    :class="[...customClasses]"
    class="vcs-button"
  >
    <v-tooltip
      v-if="tooltip"
      :content-class="`tooltip ${arrowClass}`"
      :bottom="tooltipPosition === 'bottom'"
      :top="tooltipPosition === 'top'"
      :left="tooltipPosition === 'left'"
      :right="tooltipPosition === 'right'"
    >
      <template v-slot:activator="{ on, attrs }">
        <v-btn
          :color="!!value ? 'primary' : null"
          :text="!value ? true : null"
          :elevation="elevation"
          @click="onClick"
          class="ma-1 px-2"
          v-bind="attrs"
          v-on="on"
        >
          <v-icon v-if="icon" v-text="icon" :class="{ 'mr-2': hasDefaultSlot }" />
          <slot />
        </v-btn>
      </template>
      <span>{{ tooltip }}</span>
    </v-tooltip>
    <v-btn
      v-else
      :color="!!value ? 'primary' : null"
      :text="!value ? true : null"
      :elevation="elevation"
      @click="onClick"
      class="ma-1 px-2"
    >
      <v-icon v-if="icon" v-text="icon" :class="{ 'mr-2': hasDefaultSlot }" />
      <slot />
    </v-btn>

    <Badge
      v-if="hasUpdate"
      :color="'warning'"
      class="position-absolute pos-t-0 pos-r-0"
    />
  </div>
</template>

<style scoped>
  .v-btn:not(.v-btn--round).v-size--default {
    min-width: 48px;
    height: 40px;
  }

  .vcs-button {
    position: relative;
    display: inline-block;
  }
</style>

<script>
  import Vue from 'vue';

  import Badge from './Badge.vue';

  /**
   * @description Customizable button component.
   * @vue-prop {boolean}                                toggleable - Whether the button color is being toggled by clicking on it.
   * @vue-prop {string}                                 color - Any of the theme colors.
   * @vue-prop {string}                                 tooltip - Text content of a tooltip which appears on hover.
   * @vue-prop {('bottom' | 'left' | 'top' | 'right')}  tooltipPosition - Position of the tooltip.
   * @vue-prop {boolean}                                value - When true, will have the primary color as background.
   * @vue-prop {boolean}                                hasUpdate - Whether the button shows a badge in the top right.
   * @vue-prop {string}                                 icon - When given, will display an icon in the button.
   * @vue-prop {number}                                 elevation - Vuetify shadow, possible values: 0-9
   * @vue-prop {Array}                                  customClasses - Array of strings which will be added as classes.
   * @vue-event {boolean}                               input - Emits when the button is clicked.
   */
  export default Vue.extend({
    name: 'VcsButton',
    components: { Badge },
    computed: {
      arrowClass() {
        switch (this.tooltipPosition) {
        case 'bottom': return 'arrow-top';
        case 'top': return 'arrow-bottom';
        case 'left': return 'arrow-right';
        case 'right': return 'arrow-left';
        default: return '';
        }
      },
      hasDefaultSlot() {
        return !!this.$slots.default && !!this.$slots.default[0].text.trim();
      },
    },
    props: {
      toggleable: {
        type: Boolean,
        default: false,
      },
      tooltip: {
        type: String,
        default: undefined,
      },
      tooltipPosition: {
        type: String,
        default: 'bottom',
      },
      value: {
        type: Boolean,
        default: false,
      },
      hasUpdate: {
        type: Boolean,
        default: false,
      },
      icon: {
        type: String,
        default: undefined,
      },
      elevation: {
        type: Number,
        default: 0,
      },
      customClasses: {
        type: Array,
        default: () => ([]),
      },
    },
    methods: {
      onClick() {
        const isActive = this.toggleable ? !this.value : this.value;
        this.$emit('input', isActive);
      },
    },
  });
</script>
