<template>
  <v-sheet class="vcs-text-selector">
    <v-container class="px-1 py-0">
      <v-row no-gutters>
        <v-col>
          <VcsTextField
            v-model="localValue.text"
            :placeholder="$st('components.style.enterText')"
          />
        </v-col>
      </v-row>
      <v-row no-gutters>
        <v-col>
          <VcsSelect :items="fontItems" v-model="fontFamily">
            <template #item="scope">
              <v-list-item density="compact" v-bind="scope.props" role="option">
                <template #title="{ title }">
                  <span
                    :style="{
                      fontFamily: `${scope.item.value} !important`,
                    }"
                  >
                    {{ title }}
                  </span>
                </template>
              </v-list-item>
            </template>
          </VcsSelect>
        </v-col>
        <v-col cols="2">
          <VcsTextField
            :hide-spin-buttons="true"
            type="number"
            unit="px"
            v-model="fontSize"
            :rules="[
              (v: number) => (!!v && v > 0) || 'components.validation.notValid',
            ]"
          />
        </v-col>
      </v-row>
      <div class="px-1 py-3">
        <VcsButton
          :active="isBold"
          @click="isBold = !isBold"
          class="pr-1"
          tooltip="components.style.bold"
        >
          {{ $st('components.style.bold') }}
        </VcsButton>
        <VcsButton
          :active="isItalic"
          @click="isItalic = !isItalic"
          class="px-2"
          tooltip="components.style.italic"
        >
          {{ $st('components.style.italic') }}
        </VcsButton>
      </div>
      <VcsStrokeMenu
        v-model="localValue.stroke"
        :value-default="valueDefault?.stroke"
        :disabled="!localValue"
      />
      <VcsFillMenu
        v-model="localValue.fill"
        :value-default="valueDefault?.fill"
        :disabled="!localValue"
      />
      <v-row no-gutters>
        <v-col cols="6">
          <VcsLabel>{{ $st('components.style.offset') }}</VcsLabel>
        </v-col>
        <v-col cols="3">
          <VcsTextField
            hide-spin-buttons
            type="number"
            v-model.number="localValue.offsetX"
            prefix="X"
            unit="px"
          />
        </v-col>
        <v-col cols="3" class="pl-1">
          <VcsTextField
            hide-spin-buttons
            type="number"
            v-model.number="localValue.offsetY"
            prefix="Y"
            unit="px"
          />
        </v-col>
      </v-row>
    </v-container>
  </v-sheet>
</template>

<script lang="ts">
  import { computed, defineComponent } from 'vue';
  import type { PropType } from 'vue';
  import {
    VSheet,
    VContainer,
    VRow,
    VCol,
    VListItem,
  } from 'vuetify/components';
  import VcsLabel from '../form-inputs-controls/VcsLabel.ts.vue';
  import VcsTextField from '../form-inputs-controls/VcsTextField.ts.vue';
  import VcsSelect from '../form-inputs-controls/VcsSelect.ts.vue';
  import VcsButton from '../buttons/VcsButton.ts.vue';
  import VcsFillMenu from './VcsFillMenu.ts.vue';
  import VcsStrokeMenu from './VcsStrokeMenu.ts.vue';
  import { useProxiedComplexModel } from '../modelHelper.js';
  import type { TextStyleOptions } from './composables.js';

  export const fonts: Record<string, string> = {
    Georgia: 'Georgia, serif',
    Palatino: '"Palatino Linotype", "Book Antiqua", Palatino, serif',
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'Times New Roman': '"Times New Roman", Times, serif',
    Arial: 'Arial, Helvetica, sans-serif',
    Impact: 'Impact, Charcoal, sans-serif',
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'Comic Sans': '"Comic Sans MS", cursive, sans-serif',
    Trebuchet: '"Trebuchet MS", Helvetica, sans-serif',
    Verdana: 'Verdana, Geneva, sans-serif',
    Courier: '"Courier New", Courier, monospace',
    Lucida: '"Lucida Console", Monaco, monospace',
  };

  export const defaultFont = {
    style: 'normal',
    weight: 'normal',
    size: '12px',
    sizeNumber: 12,
    family: '',
  };

  /**
   * @description Allows to model a JSON representation of ol/style/Text style. It makes use of VcsStrokeMenu and VcsFillMenu.
   * @vue-prop {import("ol/style/Text").Options} modelValue - The ol Text style options
   * @vue-prop {import("ol/style/Text").Options} valueDefault - The default ol Text style options
   */
  export default defineComponent({
    name: 'VcsTextSelector',
    components: {
      VSheet,
      VContainer,
      VRow,
      VCol,
      VListItem,
      VcsSelect,
      VcsTextField,
      VcsButton,
      VcsStrokeMenu,
      VcsFillMenu,
      VcsLabel,
    },
    props: {
      modelValue: {
        type: Object as PropType<TextStyleOptions>,
        default: () => ({}),
      },
      valueDefault: {
        type: Object as PropType<TextStyleOptions>,
        default: undefined,
      },
    },
    setup(props, { emit }) {
      const localValue = useProxiedComplexModel(props, 'modelValue', emit);
      const font = computed(() => {
        if (localValue.value) {
          const el = document.createElement('span');
          el.setAttribute('style', `font: ${localValue.value.font}`);
          const { fontStyle, fontWeight, fontSize, fontFamily } = el.style;
          el.remove();
          return {
            fontStyle,
            fontWeight,
            fontSize,
            fontFamily,
          };
        }
        return {};
      });

      function setNewFont(fontPropertyArray: Array<string>): void {
        localValue.value.font = fontPropertyArray
          .filter((prop) => prop && prop !== 'normal')
          .join(' ');
      }

      const fontItems = Object.keys(fonts).map((key) => ({
        title: key,
        value: fonts[key],
      }));

      const fontFamily = computed({
        get() {
          return font.value.fontFamily;
        },
        set(newFamily) {
          setNewFont([
            font.value.fontStyle || defaultFont.style,
            font.value.fontWeight || defaultFont.weight,
            font.value.fontSize || defaultFont.size,
            newFamily || defaultFont.family,
          ]);
        },
      });

      const fontSize = computed({
        get() {
          return font.value.fontSize
            ? parseInt(font.value.fontSize, 10)
            : defaultFont.sizeNumber;
        },
        set(newSize) {
          if (!newSize || newSize < 1) {
            return;
          }
          setNewFont([
            font.value.fontStyle || defaultFont.style,
            font.value.fontWeight || defaultFont.weight,
            `${newSize}px`,
            font.value.fontFamily || defaultFont.family,
          ]);
        },
      });

      const isBold = computed({
        get() {
          return font.value.fontWeight === 'bold';
        },
        set(newValue) {
          setNewFont([
            font.value.fontStyle || defaultFont.style,
            newValue ? 'bold' : defaultFont.weight,
            font.value.fontSize || defaultFont.size,
            font.value.fontFamily || defaultFont.family,
          ]);
        },
      });
      const isItalic = computed({
        get() {
          return font.value.fontStyle === 'italic';
        },
        set(newValue) {
          setNewFont([
            newValue ? 'italic' : defaultFont.style,
            font.value.fontWeight || defaultFont.weight,
            font.value.fontSize || defaultFont.size,
            font.value.fontFamily || defaultFont.family,
          ]);
        },
      });

      return {
        localValue,
        fontItems,
        font,
        fontFamily,
        fontSize,
        isBold,
        isItalic,
      };
    },
  });
</script>
