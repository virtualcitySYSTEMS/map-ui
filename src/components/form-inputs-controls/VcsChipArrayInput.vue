<template>
  <div
    class="d-flex d-inline-block align-center vcs-chip-array-input"
    :class="{
      'py-1': !paddingProvided,
    }"
  >
    <VcsButton
      v-if="hasScrollbar"
      icon="mdi-chevron-left"
      @click="vcsChipArrayInput.scrollLeft -= scrollDx"
    />
    <div
      ref="vcsChipArrayInput"
      class="d-flex d-inline-block mx-1 my-0 ga-1"
      :class="{
        'overflow-x-auto': !column,
        'hide-scrollbar': !column,
        'v-row': column,
        'row-gap': column,
      }"
    >
      <div v-for="({ key, value }, index) in localValue" :key="key">
        <v-chip
          v-if="selected !== index"
          v-bind="{ ...noListenerAttrs }"
          size="small"
          :disabled="disabled"
          :closable="deletableChips"
          @click="select(index)"
          @click:close="remove(index)"
        >
          <span class="text-truncate d-inline-block">{{ value }}</span>
        </v-chip>
        <VcsTextField
          v-else
          v-bind="{ ...noListenerAttrs }"
          rounded
          filled
          autofocus
          hide-spin-buttons
          :height="useItemHeight().value - 8"
          v-model="editValue"
          @keydown.esc="selected = -1"
          @blur="selected = -1"
          @keydown.enter="submitChange($event)"
          @click:append-inner="submitChange($event)"
          append-inner-icon="mdi-check"
          :style="{ width: `${inputWidth}px` }"
          class="py-0"
        />
      </div>
      <div>
        <v-chip
          v-if="adding === false"
          v-bind="{ ...noListenerAttrs }"
          size="small"
          :disabled="disabled"
          @click="adding = true"
        >
          <v-icon>$vcsPlus</v-icon>
        </v-chip>
        <VcsTextField
          v-else
          v-bind="{ ...noListenerAttrs }"
          rounded
          filled
          autofocus
          hide-spin-buttons
          :height="useItemHeight().value - 8"
          v-model="newValue"
          @keydown.enter="add($event, newValue)"
          @click:append-inner="add($event, newValue)"
          @keydown.esc="cancel"
          @blur="cancel"
          append-inner-icon="mdi-check"
          :style="{ width: `${inputWidth}px` }"
          class="py-0"
        />
      </div>
    </div>
    <VcsButton
      v-if="hasScrollbar"
      icon="mdi-chevron-right"
      @click="vcsChipArrayInput.scrollLeft += scrollDx"
    />
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
  .v-chip.v-chip--size-small {
    --v-chip-height: calc(var(--v-vcs-item-height) - 8px);
  }
  :deep(.v-icon--size-x-small) {
    font-size: 18px;
  }
  .row-gap {
    row-gap: 8px !important;
  }
</style>

<script>
  import { computed, nextTick, onMounted, ref, shallowRef, watch } from 'vue';
  import { VChip, VIcon } from 'vuetify/components';
  import { v4 as uuid } from 'uuid';
  import { usePadding } from '../composables.js';
  import { useItemHeight } from '../../vuePlugins/vuetify.js';
  import VcsButton from '../buttons/VcsButton.vue';
  import VcsTextField from './VcsTextField.vue';
  import { removeListenersFromAttrs } from '../attrsHelpers.js';

  /**
   * @description Renders elements of an array as chips with an input field to edit or add new elements.
   * Provides VcsTooltip to show error messages on focus
   * When clicking esc key, previous input is restored.
   * @vue-prop {T[]} modelValue
   * @vue-prop {string}                                 [type] - The input type (string or number)
   * @vue-prop {boolean}                                [disabled] - Disables adding or removing new elements
   * @vue-prop {boolean}                                [column] - Remove horizontal pagination and wrap items as needed
   * @vue-prop {boolean}                                [scrollDx=20] - scroll amount in px
   * @vue-prop {boolean}                                [deletableChips=true] - Adds a delete button to elements to remove them from array
   * @vue-prop {number}                                 [inputWidth=75] - Width of the text fields in px.
   */
  export default {
    name: 'VcsChipArrayInput',
    components: {
      VcsButton,
      VcsTextField,
      VChip,
      VIcon,
    },
    props: {
      modelValue: {
        type: Array,
        default: () => [],
      },
      deletableChips: {
        type: Boolean,
        default: true,
      },
      inputWidth: {
        type: Number,
        default: 75,
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
    emits: ['update:modelValue'],
    setup(props, { attrs, emit }) {
      const selected = ref(-1);
      const adding = ref(false);
      const editValue = ref(undefined);
      const newValue = ref(undefined);
      const vcsChipArrayInput = ref();
      const hasScrollbar = ref();

      function updateHasScrollbar() {
        if (!props.column) {
          hasScrollbar.value =
            vcsChipArrayInput.value.scrollWidth -
              vcsChipArrayInput.value.clientWidth >
            36; // size of the scroll buttons
        }
      }

      onMounted(() => updateHasScrollbar());

      function isValid(value) {
        if (attrs.rules) {
          return !attrs.rules.some((r) => {
            if (typeof r === 'function') {
              return r(value) !== true;
            }
            return r !== true;
          });
        }
        return true;
      }

      function parseValue(value) {
        return attrs.type === 'number' ? parseFloat(value) : value;
      }

      function mapModelValue(modelValue) {
        return modelValue.map((value) => ({
          key: uuid(),
          value: parseValue(value),
        }));
      }

      function emitValue(value) {
        emit(
          'update:modelValue',
          value.map((i) => i.value),
        );
      }

      const localValue = shallowRef(mapModelValue(props.modelValue));

      watch(
        () => props.modelValue,
        () => {
          localValue.value = mapModelValue(props.modelValue);
        },
      );

      function remove(index) {
        localValue.value.splice(index, 1);
        emitValue(localValue.value);
        updateHasScrollbar();
      }

      function select(index) {
        if (!props.disabled) {
          selected.value = index;
          editValue.value = localValue.value[index].value;
        }
      }

      function submitChange(e) {
        e.stopPropagation();
        e.preventDefault();
        const value = parseValue(editValue.value);
        if (!isValid(value)) {
          return;
        }
        localValue.value[selected.value].value = value;
        emitValue(localValue.value);
        selected.value = -1;
      }

      function cancel() {
        newValue.value = undefined;
        adding.value = false;
      }

      async function add(e, v) {
        e.stopPropagation();
        e.preventDefault();

        if (v) {
          const value = parseValue(v);
          if (!isValid(value)) {
            return;
          }
          localValue.value.push({
            key: uuid(),
            value,
          });
          emitValue(localValue.value);
          await nextTick();
          updateHasScrollbar();
          await nextTick();
          vcsChipArrayInput.value.scrollLeft =
            vcsChipArrayInput.value.scrollWidth;
        }
        newValue.value = undefined;
        adding.value = true;
      }

      const noListenerAttrs = computed(() => removeListenersFromAttrs(attrs));

      const paddingProvided = usePadding(attrs);

      return {
        paddingProvided,
        localValue,
        noListenerAttrs,
        selected,
        adding,
        editValue,
        newValue,
        vcsChipArrayInput,
        hasScrollbar,
        remove,
        select,
        submitChange,
        add,
        cancel,
        useItemHeight,
      };
    },
  };
</script>
