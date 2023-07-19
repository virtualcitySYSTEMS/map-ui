<template>
  <v-sheet>
    <v-container class="px-1 py-0">
      <v-row no-gutters>
        <v-col class="d-flex justify-center py-1">
          <canvas ref="canvas" width="50" height="50" />
        </v-col>
      </v-row>
    </v-container>
    <v-divider />
    <div class="px-1">
      <VcsRadio
        :items="
          Object.values(ImageType).map((value) => ({
            value,
            label: `components.style.${value}`,
          }))
        "
        v-model="selectedType"
        :disabled="!value"
        row
      />
    </div>
    <v-divider />
    <v-container class="px-1 pt-1 pb-0">
      <VcsRadioGrid
        v-model="selectedImage"
        :items="currentItems"
        :disabled="!value"
        item-value="src"
      >
        <template #label="{ src }" v-if="selectedType === ImageType.SHAPE">
          <v-icon size="24">{{ src }}</v-icon>
        </template>
      </VcsRadioGrid>
      <div v-if="selectedType === ImageType.ICON">
        <v-row no-gutters>
          <v-col>
            <VcsLabel html-for="style-icon-opacity">
              {{ $t('components.style.opacity') }}
            </VcsLabel>
          </v-col>
          <v-col>
            <VcsSlider
              id="style-icon-opacity"
              v-model="selectedOpacity"
              step="0.1"
              type="number"
              max="1"
              min="0"
              :disabled="currentType !== ImageType.ICON"
            ></VcsSlider>
          </v-col>
        </v-row>
      </div>
      <div v-else-if="selectedType === ImageType.SHAPE">
        <v-row
          no-gutters
          v-for="input in shapeSingleValueInputs"
          :key="input.name"
        >
          <v-col>
            <VcsLabel>{{ $t(`components.style.${input.text}`) }}</VcsLabel>
          </v-col>
          <v-col cols="3">
            <VcsTextField
              :id="`style-shape-${input.text}`"
              type="number"
              :unit="input.unit || ''"
              v-model.number="input.value.value"
              :disabled="currentType !== ImageType.SHAPE"
              :step="input.step || 1"
              :min="input.range?.[0] || 0"
              :max="input.range?.[1] || undefined"
              :rules="[
                (v) => !input.isRequired || !!v || 'components.style.required',
                (v) =>
                  !input.range ||
                  (!input.isRequired && !v) ||
                  between(v, input.range) ||
                  `${$t('components.style.allowedRange')}: ${input.range.join(
                    ' - ',
                  )}`,
              ]"
              :show-spin-buttons="true"
            />
          </v-col>
        </v-row>
      </div>
      <v-row
        no-gutters
        v-if="extendedShapeSettings || selectedType === ImageType.ICON"
      >
        <v-col>
          <VcsLabel>{{ $t('components.style.scale') }}</VcsLabel>
        </v-col>
        <v-col cols="3">
          <VcsTextField
            id="style-shape-scaleX"
            type="number"
            v-model.number="selectedScale.x.value"
            prefix="X"
            placeholder="1"
            :disabled="currentType !== selectedType"
          />
        </v-col>
        <v-col cols="3">
          <VcsTextField
            id="style-shape-scaleY"
            type="number"
            v-model.number="selectedScale.y.value"
            prefix="Y"
            placeholder="1"
            :disabled="currentType !== selectedType"
          />
        </v-col>
      </v-row>
      <VcsStrokeMenu
        v-if="selectedType === ImageType.SHAPE"
        v-model="selectedStroke"
        :value-default="valueDefault?.stroke"
        :disabled="!value || currentType !== ImageType.SHAPE"
      />
      <VcsFillMenu
        v-if="selectedType === ImageType.SHAPE"
        v-model="selectedFill"
        :value-default="valueDefault?.fill"
        :disabled="!value || currentType !== ImageType.SHAPE"
      />
    </v-container>
  </v-sheet>
</template>

