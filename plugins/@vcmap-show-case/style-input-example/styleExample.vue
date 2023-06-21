<template>
  <v-sheet>
    <VcsFormSection heading="Style menus">
      <VcsFillMenu
        v-model="styleOptions.fill"
        :value-default="defaultStyleOptions.fill"
      />
      <VcsStrokeMenu
        v-model="styleOptions.stroke"
        :value-default="defaultStyleOptions.stroke"
      />
    </VcsFormSection>
    <VcsFormSection heading="Fill Selector">
      <VcsFillSelector v-model="styleOptions.fill" />
    </VcsFormSection>
    <VcsFormSection heading="Stroke Selector">
      <VcsStrokeSelector v-model="styleOptions.stroke" />
    </VcsFormSection>
  </v-sheet>
</template>

<script>
  import { VSheet } from 'vuetify/lib';
  import { onMounted, ref, watchEffect } from 'vue';
  import {
    VcsFormSection,
    VcsFillSelector,
    VcsFillMenu,
    VcsStrokeSelector,
    VcsStrokeMenu,
  } from '@vcmap/ui';
  import { parseColor } from '@vcmap/core';
  import { Fill, Stroke, Style } from 'ol/style.js';

  export default {
    name: 'StyleExample',
    components: {
      VSheet,
      VcsFormSection,
      VcsFillMenu,
      VcsStrokeMenu,
      VcsFillSelector,
      VcsStrokeSelector,
    },
    setup() {
      const exampleStyle = new Style({
        fill: new Fill({ color: 'rgba(255,255,255,0.4)' }),
        stroke: undefined,
      });

      const defaultStyleOptions = {
        fill: undefined,
        stroke: {
          color: [0, 0, 0, 1],
          width: 2,
        },
      };

      const styleOptions = ref({
        fill: undefined,
        stroke: undefined,
      });

      const fill = exampleStyle.getFill();
      const stroke = exampleStyle.getStroke();

      // TODO: Replace with new getStyleOptions from @vcmap/core as soon as available
      if (fill) {
        styleOptions.value.fill = {
          color: parseColor(fill.getColor()),
        };
      }
      if (stroke) {
        styleOptions.value.stroke = {
          color: parseColor(stroke.getColor()),
          width: exampleStyle.getStroke().getWidth(),
        };
      }

      onMounted(() => {
        watchEffect(() => {
          const newFill = styleOptions.value.fill;
          const newStroke = styleOptions.value.stroke;
          // TODO: Replace with new getStyleFromOptions from @vcmap/core as soon as available
          exampleStyle.setFill(newFill ? new Fill(newFill) : null);
          exampleStyle.setStroke(newStroke ? new Stroke(newStroke) : null);
        });
      });

      return {
        styleOptions,
        defaultStyleOptions,
      };
    },
  };
</script>
