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
      <VcsImageMenu
        v-model="styleOptions.image"
        :value-default="defaultStyleOptions"
      />
    </VcsFormSection>
    <VcsFormSection heading="Fill Selector">
      <VcsFillSelector v-model="styleOptions.fill" />
    </VcsFormSection>
    <VcsFormSection heading="Stroke Selector">
      <VcsStrokeSelector v-model="styleOptions.stroke" />
    </VcsFormSection>
    <VcsFormSection heading="Image Selector">
      <VcsImageSelector
        v-model="styleOptions.image"
        :value-default="defaultStyleOptions"
      />
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
    VcsImageSelector,
    VcsImageMenu,
  } from '@vcmap/ui';
  import { parseColor } from '@vcmap/core';
  import { Fill, Icon, RegularShape, Stroke, Style } from 'ol/style.js';

  export default {
    name: 'StyleExample',
    components: {
      VSheet,
      VcsFormSection,
      VcsFillMenu,
      VcsStrokeMenu,
      VcsFillSelector,
      VcsStrokeSelector,
      VcsImageSelector,
      VcsImageMenu,
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
      });

      const defaultStyleOptions = {
        fill: undefined,
        stroke: {
          color: [0, 0, 0, 1],
          width: 2,
        },
        radius: 10,
        scale: 1,
        opacity: 1,
      };

      const styleOptions = ref({
        fill: undefined,
        stroke: undefined,
        image: undefined,
      });

      const fill = exampleStyle.getFill();
      const stroke = exampleStyle.getStroke();
      const image = exampleStyle.getImage();

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
      if (image) {
        if (image instanceof RegularShape) {
          styleOptions.value.image = {
            points: exampleStyle.getImage().getPoints(),
            radius: exampleStyle.getImage().getRadius(),
            radius2: exampleStyle.getImage().getRadius2(),
            angle: exampleStyle.getImage().getAngle(),
            fill: {
              color: parseColor(exampleStyle.getImage().getFill().getColor()),
            },
            stroke: {
              color: parseColor(exampleStyle.getImage().getStroke().getColor()),
              width: exampleStyle.getImage().getStroke().getWidth(),
            },
            src: 'mdi-circle-outline',
          };
        } else if (image instanceof Icon) {
          styleOptions.value.image = {
            src: exampleStyle.getImage().getSrc(),
            scale: exampleStyle.getImage().getScale(),
            opacity: exampleStyle.getImage().getOpacity(),
          };
        }
      }

      onMounted(() => {
        watchEffect(() => {
          const newFill = styleOptions.value.fill;
          const newStroke = styleOptions.value.stroke;
          const newImage = styleOptions.value.image;
          // TODO: Replace with new getStyleFromOptions from @vcmap/core as soon as available
          exampleStyle.setFill(newFill ? new Fill(newFill) : null);
          exampleStyle.setStroke(newStroke ? new Stroke(newStroke) : null);
          if (newImage?.points) {
            // exampleStyle.setImage(new RegularShape(newImage));
          } else if (newImage?.src) {
            exampleStyle.setImage(new Icon(newImage));
          } else {
            exampleStyle.setImage(null);
          }
        });
      });

      return {
        styleOptions,
        defaultStyleOptions,
      };
    },
  };
</script>
