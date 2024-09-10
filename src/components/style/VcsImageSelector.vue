<template>
  <v-sheet class="vcs-image-selector">
    <v-container class="px-1 py-0">
      <v-row no-gutters>
        <v-col class="d-flex justify-center py-1">
          <canvas ref="canvas" width="50" height="50" />
        </v-col>
      </v-row>
    </v-container>
    <v-divider />
    <div class="px-1">
      <v-tabs v-model="selectedImageTypeTab" height="40" align-tabs="center">
        <v-tab
          v-for="item in Object.values(ImageType).map((value) => ({
            value,
            label: `components.style.${value}`,
          }))"
          :key="item.value"
          light
        >
          {{ $st(item.label) }}
        </v-tab>
      </v-tabs>
    </div>
    <v-divider />
    <v-container class="px-1 pt-1 pb-0">
      <VcsRadio
        v-model="selectedIdx"
        :items="currentItems"
        :disabled="!modelValue"
        item-value="idx"
        label-position="top"
        inline
        class="d-flex justify-center"
      >
        <template #label="{ item }">
          <img
            v-if="selectedType !== ImageType.SHAPE"
            :src="item.src"
            alt="shape"
          />
          <v-icon v-else size="24">{{ item.src }}</v-icon>
        </template>
      </VcsRadio>
      <div v-if="selectedType === ImageType.ICON">
        <v-row no-gutters>
          <v-col>
            <VcsLabel :html-for="`${cid}-style-icon-opacity`">
              {{ $t('components.style.opacity') }}
            </VcsLabel>
          </v-col>
          <v-col>
            <VcsSlider
              :id="`${cid}-style-icon-opacity`"
              v-model="localValue.opacity"
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
          :key="input.key"
        >
          <v-col>
            <VcsLabel :html-for="`${cid}-${input.key}`">{{
              $st(`components.style.${input.key}`)
            }}</VcsLabel>
          </v-col>
          <v-col cols="3">
            <VcsTextField
              :id="`${cid}-${input.key}`"
              :hide-spin-buttons="true"
              type="number"
              :unit="input.unit || ''"
              v-model.number="localValue[input.key]"
              :disabled="currentType !== ImageType.SHAPE"
              :step="input.step || 1"
              :min="input.range?.[0] || 0"
              :max="input.range?.[1] || undefined"
              :rules="[
                (v) =>
                  !input.isRequired || !!v || 'components.validation.required',
                (v) =>
                  !input.range ||
                  (!input.isRequired && !v) ||
                  between(v, input.range) ||
                  `${$st(
                    'components.validation.allowedRange',
                  )}: ${input.range.join(' - ')}`,
              ]"
            />
          </v-col>
        </v-row>
      </div>
      <v-row
        no-gutters
        v-if="extendedShapeSettings || selectedType === ImageType.ICON"
      >
        <v-col>
          <VcsLabel :html-for="`${cid}-style-shape-scale`">{{
            $t('components.style.scale')
          }}</VcsLabel>
        </v-col>
        <v-col cols="3">
          <VcsTextField
            :id="`${cid}-style-shape-scale`"
            :hide-spin-buttons="true"
            type="number"
            v-model.number="selectedScale"
            placeholder="1"
            :disabled="currentType !== selectedType"
            :rules="[(v) => !v || v > 0 || 'components.validation.notValid']"
          />
        </v-col>
      </v-row>
      <VcsStrokeMenu
        v-if="selectedType === ImageType.SHAPE"
        v-model="localValue.stroke"
        :value-default="valueDefault?.stroke"
        :disabled="!localValue || currentType !== ImageType.SHAPE"
      />
      <VcsFillMenu
        v-if="selectedType === ImageType.SHAPE"
        v-model="localValue.fill"
        :value-default="valueDefault?.fill"
        :disabled="!localValue || currentType !== ImageType.SHAPE"
      />
    </v-container>
  </v-sheet>
</template>

