<template>
  <span class="ma-1 position-relative" :class="[...customClasses]">
    <v-btn
      class="expand-button mb-0 w-16 h-10"
      :color="active ? 'white' : null"
      :text="!active ? true : null"
      @click="() => onClick(selectedOption.icon)"
      :class="{
        'mb-0': active,
        'h-full': active,
        'rounded-b-0': active,
      }"
      elevation="0"
    >
      <!-- 'pr-1': nonSelectedOptions.length > 0 -->
      <slot name="selected-icon">
        <!-- TODO: Select icon -->
        <v-icon />
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

        <!-- <v-btn
          class="py-1 rounded-t-0 rounded-br-0 h-10.5 -mt-2"
          elevation="0"
          v-for="option of nonSelectedOptions"
          :key="option.icon"
          @click="() => selectOption(option.icon)"
        >
          <v-icon class="mt-1.5" v-text="option.icon" />
        </v-btn> -->
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
    setup({ value }) {
      const selectOption = (id) => {
        // eslint-disable-next-line no-console
        console.log(`selected ${id}`);
      };
      return {
        active: value,
        open: false,
        selectOption,
      };
    },
  });
</script>
