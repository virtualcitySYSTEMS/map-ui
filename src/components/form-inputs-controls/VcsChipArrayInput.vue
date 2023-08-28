<template>
  <div id="vcs-chip-array-input" class="d-flex d-inline-block align-center">
    <v-btn
      v-if="hasScrollbar"
      :dense="isDense"
      x-small
      icon
      :ripple="false"
      elevation="0"
      @click="vcsChipArrayInput.scrollLeft -= scrollDx"
    >
      <v-icon>mdi-chevron-left</v-icon>
    </v-btn>
    <div
      id="vcs-chip-array-input"
      ref="vcsChipArrayInput"
      class="d-flex d-inline-block"
      :class="{
        'overflow-x-auto': !column,
        'hide-scrollbar': !column,
        row: column,
        'ma-1': !hasScrollbar,
      }"
    >
      <div v-for="(item, index) in value" :key="index" class="py-1 pr-1">
        <v-chip
          v-if="selected !== index"
          v-bind="{ ...$attrs }"
          :small="isDense"
          :disabled="disabled"
          :close="deletableChips"
          @click="select(index)"
          @click:close="remove(index)"
          class="pa-2"
        >
          <span class="text-truncate d-inline-block">{{ item }}</span>
        </v-chip>
        <VcsTextField
          v-else
          hide-details
          :dense="isDense"
          rounded
          filled
          autofocus
          no-padding
          :height="24"
          v-bind="{ ...$attrs }"
          v-model="editValue"
          @keydown.esc="selected = -1"
          @blur="selected = -1"
          @keydown.enter="submitChange"
          @click:append="submitChange"
          @update:error="(err) => (isEditValid = !err)"
          append-icon="mdi-check"
          :style="{ width: `${inputWidth}px` }"
        />
      </div>
      <div class="py-1">
        <v-chip
          v-if="adding === false"
          v-bind="{ ...$attrs }"
          :small="isDense"
          :disabled="disabled"
          @click="adding = true"
          class="pa-2"
        >
          <v-icon>$vcsPlus</v-icon>
        </v-chip>
        <VcsTextField
          v-else
          hide-details
          :dense="isDense"
          rounded
          filled
          autofocus
          no-padding
          :height="24"
          class="vcs-inside-chip"
          v-model="newValue"
          v-bind="{ ...$attrs }"
          @keydown.enter="add(newValue)"
          @keydown.esc="cancel"
          @blur="cancel"
          @click:append="add(newValue)"
          @update:error="(err) => (isNewValid = !err)"
          append-icon="mdi-check"
          :style="{ width: `${inputWidth}px` }"
        />
      </div>
    </div>
    <v-btn
      v-if="hasScrollbar"
      :dense="isDense"
      x-small
      icon
      :ripple="false"
      elevation="0"
      @click="vcsChipArrayInput.scrollLeft += scrollDx"
    >
      <v-icon>mdi-chevron-right</v-icon>
    </v-btn>
  </div>
</template>

<style lang="scss" scoped>
  .hide-scrollbar {
    -ms-overflow-style: none; /* IE and Edge */
    scrollbar-width: none; /* Firefox */
  }
  .hide-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .v-chip {
    display: flex;
    max-width: 260px;
    padding: 0 8px;
    .v-chip__content {
      display: flex;
    }
  }
  .vcs-inside-chip {
    ::v-deep {
      .v-input__slot {
        .v-input__append-inner {
          margin-top: 5px;
        }
      }
      .v-text-field--filled > .v-input__control > .v-input__slot,
      .v-text-field--outlined > .v-input__control > .v-input__slot {
        min-height: unset;
      }
    }
  }
</style>

<script>
  import { computed, nextTick, onMounted, ref } from 'vue';
  import { VBtn, VChip, VIcon } from 'vuetify/lib';
  import VcsTextField from './VcsTextField.vue';

  /**
   * @description Renders elements of an array as chips with an input field to edit or add new elements.
   * Provides two height options depending on "dense" property
   * Provides VcsTooltip to show error messages on focus
   * When clicking esc key, previous input is restored.
   * @vue-prop {('bottom' | 'left' | 'top' | 'right')}  [tooltipPosition='right'] - Position of the error tooltip.
   * @vue-prop {string}                                 [type] - The input type (string or number)
   * @vue-prop {boolean}                                [disabled] - Disables adding or removing new elements
   * @vue-prop {boolean}                                [column] - Remove horizontal pagination and wrap items as needed
   * @vue-prop {boolean}                                [scrollDx=20] - scroll amount in px
   * @vue-prop {boolean}                                [deletableChips=true] - Adds a delete button to elements to remove them from array
   * @vue-prop {number}                                 [inputWidth=50] - Width of the text fields in px.
   */
  export default {
    name: 'VcsChipArrayInput',
    components: {
      VBtn,
      VcsTextField,
      VChip,
      VIcon,
    },
    props: {
      value: {
        type: Array,
        required: true,
      },
      tooltipPosition: {
        type: String,
        default: 'right',
      },
      deletableChips: {
        type: Boolean,
        default: true,
      },
      inputWidth: {
        type: Number,
        default: 50,
      },
      disabled: {
        type: Boolean,
        default: false,
      },
      column: {
        type: Boolean,
        default: false,
      },
      scrollDx: {
        type: Number,
        default: 20,
      },
    },
    setup(props, { attrs, emit }) {
      const selected = ref(-1);
      const adding = ref(false);
      const isEditValid = ref(true);
      const editValue = ref(undefined);
      const isNewValid = ref(true);
      const newValue = ref(undefined);
      const vcsChipArrayInput = ref();
      const hasScrollbar = ref();
      const isDense = computed(() => attrs.dense !== false);

      function emitValue(value) {
        if (attrs.type === 'number') {
          emit(
            'input',
            value.map((v) => parseFloat(v)),
          );
        } else {
          emit('input', value);
        }
      }

      function updateHasScrollbar() {
        if (!props.column) {
          hasScrollbar.value =
            vcsChipArrayInput.value.scrollWidth -
              vcsChipArrayInput.value.clientWidth >
            36; // size of the scroll buttons
        }
      }

      onMounted(() => updateHasScrollbar());

      function remove(index) {
        emitValue(props.value.toSpliced(index, 1));
        updateHasScrollbar();
      }

      function select(index) {
        if (!props.disabled) {
          selected.value = index;
          editValue.value = props.value[index];
        }
      }

      function submitChange() {
        if (isEditValid.value) {
          emitValue(props.value.toSpliced(selected.value, 1, editValue.value));
          selected.value = -1;
        }
      }

      function cancel() {
        newValue.value = undefined;
        adding.value = false;
      }

      async function add(value) {
        if (isNewValid.value) {
          if (value) {
            emitValue([...props.value, value]);
            await nextTick();
            updateHasScrollbar();
            await nextTick();
            vcsChipArrayInput.value.scrollLeft =
              vcsChipArrayInput.value.scrollWidth;
          }
          newValue.value = undefined;
          adding.value = true;
        }
      }

      return {
        selected,
        adding,
        editValue,
        isEditValid,
        newValue,
        isNewValid,
        isDense,
        vcsChipArrayInput,
        hasScrollbar,
        remove,
        select,
        submitChange,
        add,
        cancel,
      };
    },
  };
</script>