<script>
  import { computed, onMounted, ref, toRaw, watch } from 'vue';
  import {
    VSheet,
    VDivider,
    VContainer,
    VRow,
    VCol,
    VIcon,
    VTabs,
    VTab,
  } from 'vuetify/components';
  import { Icon, Style } from 'ol/style.js';
  import { toContext } from 'ol/render.js';
  import { Point } from 'ol/geom.js';
  import { getImageStyleFromOptions } from '@vcmap/core';
  import { useComponentId } from '../composables.js';
  import { useProxiedComplexModel } from '../modelHelper.js';
  import VcsLabel from '../form-inputs-controls/VcsLabel.vue';
  import VcsTextField from '../form-inputs-controls/VcsTextField.vue';
  import VcsSlider from '../form-inputs-controls/VcsSlider.vue';
  import VcsRadio from '../form-inputs-controls/VcsRadio.vue';
  import VcsFillMenu from './VcsFillMenu.vue';
  import VcsStrokeMenu from './VcsStrokeMenu.vue';
  import { between } from './composables.js';

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
   * @param {import("ol/style/Image").Options} [imageOptions] The JSON options of the image style.
   * @param {boolean} [fitToCanvas=false] If the circle, shape or icon should be fitted into the canvas or if it should be draw with it's actual size.
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
      const { radius } = imageOptions;
      size = [radius * 2, radius * 2];
      imageStyle = getImageStyleFromOptions(imageOptions);
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
        (!shape1.scale && shape2.scale === 1) ||
        (shape1.scale === 1 && !shape2.scale) ||
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
    {
      src:
        'data:image/png;base64,\n' +
        '\tiVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAGXRFWHRTb2Z0\n' +
        '\td2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyZpVFh0WE1MOmNvbS5hZG9i\n' +
        '\tZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2Vo\n' +
        '\taUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6\n' +
        '\tbnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMTM4IDc5\n' +
        '\tLjE1OTgyNCwgMjAxNi8wOS8xNC0wMTowOTowMSAgICAgICAgIj4gPHJkZjpS\n' +
        '\tREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJk\n' +
        '\tZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIg\n' +
        '\teG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8i\n' +
        '\tIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5\n' +
        '\tcGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5j\n' +
        '\tb20veGFwLzEuMC8iIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6REZBQjBG\n' +
        '\tMDI4RkU5MTFFODgxNzE5MzcwRDZGMTVERUMiIHhtcE1NOkluc3RhbmNlSUQ9\n' +
        '\tInhtcC5paWQ6REZBQjBGMDE4RkU5MTFFODgxNzE5MzcwRDZGMTVERUMiIHht\n' +
        '\tcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTcgKFdpbmRv\n' +
        '\td3MpIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9Inht\n' +
        '\tcC5paWQ6RDhGNEI0QzE4RkU3MTFFOEJGMUZGOTFEQTdGNEQzQUUiIHN0UmVm\n' +
        '\tOmRvY3VtZW50SUQ9InhtcC5kaWQ6RDhGNEI0QzI4RkU3MTFFOEJGMUZGOTFE\n' +
        '\tQTdGNEQzQUUiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94\n' +
        '\tOnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz6filTDAAABN0lEQVR42tRX\n' +
        '\tUQ2EMAylONhJ4CScBSxgAQtn4ZBwWEACSDgkDAkgYdcl44cM1m7lyDV5CVmy\n' +
        '\t9bVl6ysYY7IUA4DSfY541sI+wBLgAE0hnghtt29g196Ignwe07l1PHsc+/AS\n' +
        '\tJeAiM0x8bMaSCUQ6X9EnEUCrEpwHy0EhoAUImL0fMw9csdpuzGSs9i3mgU1l\n' +
        '\tJmcV+x0QTP8KxSqBYPpXe3BLcLr9msDEJTAIOl+w5pcS6GJugWI0H/mHyPX3\n' +
        '\tRiD6wZd+kh4QykL5v93QESgSCFRXChItqYhislBLa8JeMnpKM9oa50q2Z8ly\n' +
        '\tShbmkBiNzQA1soY6pEDMZIRSTQe0wo1KILYdH/0LLWdEg9jZ8CAL9913X1iQ\n' +
        '\ttDvRT6xTuLdg06Q0peUeAVLGcyxD4fS+ctGP3DO+AgwAwCtOZisWJOkAAAAA\n' +
        '\tSUVORK5CYII=',
      anchor: [0.5, 1],
    },
    {
      src:
        'data:image/png;base64,\n' +
        '\tiVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAGXRFWHRTb2Z0\n' +
        '\td2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA25pVFh0WE1MOmNvbS5hZG9i\n' +
        '\tZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2Vo\n' +
        '\taUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6\n' +
        '\tbnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMTM4IDc5\n' +
        '\tLjE1OTgyNCwgMjAxNi8wOS8xNC0wMTowOTowMSAgICAgICAgIj4gPHJkZjpS\n' +
        '\tREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJk\n' +
        '\tZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIg\n' +
        '\teG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8i\n' +
        '\tIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5\n' +
        '\tcGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5j\n' +
        '\tb20veGFwLzEuMC8iIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRp\n' +
        '\tZDpmY2VmM2JkNy1mNDZjLWQ4NDYtOWE2MC0wMTMzYmJhYThjOGEiIHhtcE1N\n' +
        '\tOkRvY3VtZW50SUQ9InhtcC5kaWQ6RjlCRkIzQjg4RkU5MTFFOEIxOENCQzI2\n' +
        '\tNDc2RjFCMjYiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6RjlCRkIzQjc4\n' +
        '\tRkU5MTFFOEIxOENCQzI2NDc2RjFCMjYiIHhtcDpDcmVhdG9yVG9vbD0iQWRv\n' +
        '\tYmUgUGhvdG9zaG9wIENDIDIwMTcgKFdpbmRvd3MpIj4gPHhtcE1NOkRlcml2\n' +
        '\tZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6NEVENjY5NzM4RkU5\n' +
        '\tMTFFOEIzQkFGQzMxMzgxODkyNzEiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5k\n' +
        '\taWQ6NEVENjY5NzQ4RkU5MTFFOEIzQkFGQzMxMzgxODkyNzEiLz4gPC9yZGY6\n' +
        '\tRGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tl\n' +
        '\tdCBlbmQ9InIiPz4rPhCsAAABQUlEQVR42ryXaw2DMBCAyxxgoZPAJDAJWGAS\n' +
        '\tmAQqgUoYEoaEYaEWkMCuye3PAk3vAZdcIIFy3z1Li3VdjURuj7nG2/kzVAt1\n' +
        '\tfUEFAIMlXFpU+/c4gE6gDmCCOgAY7+AStcx4PUI81QDA+IBeU2QGvadScznQ\n' +
        '\teJQK9JV64ZJhvGEa/0kN3+glEeiNXDqAsGQAWLRV6VxpORGojZ40HIBKEcDi\n' +
        '\tDCEBWKMrFasNj5SzAQIVYFI0vmztD2cCjJwU+EiuBODIALiJOAXj0972nFOE\n' +
        '\tGlFw7C7AKIxC7ydpG0rS4MVzAPPnOX0Pa0etQeQ0c8/9J3wTdsjo/VV7FDut\n' +
        '\t3LMAsJpzpuNyCADBM5d7SCEDYFUHjfBLtuNULXjKEY0FAAZ8IgqkdpX8kPgd\n' +
        '\t78OZAEE6rArJ8RwPGy0eVqP3M/UbXwEGANa/e+JB0cY9AAAAAElFTkSuQmCC\n',
      anchor: [0.5, 1],
    },
    {
      src:
        'data:image/png;base64,\n' +
        '\tiVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAGXRFWHRTb2Z0\n' +
        '\td2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA25pVFh0WE1MOmNvbS5hZG9i\n' +
        '\tZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2Vo\n' +
        '\taUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6\n' +
        '\tbnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMTM4IDc5\n' +
        '\tLjE1OTgyNCwgMjAxNi8wOS8xNC0wMTowOTowMSAgICAgICAgIj4gPHJkZjpS\n' +
        '\tREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJk\n' +
        '\tZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIg\n' +
        '\teG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8i\n' +
        '\tIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5\n' +
        '\tcGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5j\n' +
        '\tb20veGFwLzEuMC8iIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRp\n' +
        '\tZDpmY2VmM2JkNy1mNDZjLWQ4NDYtOWE2MC0wMTMzYmJhYThjOGEiIHhtcE1N\n' +
        '\tOkRvY3VtZW50SUQ9InhtcC5kaWQ6MjBDNERCNDU4RkVBMTFFODg5QTRDNzM1\n' +
        '\tOTY3QzkwQzIiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6MjBDNERCNDQ4\n' +
        '\tRkVBMTFFODg5QTRDNzM1OTY3QzkwQzIiIHhtcDpDcmVhdG9yVG9vbD0iQWRv\n' +
        '\tYmUgUGhvdG9zaG9wIENDIDIwMTcgKFdpbmRvd3MpIj4gPHhtcE1NOkRlcml2\n' +
        '\tZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6MDkwMzYwMDg4RkU5\n' +
        '\tMTFFOEE3OTZENkFDQzUyM0IyNkYiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5k\n' +
        '\taWQ6MDkwMzYwMDk4RkU5MTFFOEE3OTZENkFDQzUyM0IyNkYiLz4gPC9yZGY6\n' +
        '\tRGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tl\n' +
        '\tdCBlbmQ9InIiPz5GlR2BAAABQUlEQVR42ryXaw2DMBCAYQ6wwCQwCUwCFjoJ\n' +
        '\tTAKVQCUMCauEYaEWkMCuye3PAk3vAZdcIIFy3z1Ly3VdC4k83K3F23k0n4W6\n' +
        '\tvqQCgMEKLga1/nscQD2oBZigDgDGe7hErTJejxBPNQAwPqLXFJlB76nUXA40\n' +
        '\tHqUBfaVeuGQY75jGf9LCNwZJBIZCLj1A1GQAWLRV6VwxnAi0hZ50HIBGEaDG\n' +
        '\tGUICqAtdaVhteKScDRCoAF7R+LK1P5wJMHFS4CK5EoAlA+AmYhWM+73tOacI\n' +
        '\tNaJg2V2AUZiE3ntpG0rS4MRzAPPnOH0PayetQWQ1c8/9J3wTdsjo/VV7FFut\n' +
        '\t3LMAsJpzpuNyCADBM5t7SCEDYFUHjfBLtuNULTjKEY0FAAZcIgqkdpX8kLgd\n' +
        '\t78OZAEE6rErJ8RwPGwYPq9H7mfqNrwADAD2jfUcwqlG4AAAAAElFTkSuQmCC',
      anchor: [0.5, 1],
    },
    {
      src:
        'data:image/png;base64,\n' +
        '\tiVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAGXRFWHRTb2Z0\n' +
        '\td2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA25pVFh0WE1MOmNvbS5hZG9i\n' +
        '\tZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2Vo\n' +
        '\taUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6\n' +
        '\tbnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMTM4IDc5\n' +
        '\tLjE1OTgyNCwgMjAxNi8wOS8xNC0wMTowOTowMSAgICAgICAgIj4gPHJkZjpS\n' +
        '\tREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJk\n' +
        '\tZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIg\n' +
        '\teG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8i\n' +
        '\tIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5\n' +
        '\tcGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5j\n' +
        '\tb20veGFwLzEuMC8iIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRp\n' +
        '\tZDpmY2VmM2JkNy1mNDZjLWQ4NDYtOWE2MC0wMTMzYmJhYThjOGEiIHhtcE1N\n' +
        '\tOkRvY3VtZW50SUQ9InhtcC5kaWQ6M0VGRTVFRkQ4RkVBMTFFOEE1MTdDRjMx\n' +
        '\tNEE1MEQyRTciIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6M0VGRTVFRkM4\n' +
        '\tRkVBMTFFOEE1MTdDRjMxNEE1MEQyRTciIHhtcDpDcmVhdG9yVG9vbD0iQWRv\n' +
        '\tYmUgUGhvdG9zaG9wIENDIDIwMTcgKFdpbmRvd3MpIj4gPHhtcE1NOkRlcml2\n' +
        '\tZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6NDA0NEM4QkE4RkU4\n' +
        '\tMTFFODkzNzFCNTI0RThGQTMzMzkiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5k\n' +
        '\taWQ6NDA0NEM4QkI4RkU4MTFFODkzNzFCNTI0RThGQTMzMzkiLz4gPC9yZGY6\n' +
        '\tRGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tl\n' +
        '\tdCBlbmQ9InIiPz5ZzxzyAAABT0lEQVR42rxX3Q2CQAzm2ABHgAcHYAUcgRVc\n' +
        '\tQUfwRvBGkBFkBQbwgVuBEc5eUl+MYP+0SQMJ3PXrf+tSSoWGHs51+DrtU1q4\n' +
        '\t5x0XAAis4HFErt8+R+AR2AOYaA4AhJ/gkbki/J5BnM0AgPAras2hCfiw5Zry\n' +
        '\th8IztcC3rR9KgvBeKPxFHdxxEbsADs8fgk1CzafALL8IPxoJL9as+M0FXWFH\n' +
        '\tvQRAawigxhrCAlAXttSK0vCX9G8AkQtgNBS+sNPQGMDALkQYtTOx+dgXImwi\n' +
        '\t3kD4uNaeKUEYsv+UALw4C9AKg1L7UZuGGjcEdR1A/wVJ3sPZwaoQeUvfS2fC\n' +
        '\tO6NDZu0b61LsrXyvGcspVliw8CzWFqBq5qlLipNsRoQ5cUcFIG3HW7EQOCua\n' +
        '\tk+6GG1ZoqGuZdiAJK9pHziVaAFFbrJxmPQc31DjvV6j9xL3jKcAAZOmXB5HK\n' +
        '\tuJoAAAAASUVORK5CYII=',
      anchor: [0.5, 1],
    },
    {
      src:
        'data:image/png;base64,\n' +
        '\tiVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAGXRFWHRTb2Z0\n' +
        '\td2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyZpVFh0WE1MOmNvbS5hZG9i\n' +
        '\tZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2Vo\n' +
        '\taUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6\n' +
        '\tbnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMTM4IDc5\n' +
        '\tLjE1OTgyNCwgMjAxNi8wOS8xNC0wMTowOTowMSAgICAgICAgIj4gPHJkZjpS\n' +
        '\tREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJk\n' +
        '\tZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIg\n' +
        '\teG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxu\n' +
        '\tczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1s\n' +
        '\tbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9S\n' +
        '\tZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9w\n' +
        '\tIENDIDIwMTcgKFdpbmRvd3MpIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlk\n' +
        '\tOkQ4RjRCNEMxOEZFNzExRThCRjFGRjkxREE3RjREM0FFIiB4bXBNTTpEb2N1\n' +
        '\tbWVudElEPSJ4bXAuZGlkOkQ4RjRCNEMyOEZFNzExRThCRjFGRjkxREE3RjRE\n' +
        '\tM0FFIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9Inht\n' +
        '\tcC5paWQ6RDhGNEI0QkY4RkU3MTFFOEJGMUZGOTFEQTdGNEQzQUUiIHN0UmVm\n' +
        '\tOmRvY3VtZW50SUQ9InhtcC5kaWQ6RDhGNEI0QzA4RkU3MTFFOEJGMUZGOTFE\n' +
        '\tQTdGNEQzQUUiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94\n' +
        '\tOnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz78lwA2AAABYElEQVR42tRX\n' +
        '\tgQ2DIBAsbmBHoCOwgiu4giu4go6gI3QFO0IdAUfQEeyT0KShIP8PjeknnxgE\n' +
        '\t/v55uH+x7/slRYQQlf2cYa+NvIEBQFGQErQF1Wa5o2ZsAJXo/YjGjeHVY9in\n' +
        '\tXVYA1rOdqE8TsWQATONvnZIAgNQJxqPHgQGgQ54ZcB/zVCRSkgwApAlsNjDW\n' +
        '\tdBwAd99VQ0QNvY4T/hYBQAWi8HUjisg7JT1jM+JxC81R7kBxOVk4ACSCH1Tg\n' +
        '\t10IF8PCM1QiQvjkbHM1CIiP79vuSqWEk4MC5BeUB+bRuVkfISnJfwjb21ltd\n' +
        '\tOXyA5f81kQuq/2VDC0AmAKjPLEh0zoqIE4Umd0045fQeQ0au9IS546/KckwU\n' +
        '\t1lgxyo0A1rMe26QITmcEbKcjrHjFAuDWA0e5MFJaNMHtDQ+icPPSbuYIhHJh\n' +
        '\tpBhn3QKHpDSGco9UpLTncAzS9gGl9X6m7vESYAA78GCrrWW+LwAAAABJRU5E\n' +
        '\trkJggg==',
      anchor: [0.5, 1],
    },
    {
      src:
        'data:image/png;base64,\n' +
        '\tiVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAGXRFWHRTb2Z0\n' +
        '\td2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA3ZpVFh0WE1MOmNvbS5hZG9i\n' +
        '\tZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2Vo\n' +
        '\taUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6\n' +
        '\tbnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMTM4IDc5\n' +
        '\tLjE1OTgyNCwgMjAxNi8wOS8xNC0wMTowOTowMSAgICAgICAgIj4gPHJkZjpS\n' +
        '\tREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJk\n' +
        '\tZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIg\n' +
        '\teG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8i\n' +
        '\tIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5\n' +
        '\tcGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5j\n' +
        '\tb20veGFwLzEuMC8iIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRp\n' +
        '\tZDpmY2VmM2JkNy1mNDZjLWQ4NDYtOWE2MC0wMTMzYmJhYThjOGEiIHhtcE1N\n' +
        '\tOkRvY3VtZW50SUQ9InhtcC5kaWQ6NEVENjY5NzQ4RkU5MTFFOEIzQkFGQzMx\n' +
        '\tMzgxODkyNzEiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6NEVENjY5NzM4\n' +
        '\tRkU5MTFFOEIzQkFGQzMxMzgxODkyNzEiIHhtcDpDcmVhdG9yVG9vbD0iQWRv\n' +
        '\tYmUgUGhvdG9zaG9wIENDIDIwMTcgKFdpbmRvd3MpIj4gPHhtcE1NOkRlcml2\n' +
        '\tZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6ZmNlZjNiZDctZjQ2\n' +
        '\tYy1kODQ2LTlhNjAtMDEzM2JiYWE4YzhhIiBzdFJlZjpkb2N1bWVudElEPSJ4\n' +
        '\tbXAuZGlkOmZjZWYzYmQ3LWY0NmMtZDg0Ni05YTYwLTAxMzNiYmFhOGM4YSIv\n' +
        '\tPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4g\n' +
        '\tPD94cGFja2V0IGVuZD0iciI/Pif0jb4AAAGTSURBVHjaxFcLjcMwDF3LYBRy\n' +
        '\tEHIQMgg7CBuEDsIKoYFwhbBAuFIIhULo2ZJPOk1JajvZnSWrVZ3Uz45/6bZt\n' +
        '\tO9TQ+3Vx9Lp8TXaV7u+kAEDhER4XYvMkjsABeAQwsTkAUD7AA/nIWI4gbs0A\n' +
        '\tgPKJrJbQAnwqHU3/QuVIFviztKBnKD8rlf+Qg3/cazyQ24zB9gHu7ZARK7DP\n' +
        '\trB0AhBHHAGxCy6eEyIPSq3BPMij3POAS32JOORLI0AtzQnTWHIFNWc9JwcQ3\n' +
        '\tQzVEBMBkUqtI4IWFa1B/+GfSADCM1LUZUZQCCNxgYqxZU/1BA8BRqpWsHxKi\n' +
        '\tWXMEGPGpOj5hY3qOampWD0Fm7Dcj+umd4SVb6JIB3H/SBmHOC7+Lldtp0aM6\n' +
        '\tC6iVzhWZhtaH2jQcKwD46jpA6eMVyrFvzK0KkcYLu3ukM+Ej0yFz1r+1LsVj\n' +
        '\tq7NXAaBoDoyl60sASOYB7iVFDICiOrZwf808UIoFL7miqQDQ3BdbpGvNROQz\n' +
        '\t1se/BBBri1VXcz2ny8aFOqEvDKNZ+hZgAAJLphKx1dJTAAAAAElFTkSuQmCC',
      anchor: [0.5, 1],
    },
    {
      src:
        'data:image/png;base64,\n' +
        '\tiVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAGXRFWHRTb2Z0\n' +
        '\td2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA3ZpVFh0WE1MOmNvbS5hZG9i\n' +
        '\tZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2Vo\n' +
        '\taUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6\n' +
        '\tbnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMTM4IDc5\n' +
        '\tLjE1OTgyNCwgMjAxNi8wOS8xNC0wMTowOTowMSAgICAgICAgIj4gPHJkZjpS\n' +
        '\tREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJk\n' +
        '\tZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIg\n' +
        '\teG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8i\n' +
        '\tIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5\n' +
        '\tcGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5j\n' +
        '\tb20veGFwLzEuMC8iIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRp\n' +
        '\tZDpmY2VmM2JkNy1mNDZjLWQ4NDYtOWE2MC0wMTMzYmJhYThjOGEiIHhtcE1N\n' +
        '\tOkRvY3VtZW50SUQ9InhtcC5kaWQ6MDkwMzYwMDk4RkU5MTFFOEE3OTZENkFD\n' +
        '\tQzUyM0IyNkYiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6MDkwMzYwMDg4\n' +
        '\tRkU5MTFFOEE3OTZENkFDQzUyM0IyNkYiIHhtcDpDcmVhdG9yVG9vbD0iQWRv\n' +
        '\tYmUgUGhvdG9zaG9wIENDIDIwMTcgKFdpbmRvd3MpIj4gPHhtcE1NOkRlcml2\n' +
        '\tZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6ZmNlZjNiZDctZjQ2\n' +
        '\tYy1kODQ2LTlhNjAtMDEzM2JiYWE4YzhhIiBzdFJlZjpkb2N1bWVudElEPSJ4\n' +
        '\tbXAuZGlkOmZjZWYzYmQ3LWY0NmMtZDg0Ni05YTYwLTAxMzNiYmFhOGM4YSIv\n' +
        '\tPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4g\n' +
        '\tPD94cGFja2V0IGVuZD0iciI/Ptb/bswAAAGUSURBVHjaxFeLjYMwDC1s0BVy\n' +
        '\tI9AR0hF6I9ARuBHKCGSEY4RmhGOFrMAInC35pFOVhNhOW0sWCCf42fEvzbZt\n' +
        '\tBw1d3cnS6zL1Pyt3f8MFAAqP8OiJzYM4AHvgEcCE6gBA+QAP5GPBcgTxVQ0A\n' +
        '\tKJ/Iag4twOfc0bRPVI7UAX/nFrQFyi9C5X9k4R83jQdSmzHYPsG9DTK8n4Bd\n' +
        '\tYu0AIAw7BmATWj5FRA6UXpl7okG55wEb+RZSypFAhl6YI6KL5Ai6mPUlKRj5\n' +
        '\tZqiGsACYRGplCbywlBrUHt5MEgCmIHW7hChwAfjSYCpYs8b6gwSApVTLWT9E\n' +
        '\tRLPkCDDiY3V8wsb0GNXUrO6MzNhvRvTTW4GXukyX9OD+szQIU174X6zsTose\n' +
        '\txVlArXRWZBpa77VpOCoAOHUdoPRxAuXYN+ZahUjihd093JnwnuiQKes/apfi\n' +
        '\tsdbZiwBQNPuCpetTAHDmgdJLChsARXWo4X7NPJCLBce5ookA0NwXaqSrZiJy\n' +
        '\tCevDKwEEbbFqNNdzumz01AldZhhN0q8AAwBAV6cRANsTYAAAAABJRU5ErkJg\n' +
        '\tgg==',
      anchor: [0.5, 1],
    },
    {
      src:
        'data:image/png;base64,\n' +
        '\tiVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAGXRFWHRTb2Z0\n' +
        '\td2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA3ZpVFh0WE1MOmNvbS5hZG9i\n' +
        '\tZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2Vo\n' +
        '\taUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6\n' +
        '\tbnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMTM4IDc5\n' +
        '\tLjE1OTgyNCwgMjAxNi8wOS8xNC0wMTowOTowMSAgICAgICAgIj4gPHJkZjpS\n' +
        '\tREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJk\n' +
        '\tZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIg\n' +
        '\teG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8i\n' +
        '\tIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5\n' +
        '\tcGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5j\n' +
        '\tb20veGFwLzEuMC8iIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRp\n' +
        '\tZDpmY2VmM2JkNy1mNDZjLWQ4NDYtOWE2MC0wMTMzYmJhYThjOGEiIHhtcE1N\n' +
        '\tOkRvY3VtZW50SUQ9InhtcC5kaWQ6NDA0NEM4QkI4RkU4MTFFODkzNzFCNTI0\n' +
        '\tRThGQTMzMzkiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6NDA0NEM4QkE4\n' +
        '\tRkU4MTFFODkzNzFCNTI0RThGQTMzMzkiIHhtcDpDcmVhdG9yVG9vbD0iQWRv\n' +
        '\tYmUgUGhvdG9zaG9wIENDIDIwMTcgKFdpbmRvd3MpIj4gPHhtcE1NOkRlcml2\n' +
        '\tZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6ZmNlZjNiZDctZjQ2\n' +
        '\tYy1kODQ2LTlhNjAtMDEzM2JiYWE4YzhhIiBzdFJlZjpkb2N1bWVudElEPSJ4\n' +
        '\tbXAuZGlkOmZjZWYzYmQ3LWY0NmMtZDg0Ni05YTYwLTAxMzNiYmFhOGM4YSIv\n' +
        '\tPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4g\n' +
        '\tPD94cGFja2V0IGVuZD0iciI/Pn14Bk0AAAGmSURBVHjaxFfZbcMwDI28QTqC\n' +
        '\t/dEB3BHcEdIRnBHcEeIRohHqEeIVMkA/ohU8gksCDBAEokxSCkqAsGAdfKJ4\n' +
        '\tunVddzn061xHw+v7ui7a/U4LAATu4dMT10/TAXgGHgFMKA4AhA/wQd4LliOI\n' +
        '\t72IAQPiZbq2hK/Bn6mmqFwpHaoF/UgsqgfCDUfidOjjjlKMBbjMa2xeo1yHD\n' +
        '\t+APYM2sHAFGrAcCmmKUjeRCKbzvdf8AY3fAIwyNzXG/RQBf5F0hQlGAOtTBF\n' +
        '\tpg4WAG3s9hIXjPyrKYaoANSMayUJn0N6oWr3z2QBUAtct2WmghbALDUmwZol\n' +
        '\tlh8sADpyz9Tth8jUZHkCtPhYHD9jYnq2akpWF4VnbCcjOvQk0FKbyJIzBi4r\n' +
        '\tADz0JkzBHGHUnE1eQKl0yhA+c8I1bjhmAPDZcYDcxxuEh8eElRuILFrY3KOt\n' +
        '\tCS9MhuRu35QOxWOpt88pyyVaQM9pJH1CVdqqH0ry5SUaIC3cNrLimxSAtR5I\n' +
        '\t2YLXtGjO2hsmtNBI27Lcisgztw+aQ3IBhNxg5XLac2o2esqUPlGMsvQnwAD9\n' +
        '\tX7oKQxnUUgAAAABJRU5ErkJggg==',
      anchor: [0.5, 1],
    },
    {
      src:
        'data:image/png;base64,\n' +
        '\tiVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAGXRFWHRTb2Z0\n' +
        '\td2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyZpVFh0WE1MOmNvbS5hZG9i\n' +
        '\tZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2Vo\n' +
        '\taUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6\n' +
        '\tbnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMTM4IDc5\n' +
        '\tLjE1OTgyNCwgMjAxNi8wOS8xNC0wMTowOTowMSAgICAgICAgIj4gPHJkZjpS\n' +
        '\tREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJk\n' +
        '\tZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIg\n' +
        '\teG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxu\n' +
        '\tczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1s\n' +
        '\tbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9S\n' +
        '\tZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9w\n' +
        '\tIENDIDIwMTcgKFdpbmRvd3MpIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlk\n' +
        '\tOkFDN0M0MEFGOEZFQTExRTg5QjBDQ0NCMTJDOTk4NkYwIiB4bXBNTTpEb2N1\n' +
        '\tbWVudElEPSJ4bXAuZGlkOkFDN0M0MEIwOEZFQTExRTg5QjBDQ0NCMTJDOTk4\n' +
        '\tNkYwIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9Inht\n' +
        '\tcC5paWQ6QUM3QzQwQUQ4RkVBMTFFODlCMENDQ0IxMkM5OTg2RjAiIHN0UmVm\n' +
        '\tOmRvY3VtZW50SUQ9InhtcC5kaWQ6QUM3QzQwQUU4RkVBMTFFODlCMENDQ0Ix\n' +
        '\tMkM5OTg2RjAiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94\n' +
        '\tOnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz5AejVAAAABI0lEQVR42uyW\n' +
        '\t0Q2DIBCGi+kCrMAKrkBHYAVXYIWu4Ap2hDqCjlBH0BHokfBwIYoc0PrCJX+s\n' +
        '\tMfz3ccr1mDHmdmXcUxYxxlq4SCcbM2gBvWBDG8nMViBWEDbx2y470ArSJE9C\n' +
        '\tcuUSmAhZSF4MwO189RIo96w7gigJ8EHGNqEA9REV0dkA3g6HnWqEtJYAGJCh\n' +
        '\tOPkI96RC/k3EQWnRUePo6MWGCD1sCAabA6CGzAXAlXgmACy5ALO7cvQ6LgFI\n' +
        '\tjTGrFbt3aBI1lWpEfSKALAXAvW4YI136z8hCTCWTkwAQiA60YtslW4ofS52I\n' +
        '\tYCiRXpecycMIsRH50aHf6qzlHm4kowL+wgd4jf+sQJGoABWgAlSAHIDt5P7n\n' +
        '\trVjgiRl8kka3rwADAMwaCzW8j1/1AAAAAElFTkSuQmCC',
      anchor: [0.5, 1],
    },
    {
      src:
        'data:image/png;base64,\n' +
        '\tiVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAGXRFWHRTb2Z0\n' +
        '\td2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA3ZpVFh0WE1MOmNvbS5hZG9i\n' +
        '\tZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2Vo\n' +
        '\taUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6\n' +
        '\tbnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMTM4IDc5\n' +
        '\tLjE1OTgyNCwgMjAxNi8wOS8xNC0wMTowOTowMSAgICAgICAgIj4gPHJkZjpS\n' +
        '\tREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJk\n' +
        '\tZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIg\n' +
        '\teG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8i\n' +
        '\tIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5\n' +
        '\tcGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5j\n' +
        '\tb20veGFwLzEuMC8iIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRp\n' +
        '\tZDozMTcyZmY0Yi1jMGMzLTMzNDQtYjFmNi1mYjU3MGE0YzY5NjgiIHhtcE1N\n' +
        '\tOkRvY3VtZW50SUQ9InhtcC5kaWQ6NjFERDhBOEY4RkVCMTFFOEI5MTlGM0M5\n' +
        '\tREJDQjMzOEYiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6NjFERDhBOEU4\n' +
        '\tRkVCMTFFOEI5MTlGM0M5REJDQjMzOEYiIHhtcDpDcmVhdG9yVG9vbD0iQWRv\n' +
        '\tYmUgUGhvdG9zaG9wIENDIDIwMTcgKFdpbmRvd3MpIj4gPHhtcE1NOkRlcml2\n' +
        '\tZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6MzE3MmZmNGItYzBj\n' +
        '\tMy0zMzQ0LWIxZjYtZmI1NzBhNGM2OTY4IiBzdFJlZjpkb2N1bWVudElEPSJ4\n' +
        '\tbXAuZGlkOjMxNzJmZjRiLWMwYzMtMzM0NC1iMWY2LWZiNTcwYTRjNjk2OCIv\n' +
        '\tPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4g\n' +
        '\tPD94cGFja2V0IGVuZD0iciI/PqiPhDcAAAFCSURBVHja7JZRDYQwDIZv5AzM\n' +
        '\tAhZAwixwEkACSAAJnASwgARmAQmHBK5LStIQOLZ1F15o0gxyt/0fXddVLMvy\n' +
        '\tuNKePpPSQicwKHRjGnwC78c2mV3WEi4RQOGaCG/NiDcA0QQHAPEMhhZcWvx9\n' +
        '\tAH/ZRCNy+HIqvgoIGIudKSZCnc3akWWkOiJeoCsA+yDYnpnfSzYALJLDEONr\n' +
        '\tjwk3gucW21GGiABNuAqTUFpGTmLusAASctTkjxNwZDEXICZHTHqUDRUiCddI\n' +
        '\t1B4AExdAr/tJtuMSAF8buAA9Q1xDsdIsAFjAfMHbE6AKVQmrs73cm4PwfAC8\n' +
        '\tVFKHfKhsb0Th2pBgfS8PasKA4taJK3w7IgBRmyqpXZsR10K0tZw8Z2clN2hL\n' +
        '\tRkQz7nGNHhfbDXAD3AA3AAdgPnn/eylOacfscgNS+wowAAdZZMpg2Of6AAAA\n' +
        '\tAElFTkSuQmCC',
      anchor: [0.5, 1],
    },
    {
      src:
        'data:image/png;base64,\n' +
        '\tiVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAGXRFWHRTb2Z0\n' +
        '\td2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA3ZpVFh0WE1MOmNvbS5hZG9i\n' +
        '\tZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2Vo\n' +
        '\taUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6\n' +
        '\tbnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMTM4IDc5\n' +
        '\tLjE1OTgyNCwgMjAxNi8wOS8xNC0wMTowOTowMSAgICAgICAgIj4gPHJkZjpS\n' +
        '\tREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJk\n' +
        '\tZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIg\n' +
        '\teG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8i\n' +
        '\tIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5\n' +
        '\tcGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5j\n' +
        '\tb20veGFwLzEuMC8iIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRp\n' +
        '\tZDozMTcyZmY0Yi1jMGMzLTMzNDQtYjFmNi1mYjU3MGE0YzY5NjgiIHhtcE1N\n' +
        '\tOkRvY3VtZW50SUQ9InhtcC5kaWQ6MzA5MjdBRDk4RkVCMTFFOEI4RkNEQzVG\n' +
        '\tOUNDQTc4MEEiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6MzA5MjdBRDg4\n' +
        '\tRkVCMTFFOEI4RkNEQzVGOUNDQTc4MEEiIHhtcDpDcmVhdG9yVG9vbD0iQWRv\n' +
        '\tYmUgUGhvdG9zaG9wIENDIDIwMTcgKFdpbmRvd3MpIj4gPHhtcE1NOkRlcml2\n' +
        '\tZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6MzE3MmZmNGItYzBj\n' +
        '\tMy0zMzQ0LWIxZjYtZmI1NzBhNGM2OTY4IiBzdFJlZjpkb2N1bWVudElEPSJ4\n' +
        '\tbXAuZGlkOjMxNzJmZjRiLWMwYzMtMzM0NC1iMWY2LWZiNTcwYTRjNjk2OCIv\n' +
        '\tPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4g\n' +
        '\tPD94cGFja2V0IGVuZD0iciI/Pl7Ec5UAAAFCSURBVHja7JZRDYQwDIYZOQOz\n' +
        '\tgAWQgAVOAkgACSABJIAFJDALSDgkcF1SkobAsa278EKTZke47f/ouq5iXdfg\n' +
        '\tTnu5TCq6JIYhRdemwGfwoc2nxWYtYRMBFK6J8N60eAMQjXcAEM9gaMGlwd9H\n' +
        '\t8LdJNEKLL6fim4DQrw+m6Aj1JmuHhpHqiXiBngLYB8GOTL8v2QCwSA5DhI8D\n' +
        '\tJtwEnhtsR+kjAjThKkxCaRg5ibnDAojJUZM/TsCZRVyAiBwx6VA2Uh9JuEWi\n' +
        '\tdgCYuQBq20+yHbcAuNrIBRgY4gqKlWIBwAL6CzpHgMpXJayu9vJoDsLzAfBS\n' +
        '\tSSzyoTK9EYVtQ4L1vTypCSOKGyeucO2IACTdVUll24zYFqK95eR3dlVyvbZk\n' +
        '\tRDTjHtcwuNkegAfgAXgAOADLxfPfS3FCO2abG5DaV4ABAPNCZTCwMKs0AAAA\n' +
        '\tAElFTkSuQmCC',
      anchor: [0.5, 1],
    },
    {
      src:
        'data:image/png;base64,\n' +
        '\tiVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAGXRFWHRTb2Z0\n' +
        '\td2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA3ZpVFh0WE1MOmNvbS5hZG9i\n' +
        '\tZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2Vo\n' +
        '\taUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6\n' +
        '\tbnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMTM4IDc5\n' +
        '\tLjE1OTgyNCwgMjAxNi8wOS8xNC0wMTowOTowMSAgICAgICAgIj4gPHJkZjpS\n' +
        '\tREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJk\n' +
        '\tZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIg\n' +
        '\teG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8i\n' +
        '\tIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5\n' +
        '\tcGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5j\n' +
        '\tb20veGFwLzEuMC8iIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRp\n' +
        '\tZDozMTcyZmY0Yi1jMGMzLTMzNDQtYjFmNi1mYjU3MGE0YzY5NjgiIHhtcE1N\n' +
        '\tOkRvY3VtZW50SUQ9InhtcC5kaWQ6RjFDNzAxOTM4RkVBMTFFODk1NDJFRUQ2\n' +
        '\tMDlDQUU3MzUiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6RjFDNzAxOTI4\n' +
        '\tRkVBMTFFODk1NDJFRUQ2MDlDQUU3MzUiIHhtcDpDcmVhdG9yVG9vbD0iQWRv\n' +
        '\tYmUgUGhvdG9zaG9wIENDIDIwMTcgKFdpbmRvd3MpIj4gPHhtcE1NOkRlcml2\n' +
        '\tZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6MzE3MmZmNGItYzBj\n' +
        '\tMy0zMzQ0LWIxZjYtZmI1NzBhNGM2OTY4IiBzdFJlZjpkb2N1bWVudElEPSJ4\n' +
        '\tbXAuZGlkOjMxNzJmZjRiLWMwYzMtMzM0NC1iMWY2LWZiNTcwYTRjNjk2OCIv\n' +
        '\tPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4g\n' +
        '\tPD94cGFja2V0IGVuZD0iciI/Pix0qjEAAAFISURBVHja7JfRDYIwEIYtcYGu\n' +
        '\twIsDyAg4go6AI8gIMIKOACswgh3AF0aQEeo1OZILQbn2SnzhTy6FQHsf1+u1\n' +
        '\tKGvt7p/ah3R6KXWEJkdzMmA9WHuwdvAZS/lEAB1XxPFUznkNEHV0AHB+huYO\n' +
        '\tphmvd2AXTjQSjy+nzkcHCtrrTBcXoYYzdsKMVEOcX9FyAHsj2Jzc85sYAAYp\n' +
        '\toEnxtsWEe4IVjOm4xYgATbgSk1AzI6cxd0QAR7LU9I8V8E2pFCAlS0wHlI08\n' +
        '\tRhKOkagCAHopgBnnk0zHXwBC1UkBWoFzA8XKiABgAPcFj0CAMlYlLJfmcq4P\n' +
        '\twssBcFPJPPKh5O6I7GXoIMAyjMbwI+GyVbbjmT0in1RJ43sY8S1EUxXk+rxU\n' +
        '\tcteIwLTjiZN0MSMQRRvABrABbAASgGHhfr2/Y1RGT8xLJ59v+ggwAM1qbf9C\n' +
        '\tvHj3AAAAAElFTkSuQmCC',
      anchor: [0.5, 1],
    },
  ];

  /**
   * @description Allows to model a JSON representation of ol/style/Image style. It makes use of VcsStrokeMenu and VcsFillMenu.
   * @vue-prop {import("ol/style/RegularShape").Options | import("ol/style/Circle").Options | import("ol/style/Icon").Options} [modelValue] - The Image options
   * @vue-prop {import("ol/style/RegularShape").Options | import("ol/style/Circle").Options | import("ol/style/Icon").Options} [valueDefault] - The default image options
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
      VTabs,
      VTab,
      VcsLabel,
      VcsTextField,
      VcsFillMenu,
      VcsStrokeMenu,
      VcsRadio,
      VcsSlider,
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
      const localValue = useProxiedComplexModel(props, 'modelValue', emit);
      const currentType = computed(() => {
        if (localValue.value?.radius) {
          return ImageType.SHAPE;
        } else if (localValue.value?.src) {
          return ImageType.ICON;
        } else {
          return undefined;
        }
      });

      const initialTab = Object.values(ImageType).findIndex(
        (type) => type === currentType.value,
      );

      const selectedImageTypeTab = ref(initialTab !== -1 ? initialTab : 0);

      const selectedType = computed(
        () => Object.values(ImageType)[selectedImageTypeTab.value],
      );

      const customIcon = 'mdi-dots-horizontal';

      const canvas = ref();

      const shapeSingleValueInputs = computed(() => {
        /**
         * @type {[{key: string,isRequired?: boolean, unit?: string,  range?: number[]}]}
         */
        const inputs = [
          { key: 'radius', unit: 'px', range: [1, 100], isRequired: true },
        ];
        if (props.extendedShapeSettings) {
          inputs.push(
            { key: 'points', range: [0, 10] },
            { key: 'radius2', unit: 'px', range: [0, 100] },
            { key: 'angle', step: 0.1, unit: 'rad' },
            { key: 'rotation', step: 0.1, unit: 'rad' },
          );
        }
        return inputs;
      });

      const selectedScale = computed({
        get() {
          if (Array.isArray(localValue.value?.scale)) {
            return localValue.value.scale[0];
          } else {
            return localValue.value?.scale;
          }
        },
        set(value) {
          localValue.value.scale = value;
        },
      });

      const selectedIdx = ref(-1);

      watch(selectedType, () => {
        // unset selection on tab change
        if (currentType.value !== selectedType.value) {
          selectedIdx.value = -1;
        }
      });

      watch(
        localValue,
        () => {
          // derive selection on modelValue change
          if (currentType.value === ImageType.SHAPE) {
            const idx = defaultShapes
              .map(({ value }) => value)
              .findIndex((i) => isEqualShape(localValue.value, i));
            // select custom (index 7), if no defaultShape found
            selectedIdx.value = idx < 0 ? 7 : idx;
          } else if (currentType.value === ImageType.ICON) {
            selectedIdx.value = props.iconOptions.findIndex(
              (i) => i.src === localValue.value.src,
            );
          }
        },
        { deep: true },
      );

      watch(selectedIdx, (idx) => {
        // update modelValue on selection
        if (idx > -1) {
          if (
            selectedType.value === ImageType.SHAPE &&
            idx < defaultShapes.length
          ) {
            const switchFromICON = currentType.value === ImageType.ICON;
            localValue.value = {
              ...defaultShapes[idx]?.value,
              fill: switchFromICON
                ? props.valueDefault?.fill
                : toRaw(localValue.value?.fill),
              stroke: switchFromICON
                ? props.valueDefault?.stroke
                : toRaw(localValue.value?.stroke),
            };
          } else if (selectedType.value === ImageType.ICON) {
            localValue.value = {
              ...props.iconOptions[idx],
            };
          }
        }
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
        return items.map(({ src }, idx) => ({
          src,
          idx,
        }));
      });

      onMounted(() => {
        drawImageStyle(canvas.value, localValue.value);
        watch(
          localValue,
          () => {
            drawImageStyle(canvas.value, localValue.value);
          },
          { deep: true },
        );
      });

      const cid = useComponentId();

      return {
        ImageType,
        localValue,
        selectedType,
        currentType,
        selectedIdx,
        canvas,
        shapeSingleValueInputs,
        selectedScale,
        between,
        currentItems,
        selectedImageTypeTab,
        cid,
      };
    },
  };
</script>
