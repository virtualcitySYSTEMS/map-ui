<template>
  <span class="ma-1 position-relative" :class="[...customClasses]">
    <v-btn
      class="expand-button mb-0 w-16 h-10"
      :color="active ? 'white' : null"
      :text="!active ? true : null"
      @click="() => setOpen(group.id, !group.open)"
      :class="{
        'mb-0': active,
        'h-full': active,
        'rounded-b-0': active,
        'border-2--primary': group.options[0].selected
      }"
      :disabled="group.options[0].disabled"
      elevation="0"
    >
      <slot name="selected-icon">
        <v-icon v-text="group.options[0].icon" />
      </slot>
      <slot />
      <v-icon
        :class="{ 'rotate-180--right': active }"
        v-if="group.options.length > 1"
        v-text="'mdi-chevron-down'"
      />

    </v-btn>


    <div
      v-if="group.open"
      class="d-flex flex-row white rounded-b position-absolute z-index-1 pos-t-11"
    >
      <slot name="menu-items">

        <v-btn
          class="py-1 rounded-t-0 rounded-br-0 h-10.5 -mt-2"
          elevation="0"
          v-for="option of group.options.slice(1)"
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

  export default Vue.extend({
    name: 'VcsToolboxSingleSelectButton',
    props: {
      value: {
        type: Boolean,
        default: false,
      },
      group: {
        type: Object,
        default: () => ({}),
      },
      customClasses: {
        type: Array,
        default: () => [],
      },
    },
    setup({ value }, { emit }) {
      const open = ref(false);
      const selectOption = (id) => {
        emit('selected', id);
        emit('set-open', { id, open: !open });
      };
      const setOpen = (id, o) => {
        emit('set-open', { id, open: o });
      };
      return {
        active: value,
        open,
        selectOption,
        setOpen,
      };
    },
  });
</script>
