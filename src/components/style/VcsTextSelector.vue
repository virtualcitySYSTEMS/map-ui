<template>
  <v-sheet>
    <v-container class="px-1 py-0">
      <v-row no-gutters>
        <v-col>
          <VcsTextField
            v-model="selectedText"
            :placeholder="$t('components.style.enterText')"
          />
        </v-col>
      </v-row>
      <v-row no-gutters>
        <v-col>
          <VcsSelect
            :items="
              Object.keys(fonts).map((font) => ({
                text: font,
                value: fonts[font],
              }))
            "
            v-model="fontFamily"
          >
            <template #item="{ item }">
              <span :style="`font-family: ${item.value} !important`">{{
                item.text
              }}</span>
            </template>
          </VcsSelect>
        </v-col>
        <v-col cols="2">
          <VcsTextField
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
        v-model="selectedStroke"
        :value-default="valueDefault.stroke"
        :disabled="!value"
      />
      <VcsFillMenu
        v-model="selectedFill"
        :value-default="valueDefault.fill"
        :disabled="!value"
      />
      <v-row no-gutters>
        <v-col cols="6">
          <VcsLabel>{{ $t('components.style.offset') }}</VcsLabel>
        </v-col>
        <v-col cols="3">
          <VcsTextField
            type="number"
            v-model.number="selectedOffsetX"
            tooltip-position="top"
            prefix="X"
            unit="px"
            tooltip="components.style.offsetX"
          />
        </v-col>
        <v-col cols="3">
          <VcsTextField
            type="number"
            v-model.number="selectedOffsetY"
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
  import { VSheet, VContainer, VRow, VCol } from 'vuetify/lib';
  import {
    VcsSelect,
    VcsTextField,
    VcsButton,
    VcsStrokeMenu,
    VcsFillMenu,
    VcsLabel,
  } from '@vcmap/ui';
  import { useSelectedKey } from './composables.js';

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
   * @vue-prop {import("ol/style/Text").Options} value - The ol Text style options
   * @vue-prop {import("ol/style/Text").Options} valueDefault - The default ol Text style options
   */
  export default {
    name: 'VcsTextSelector',
    components: {
      VSheet,
      VContainer,
      VRow,
      VCol,
      VcsSelect,
      VcsTextField,
      VcsButton,
      VcsStrokeMenu,
      VcsFillMenu,
      VcsLabel,
    },
    props: {
      value: {
        type: Object,
        default: undefined,
      },
      valueDefault: {
        type: Object,
        required: true,
      },
    },
    setup(props, { emit }) {
      const font = computed({
        get() {
          let fontStyle = {
            // fontStyle: 'normal',
            // fontWeight: 'normal',
          };
          if (props.value) {
            const el = document.createElement('span');
            el.setAttribute('style', `font: ${props.value.font}`);
            fontStyle = el.style;
            el.remove();
          }
          return fontStyle;
        },
      });

      function emitNewFont(key, value) {
        font.value[key] = value;
        const newModelObject = JSON.parse(JSON.stringify(props.value));
        const fontPropertyArray = [
          font.value.fontStyle,
          font.value.fontWeight,
          font.value.fontSize,
          font.value.fontFamily,
        ];
        emit(
          'input',
          Object.assign(newModelObject, {
            font: fontPropertyArray
              .filter((prop) => prop && prop !== 'normal')
              .join(' '),
          }),
        );
      }

      const fontFamily = computed({
        get() {
          return font.value.fontFamily;
        },
        set(newFamily) {
          emitNewFont('fontFamily', newFamily);
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
          emitNewFont('fontSize', `${newSize}px`);
        },
      });

      const isBold = computed({
        get() {
          return font.value.fontWeight === 'bold';
        },
        set(newValue) {
          emitNewFont('fontWeight', newValue ? 'bold' : 'normal');
        },
      });
      const isItalic = computed({
        get() {
          return font.value.fontStyle === 'italic';
        },
        set(newValue) {
          emitNewFont('fontStyle', newValue ? 'italic' : 'normal');
        },
      });

      const selectedFill = useSelectedKey(
        () => props.value,
        'fill',
        props.valueDefault.fill,
        emit,
      );
      const selectedStroke = useSelectedKey(
        () => props.value,
        'stroke',
        props.valueDefault.stroke,
        emit,
      );
      const selectedOffsetX = useSelectedKey(
        () => props.value,
        'offsetX',
        props.valueDefault.offsetX,
        emit,
      );
      const selectedOffsetY = useSelectedKey(
        () => props.value,
        'offsetY',
        props.valueDefault.offsetY,
        emit,
      );
      const selectedText = useSelectedKey(
        () => props.value,
        'text',
        props.valueDefault.text,
        emit,
      );
      return {
        fonts,
        font,
        fontFamily,
        fontSize,
        selectedFill,
        selectedStroke,
        emitNewFont,
        isBold,
        isItalic,
        selectedOffsetX,
        selectedOffsetY,
        selectedText,
      };
    },
  };
</script>
