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
      <VcsTextMenu
        v-model="styleOptions.text"
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
    <VcsFormSection heading="Text Selector">
      <VcsTextSelector
        v-model="styleOptions.text"
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
    VcsTextSelector,
    VcsTextMenu,
  } from '@vcmap/ui';
  import { parseColor } from '@vcmap/core';
  import { Fill, Icon, RegularShape, Stroke, Style, Text } from 'ol/style.js';

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
      VcsTextSelector,
      VcsTextMenu,
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
        radius: 10,
        scale: 1,
        opacity: 1,
        font: '10px Arial, Helvetica, sans-serif',
        offsetX: 0,
        offsetY: 0,
        text: '',
      };

      const styleOptions = ref({
        fill: undefined,
        stroke: undefined,
        image: undefined,
        text: undefined,
      });

      const fill = exampleStyle.getFill();
      const stroke = exampleStyle.getStroke();
      const image = exampleStyle.getImage();
      const text = exampleStyle.getText();

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
            points: image.getPoints(),
            radius: image.getRadius(),
            radius2: image.getRadius2(),
            angle: image.getAngle(),
            fill: {
              color: parseColor(image.getFill().getColor()),
            },
            stroke: {
              color: parseColor(image.getStroke().getColor()),
              width: image.getStroke().getWidth(),
            },
            src: 'mdi-circle-outline',
          };
        } else if (image instanceof Icon) {
          styleOptions.value.image = {
            src: image.getSrc(),
            scale: image.getScale(),
            opacity: image.getOpacity(),
          };
        }
      }
      if (text) {
        styleOptions.value.text = {
          font: text.getFont(),
          fill: {
            color: parseColor(text.getFill()?.getColor()),
          },
          stroke: {
            color: parseColor(text.getStroke()?.getColor()),
            width: text.getStroke().getWidth(),
          },
          textBaseline: text.getTextBaseline(),
          offsetY: text.getOffsetY(),
          offsetX: text.getOffsetX(),
          text: text.getText(),
        };
      }

      onMounted(() => {
        watchEffect(() => {
          const newFill = styleOptions.value.fill;
          const newStroke = styleOptions.value.stroke;
          const newImage = styleOptions.value.image;
          // const newText = styleOptions.value.text;
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
