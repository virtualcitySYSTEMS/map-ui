<template>
  <span v-if="group.options && group.options[0]" class="ma-1 position-relative" :class="[...customClasses]">
    <v-btn
      class="expand-button mb-0 w-16 h-10"
      :color="active ? 'white' : null"
      :text="!active ? true : null"
      @click="() => setOpen(group.id, !group.open)"
      :class="{
        'mb-0': active,
        'h-full': active,
        'rounded-b-0': active
      }"
      :disabled="group.options[0].disabled"
      elevation="0"
    >
      <slot name="selected-icon">
        <v-icon v-text="group.icon" />
      </slot>
      <slot />
      <v-icon
        :class="{ 'rotate-180--right': active }"
        v-if="group.options.length > 1"
        v-text="'mdi-chevron-down'"
      />
    </v-btn>

    <v-card v-if="group.open" tile style="position: absolute; min-width: 150px">
      <v-list dense>
        <v-list-item-group>
          <v-list-item
            v-for="option of group.options"
            :key="option.id"
            @click="() => selectOption(option.id)"
            dense
          >
            <v-list-item-action>
              <input type="checkbox" :checked="option.selected" :class="option.selected ? 'y' : 'n'">
            </v-list-item-action>
            <v-list-item-content>
              <v-list-item-title>{{ option.text }}</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list-item-group>
      </v-list>
    </v-card>
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
  import { ref } from '@vue/composition-api';

  export default {
    name: 'VcsToolboxSingleSelectButton',
    props: {
      value: {
        type: Boolean,
        default: undefined,
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
  };
</script>
