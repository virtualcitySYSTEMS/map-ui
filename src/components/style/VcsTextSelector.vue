<template>
  <v-sheet class="vcs-text-selector">
    <v-container class="px-1 py-0">
      <v-row no-gutters>
        <v-col>
          <VcsTextField
            v-model="localValue.text"
            :placeholder="$t('components.style.enterText')"
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
                    >{{ title }}</span
                  >
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
            :rules="[(v) => (!!v && v > 0) || 'components.validation.notValid']"
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
          {{ $t('components.style.bold') }}
        </VcsButton>
        <VcsButton
          :active="isItalic"
          @click="isItalic = !isItalic"
          class="px-2"
          tooltip="components.style.italic"
        >
          {{ $t('components.style.italic') }}
        </VcsButton>
      </div>
      <VcsStrokeMenu
        v-model="localValue.stroke"
        :value-default="valueDefault.stroke"
        :disabled="!localValue"
      />
      <VcsFillMenu
        v-model="localValue.fill"
        :value-default="valueDefault.fill"
        :disabled="!localValue"
      />
      <v-row no-gutters>
        <v-col cols="6">
          <VcsLabel>{{ $t('components.style.offset') }}</VcsLabel>
        </v-col>
        <v-col cols="3">
          <VcsTextField
            :hide-spin-buttons="true"
            type="number"
            v-model.number="localValue.offsetX"
            tooltip-position="top"
            prefix="X"
            unit="px"
            tooltip="components.style.offsetX"
          />
        </v-col>
        <v-col cols="3">
          <VcsTextField
            :hide-spin-buttons="true"
            type="number"
            v-model.number="localValue.offsetY"
            tooltip-position="top"
            prefix="Y"
            unit="px"
            tooltip="components.style.offsetY"
          />
        </v-col>
      </v-row>
    </v-container>
  </v-sheet>
</template>

<script>
  import { computed } from 'vue';
  import {
    VSheet,
    VContainer,
    VRow,
    VCol,
    VListItem,
  } from 'vuetify/components';
  import VcsLabel from '../form-inputs-controls/VcsLabel.vue';
  import VcsTextField from '../form-inputs-controls/VcsTextField.vue';
  import VcsSelect from '../form-inputs-controls/VcsSelect.vue';
  import VcsButton from '../buttons/VcsButton.vue';
  import VcsFillMenu from './VcsFillMenu.vue';
  import VcsStrokeMenu from './VcsStrokeMenu.vue';
  import { useProxiedComplexModel } from '../modelHelper.js';

  export const fonts = {
    Georgia: 'Georgia, serif',
    Palatino: '"Palatino Linotype", "Book Antiqua", Palatino, serif',
    'Times New Roman': '"Times New Roman", Times, serif',
    Arial: 'Arial, Helvetica, sans-serif',
    Impact: 'Impact, Charcoal, sans-serif',
    'Comic Sans': '"Comic Sans MS", cursive, sans-serif',
    Trebuchet: '"Trebuchet MS", Helvetica, sans-serif',
    Verdana: 'Verdana, Geneva, sans-serif',
    Courier: '"Courier New", Courier, monospace',
    Lucida: '"Lucida Console", Monaco, monospace',
  };

  /**
   * @description Allows to model a JSON representation of ol/style/Text style. It makes use of VcsStrokeMenu and VcsFillMenu.
   * @vue-prop {import("ol/style/Text").Options} modelValue - The ol Text style options
   * @vue-prop {import("ol/style/Text").Options} valueDefault - The default ol Text style options
   */
  export default {
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
        type: Object,
        default: undefined,
      },
      valueDefault: {
        type: Object,
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

      function setNewFont(fontPropertyArray) {
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
            font.value.fontStyle,
            font.value.fontWeight,
            font.value.fontSize,
            newFamily,
          ]);
        },
      });

      const fontSize = computed({
        get() {
          return parseInt(font.value.fontSize, 10);
        },
        set(newSize) {
          if (!newSize || newSize < 1) {
            return;
          }
          setNewFont([
            font.value.fontStyle,
            font.value.fontWeight,
            `${newSize}px`,
            font.value.fontFamily,
          ]);
        },
      });

      const isBold = computed({
        get() {
          return font.value.fontWeight === 'bold';
        },
        set(newValue) {
          setNewFont([
            font.value.fontStyle,
            newValue ? 'bold' : 'normal',
            font.value.fontSize,
            font.value.fontFamily,
          ]);
        },
      });
      const isItalic = computed({
        get() {
          return font.value.fontStyle === 'italic';
        },
        set(newValue) {
          setNewFont([
            newValue ? 'italic' : 'normal',
            font.value.fontWeight,
            font.value.fontSize,
            font.value.fontFamily,
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
  };
</script>
