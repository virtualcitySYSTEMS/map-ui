<template>
  <span class="ma-1 position-relative" :class="[...customClasses]">
    <v-btn
      class="expand-button mb-0 w-16 h-10"
      :color="active ? 'white' : null"
      :text="!active ? true : null"
      @click="() => open = !open"
      :class="{
        'mb-0': active,
        'h-full': active,
        'rounded-b-0': active,
        'border-2--primary': options[0].selected
      }"
      :disabled="options[0].disabled"
      elevation="0"
    >
      <slot name="selected-icon">
        <v-icon v-text="options[0].icon" />
      </slot>
      <slot />
      <v-icon
        :class="{ 'rotate-180--right': active }"
        v-if="options.length > 1"
        v-text="'mdi-chevron-down'"
      />

    </v-btn>


    <div
      v-if="open"
      class="d-flex flex-row white rounded-b position-absolute z-index-1 pos-t-11"
    >
      <slot name="menu-items">

        <v-btn
          class="py-1 rounded-t-0 rounded-br-0 h-10.5 -mt-2"
          elevation="0"
          v-for="option of options.slice(1)"
          :key="option.id"
          @click="() => selectOption(option.id)"
        >
          <v-icon class="mt-1.5" v-text="option.icon" />
        </v-btn>
      </slot>
    </div>
  </span>
</template>

<style lang="scss" scoped>
  .expand-button {
    ::v-deep {
      max-width: 68px;

      .v-btn__content {
        max-width: 48px;
      }
    }
  }
</style>

<script>
  import Vue from 'vue';
  import { ref } from '@vue/composition-api';

  /**
   * TODO: define behaviour with designer.
   */
  export default Vue.extend({
    name: 'VcsExpandableButton',
    props: {
      value: {
        type: Boolean,
        default: undefined,
      },
      options: {
        type: Array,
        default: () => ([]),
      },
      customClasses: {
        type: Array,
        default: () => ([]),
      },
    },
    setup({ value }, { emit }) {
      const open = ref(false);
      const selectOption = (id) => {
        emit('selected', id);
        open.value = !open;
      };
      return {
        active: value,
        open,
        selectOption,
      };
    },
  });
</script>