<script>
  import { computed, onMounted, ref, watch } from 'vue';
  import { VSheet, VDivider, VContainer, VRow, VCol, VIcon } from 'vuetify/lib';
  import {
    VcsLabel,
    VcsTextField,
    VcsFillMenu,
    VcsStrokeMenu,
    VcsRadioGrid,
    VcsRadio,
    VcsSlider,
  } from '@vcmap/ui';
  import { Circle, Fill, Icon, RegularShape, Stroke, Style } from 'ol/style.js';
  import { toContext } from 'ol/render.js';
  import { Point } from 'ol/geom.js';
  import { useSelectedKey, between } from './composables.js';

  /**
   * @enum {string}
   * @property {string} SHAPE - Regularshape or Circle
   * @property {string} ICON - Raster images
   */
  export const ImageType = {
    SHAPE: 'shape',
    ICON: 'icon',
  };

  /**
   * Draws an image style on a canvas.
   * @param {HTMLCanvasElement} canvas The canvas to draw on
   * @param {import("ol/style/Image").Options} imageOptions The JSON options of the image style.
   * @param {boolean} fitToCanvas If the circle, shape or icon should be fitted into the canvas or if it should be draw with it's actual size.
   */
  export async function drawImageStyle(
    canvas,
    imageOptions,
    fitToCanvas = false,
  ) {
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (!imageOptions?.radius && !imageOptions?.src) {
      return;
    }
    const vectorContext = toContext(context, { pixelRatio: 1 });
    let imageStyle;
    let size;
    if (imageOptions.radius) {
      // TODO: Replace with getImageStyleFromOptions from styleHelpers.ts in @vcmap/core
      const { radius } = imageOptions;
      size = [radius * 2, radius * 2];
      const options = {
        stroke: new Stroke(
          imageOptions.stroke
            ? {
                color: imageOptions.stroke.color,
                width: imageOptions.stroke.width,
              }
            : null,
        ),
        fill: new Fill(
          imageOptions.fill
            ? {
                color: imageOptions.fill.color,
              }
            : null,
        ),
        radius,
      };
      if (imageOptions.points) {
        options.radius2 = imageOptions.radius2;
        options.angle = imageOptions.angle;
        options.points = imageOptions.points;
        options.rotation = imageOptions.rotation;
        options.scale = imageOptions.scale;
        imageStyle = new RegularShape(options);
      } else {
        imageStyle = new Circle(options);
      }
    } else if (imageOptions.src) {
      // Somehow the icon does not load the img when providing the src. And icon.load() is not async.
      // Therefore the img first has to be loaded and then passed to new Icon
      const img = new Image();
      img.src = imageOptions.src;
      await img.decode();
      imageStyle = new Icon({
        img,
        imgSize: [img.width, img.height],
        opacity: imageOptions.opacity,
        scale: imageOptions.scale,
      });
      size = [img.width, img.height];
    }
    if (fitToCanvas) {
      const paddingShare = 1.5;
      let oldScale;
      if (imageOptions.scale) {
        oldScale = Array.isArray(imageOptions.scale)
          ? imageOptions.scale
          : [imageOptions.scale, imageOptions.scale];
      } else {
        oldScale = [1, 1];
      }
      const smallerRatio = Math.min(
        canvas.width / paddingShare / (size[0] * oldScale[0]),
        canvas.height / paddingShare / (size[1] * oldScale[1]),
      );
      const newScale = oldScale.map((dimension) => dimension * smallerRatio);
      imageStyle.setScale(newScale);
    }
    vectorContext.setStyle(new Style({ image: imageStyle }));
    vectorContext.drawGeometry(
      new Point([canvas.width / 2, canvas.height / 2]),
    );
  }

  /**
   * Compares two regular shapes based on points, radius2, angle, rotation and scale.
   * @param {import('ol/style/RegularShape').Options} shape1 A ol regular shape.
   * @param {import('ol/style/RegularShape').Options} shape2 Another ol regular shape.
   * @returns {boolean} If shapes are equal.
   */
  function isEqualShape(shape1, shape2) {
    return (
      ((!shape1.points && !shape2.points) || shape1.points === shape2.points) &&
      shape1.radius2 === shape2.radius2 &&
      ((!shape1.angle && !shape2.angle) || shape1.angle === shape2.angle) &&
      ((!shape1.rotation && !shape2.rotation) ||
        shape1.rotation === shape2.rotation) &&
      ((!shape1.scale && !shape2.scale) ||
        shape1.scale === shape2.scale ||
        (Array.isArray(shape1.scale) &&
          Array.isArray(shape2.scale) &&
          shape1.scale.every((value, index) => value === shape2.scale[index])))
    );
  }

  /** Presets for different shapes with a matching mdi icon as src. */
  export const defaultShapes = [
    {
      src: 'mdi-circle-outline',
      value: { radius: 10 },
    },
    {
      src: 'mdi-square-outline',
      value: { points: 4, radius: 10, angle: Math.PI / 4 },
    },
    {
      src: 'mdi-rectangle-outline',
      value: {
        radius: 10 / Math.SQRT2,
        radius2: 10,
        points: 4,
        angle: 0,
        scale: [1, 0.5],
      },
    },
    {
      src: 'mdi-triangle-outline',
      value: {
        points: 3,
        radius: 10,
        angle: 0,
      },
    },
    {
      src: 'mdi-star-outline',
      value: {
        points: 5,
        radius: 10,
        radius2: 4,
        angle: 0,
      },
    },
    {
      src: 'mdi-plus',
      value: {
        points: 4,
        radius: 10,
        radius2: 0,
        angle: 0,
      },
    },
    {
      src: 'mdi-close',
      value: {
        points: 4,
        radius: 10,
        radius2: 0,
        angle: Math.PI / 4,
      },
    },
  ];

  export const defaultIcons = [
    { src: '/assets/style/icon-marker.png', anchor: [0.5, 1] },
    { src: '/assets/style/icon-marker-blue.png', anchor: [0.5, 1] },
    { src: '/assets/style/icon-marker-green.png', anchor: [0.5, 1] },
    { src: '/assets/style/icon-marker-red.png', anchor: [0.5, 1] },
    { src: '/assets/style/icon-marker-o.png', anchor: [0.5, 1] },
    { src: '/assets/style/icon-marker-o-blue.png', anchor: [0.5, 1] },
    { src: '/assets/style/icon-marker-o-green.png', anchor: [0.5, 1] },
    { src: '/assets/style/icon-marker-o-red.png', anchor: [0.5, 1] },
    { src: '/assets/style/icon-pin.png', anchor: [0.5, 1] },
    { src: '/assets/style/icon-pin-blue.png', anchor: [0.5, 1] },
    { src: '/assets/style/icon-pin-green.png', anchor: [0.5, 1] },
    { src: '/assets/style/icon-pin-red.png', anchor: [0.5, 1] },
  ];

  /**
   * @description Allows to model a JSON representation of ol/style/Image style. It makes use of VcsStrokeMenu and VcsFillMenu.
   * @vue-prop {import("ol/style/RegularShape").Options | import("ol/style/Circle").Options | import("ol/style/Icon").Options} value - The Image options
   * @vue-prop {import("ol/style/RegularShape").Options | import("ol/style/Circle").Options | import("ol/style/Icon").Options} valueDefault - The default image options
   * @vue-prop {Array<import("ol/style/Icon").Options>} [iconOptions] - The icon options too choose from. Scale and opacity are ignored. The defaults are 3 different shapes with 4 different colors.
   * @vue-prop {boolean} [extendedShapeSettings=false] - If true, there are all the input fields needed to create arbitrary ol RegularShapes.
   */
  export default {
    name: 'VcsImageSelector',
    components: {
      VSheet,
      VDivider,
      VContainer,
      VRow,
      VCol,
      VIcon,
      VcsRadio,
      VcsLabel,
      VcsTextField,
      VcsFillMenu,
      VcsStrokeMenu,
      VcsRadioGrid,
      VcsSlider,
    },
    props: {
      value: {
        type: Object,
        default: undefined,
      },
      valueDefault: {
        type: Object,
        default: undefined,
      },
      extendedShapeSettings: {
        type: Boolean,
        default: false,
      },
      iconOptions: {
        type: Array,
        default: () => defaultIcons,
      },
    },
    setup(props, { emit }) {
      const currentType = computed(() => {
        if (props.value?.radius) {
          return ImageType.SHAPE;
        } else if (props.value?.src) {
          return ImageType.ICON;
        } else {
          return undefined;
        }
      });

      const selectedType = ref(currentType.value);

      const customIcon = 'mdi-dots-horizontal';

      const canvas = ref();

      const shapeSingleValueInputs = computed(() => {
        const inputs = [
          { name: 'radius', unit: 'px', range: [1, 100], isRequired: true },
        ];
        if (props.extendedShapeSettings) {
          [
            { name: 'points', range: [0, 10] },
            { name: 'radius2', unit: 'px', range: [0, 100] },
            { name: 'angle', step: 0.1, unit: 'rad' },
            { name: 'rotation', step: 0.1, unit: 'rad' },
          ].forEach((entry) => inputs.push(entry));
        }
        return inputs.map((input) => {
          return {
            text: input.name,
            value: useSelectedKey(
              () => props.value,
              input.name,
              props.valueDefault[input.name],
              emit,
              input.range,
              input.isRequired,
            ),
            unit: input.unit,
            range: input.range,
            step: input.step,
          };
        });
      });

      // reduces the array to an object with x and y as keys and computed properties with a getter and setter as values.
      const selectedScale = ['x', 'y'].reduce(
        (acc, dimension, index, array) => {
          return {
            ...acc,
            [dimension]: computed({
              get() {
                if (Array.isArray(props.value?.scale)) {
                  return props.value.scale[index];
                } else {
                  return props.value.scale;
                }
              },
              set(value) {
                let newValue = value;
                if (!value || value < 0) {
                  newValue = 1;
                }
                const otherDimension = array[1 - index];
                let newScale;
                if (newValue !== selectedScale[otherDimension]) {
                  newScale = [];
                  newScale[index] = newValue;
                  newScale[1 - index] =
                    selectedScale[otherDimension].value || 1;
                } else {
                  newScale = newValue;
                }
                const newImage = JSON.parse(JSON.stringify(props.value));
                emit('input', Object.assign(newImage, { scale: newScale }));
              },
            }),
          };
        },
        {},
      );

      const selectedOpacity = useSelectedKey(
        () => props.value,
        'opacity',
        props.valueDefault.opacity,
        emit,
      );

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

      const selectedImage = computed({
        get() {
          if (currentType.value !== selectedType.value) {
            return undefined;
          } else if (currentType.value === ImageType.SHAPE) {
            const equalShape = defaultShapes.find((preset) =>
              isEqualShape(props.value, preset.value),
            );
            if (equalShape) {
              return equalShape.src;
            } else {
              return customIcon;
            }
          } else if (currentType.value === ImageType.ICON) {
            return props.value?.src;
          } else {
            return undefined;
          }
        },
        set(value) {
          let newImage = {};
          if (selectedType.value === ImageType.SHAPE) {
            const switchFromICON = currentType.value === ImageType.ICON;
            let newPreset;
            if (value === customIcon && !switchFromICON) {
              return;
            } else if (value === customIcon) {
              newPreset = defaultShapes[0];
            } else {
              newPreset = defaultShapes.find((preset) => preset.src === value);
            }

            if (newPreset) {
              let fill;
              let stroke;

              if (switchFromICON) {
                fill = props.valueDefault?.fill;
                stroke = props.valueDefault?.stroke;
              } else {
                fill = selectedFill.value;
                stroke = selectedStroke.value;
              }
              newImage = JSON.parse(JSON.stringify(newPreset.value));
              Object.assign(newImage, {
                fill,
                stroke,
              });
            }
          } else if (selectedType.value === ImageType.ICON) {
            newImage = props.iconOptions.find((option) => option.src === value);
            Object.assign(newImage, {
              scale: selectedScale.value || 1,
              opacity: selectedOpacity.value || 1,
            });
          }
          emit('input', JSON.parse(JSON.stringify(newImage)));
        },
      });

      const currentItems = computed(() => {
        let items = [];
        if (selectedType.value === ImageType.SHAPE) {
          items = [...defaultShapes];
          if (props.extendedShapeSettings) {
            items.push({ src: customIcon });
          }
        } else if (selectedType.value === ImageType.ICON) {
          items = props.iconOptions;
        }
        return items;
      });

      onMounted(() => {
        drawImageStyle(canvas.value, props.value);
        watch(
          () => props.value,
          () => {
            drawImageStyle(canvas.value, props.value);
          },
          { deep: true },
        );
      });

      return {
        ImageType,
        selectedType,
        currentType,
        selectedImage,
        canvas,
        shapeSingleValueInputs,
        selectedScale,
        selectedOpacity,
        selectedFill,
        selectedStroke,
        between,
        currentItems,
      };
    },
  };
</script>
