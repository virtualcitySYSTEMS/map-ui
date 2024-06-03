<template>
  <div
    class="d-flex d-inline-block align-center mb-1"
    :class="{ 'mt-1': !column }"
  >
    <v-btn
      v-if="hasScrollbar"
      :dense="isDense"
      size="x-small"
      icon
      :ripple="false"
      elevation="0"
      @click="vcsChipArrayInput.scrollLeft -= scrollDx"
    >
      <v-icon>mdi-chevron-left</v-icon>
    </v-btn>
    <div
      ref="vcsChipArrayInput"
      class="d-flex d-inline-block mx-1 my-0"
      :class="{
        'overflow-x-auto': !column,
        'hide-scrollbar': !column,
        row: column,
      }"
    >
      <div
        v-for="(item, index) in modelValue"
        :key="index"
        class="pr-1"
        :class="{ 'pt-1': column }"
      >
        <v-chip
          v-if="selected !== index"
          v-bind="{ ...noListenerAttrs }"
          :size="isDense ? 'small' : undefined"
          :disabled="disabled"
          :closable="deletableChips"
          @click="select(index)"
          @click:close="remove(index)"
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
          v-bind="{ ...noListenerAttrs }"
          v-model="editValue"
          @keydown.esc="selected = -1"
          @blur="selected = -1"
          @keydown.enter="submitChange($event)"
          @click:append="submitChange($event)"
          @update:error="(err) => (isEditValid = !err)"
          append-icon="mdi-check"
          :style="{ width: `${inputWidth}px` }"
        />
      </div>
      <div :class="{ 'pt-1': column }">
        <v-chip
          v-if="adding === false"
          v-bind="{ ...noListenerAttrs }"
          :size="isDense ? 'small' : undefined"
          :disabled="disabled"
          @click="adding = true"
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
          v-bind="{ ...noListenerAttrs }"
          @keydown.enter="add($event, newValue)"
          @keydown.esc="cancel"
          @blur="cancel"
          @click:append="add($event, newValue)"
          @update:error="(err) => (isNewValid = !err)"
          append-icon="mdi-check"
          :style="{ width: `${inputWidth}px` }"
        />
      </div>
    </div>
    <v-btn
      v-if="hasScrollbar"
      :dense="isDense"
      size="x-small"
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
    :deep(.v-input__slot) {
      .v-input__append-inner {
        margin-top: 5px;
      }
    }
    :deep(.v-text-field--filled > .v-input__control > .v-input__slot),
    :deep(.v-text-field--outlined > .v-input__control > .v-input__slot) {
      min-height: unset;
    }
  }
</style>

<script>
  import { computed, nextTick, onMounted, ref } from 'vue';
  import { VBtn, VChip, VIcon } from 'vuetify/components';
  import VcsTextField from './VcsTextField.vue';
  import { removeListenersFromAttrs } from '../attrsHelpers.js';

  /**
   * @description Renders elements of an array as chips with an input field to edit or add new elements.
   * Provides two height options depending on "dense" property
   * Provides VcsTooltip to show error messages on focus
   * When clicking esc key, previous input is restored.
   * @vue-prop {T[]} modelValue
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
      modelValue: {
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
            'update:modelValue',
            value.map((v) => parseFloat(v)),
          );
        } else {
          emit('update:modelValue', value);
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
        emitValue(props.modelValue.toSpliced(index, 1));
        updateHasScrollbar();
      }

      function select(index) {
        if (!props.disabled) {
          selected.value = index;
          editValue.value = props.modelValue[index];
        }
      }

      function submitChange(e) {
        e.stopPropagation();
        e.preventDefault();
        if (isEditValid.value) {
          emitValue(
            props.modelValue.toSpliced(selected.value, 1, editValue.value),
          );
          selected.value = -1;
        }
      }

      function cancel() {
        newValue.value = undefined;
        adding.value = false;
      }

      async function add(e, value) {
        e.stopPropagation();
        e.preventDefault();
        if (isNewValid.value) {
          if (value) {
            emitValue([...props.modelValue, value]);
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

      const noListenerAttrs = removeListenersFromAttrs(attrs);

      return {
        noListenerAttrs,
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
