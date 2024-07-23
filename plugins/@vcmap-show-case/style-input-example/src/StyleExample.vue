<template>
  <v-sheet>
    <VcsFormSection
      heading="Style menus"
      :header-actions="[resetExample, logStyle]"
    >
      <VcsVectorStyleComponent
        v-model="styleOptions.style"
        :value-default="defaultStyleOptions"
      />
    </VcsFormSection>
    <VcsFormSection :expandable="true" heading="Fill Selector">
      <VcsFillSelector v-model="styleOptions.style.fill" />
    </VcsFormSection>
    <VcsFormSection :expandable="true" heading="Stroke Selector">
      <VcsStrokeSelector v-model="styleOptions.style.stroke" />
    </VcsFormSection>
    <VcsFormSection :expandable="true" heading="Image Selector">
      <VcsImageSelector
        v-model="styleOptions.style.image"
        :value-default="defaultStyleOptions.image"
        :extended-shape-settings="true"
      />
    </VcsFormSection>
    <VcsFormSection :expandable="true" heading="Text Selector">
      <VcsTextSelector
        v-model="styleOptions.style.text"
        :value-default="defaultStyleOptions.text"
      />
    </VcsFormSection>
  </v-sheet>
</template>

<script>
  import { VSheet } from 'vuetify/components';
  import { reactive, toRaw } from 'vue';
  import {
    VcsFormSection,
    VcsFillSelector,
    VcsStrokeSelector,
    VcsImageSelector,
    VcsTextSelector,
    VcsVectorStyleComponent,
    VectorStyleMenus,
  } from '@vcmap/ui';
  import { getStyleOptions } from '@vcmap/core';
  import { Fill, RegularShape, Stroke, Style, Text } from 'ol/style.js';

  export default {
    name: 'StyleExample',
    components: {
      VSheet,
      VcsFormSection,
      VcsFillSelector,
      VcsStrokeSelector,
      VcsImageSelector,
      VcsTextSelector,
      VcsVectorStyleComponent,
    },
    setup() {
      const exampleStyle = new Style({
        fill: new Fill({ color: 'rgba(255,255,255,0.4)' }),
        stroke: undefined,
        image: new RegularShape({
          points: undefined,
          radius: 11,
          angle: undefined,
          radius2: undefined,
          fill: new Fill({ color: 'rgba(255,255,255,1)' }),
          stroke: new Stroke({ color: 'rgba(0,0,0,1)', width: 1 }),
        }),
        text: new Text({
          font: '10px Arial, Helvetica, sans-serif',
          fill: new Fill({ color: 'rgba(0,0,0,1)' }),
          stroke: new Stroke({ color: 'rgba(255,255,255,1)', width: 1 }),
        }),
      });

      const defaultStyleOptions = {
        fill: undefined,
        stroke: {
          color: [0, 0, 0, 1],
          width: 2,
        },
        image: {
          fill: undefined,
          stroke: {
            color: [0, 0, 0, 1],
            width: 2,
          },
          radius: 10,
          scale: 1,
          opacity: 1,
        },
        text: {
          font: '10px Arial, Helvetica, sans-serif',
          offsetX: 0,
          offsetY: 0,
          text: '',
        },
      };

      // use reactive wrapper object to ensure updates
      const styleOptions = reactive({
        style: getStyleOptions(exampleStyle),
      });

      return {
        styleOptions,
        defaultStyleOptions,
        VectorStyleMenus,
        resetExample: {
          name: 'resetExample',
          icon: 'mdi-sync',
          callback() {
            styleOptions.style = getStyleOptions(exampleStyle);
          },
        },
        logStyle: {
          name: 'logStyle',
          icon: 'mdi-console',
          callback() {
            console.log(toRaw(styleOptions.style));
          },
        },
      };
    },
  };
</script>
