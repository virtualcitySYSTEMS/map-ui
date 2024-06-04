<template>
  <v-list density="compact">
    <v-row>
      <v-col
        v-for="(row, idx) in item.rows"
        :key="idx"
        :cols="cols"
        :class="{ 'w-100': item.colNr === 1, 'w-50': item.colNr !== 1 }"
      >
        <v-list-item
          density="compact"
          class="pa-0"
          :class="determineInnerPadding(idx)"
        >
          <template #prepend>
            <v-img
              v-if="
                row.type === StyleRowType.Icon ||
                row.type === StyleRowType.Shape
              "
              width="32"
              height="24"
              cover
              :src="getImageSrcFromShape(row.image)"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="24"
              viewBox="0 0 32 24"
              v-else
            >
              <text
                v-if="row.type === StyleRowType.Text"
                :style="`font:${row.text.font}`"
                x="0"
                y="17"
                :stroke="getColor(row.text?.stroke?.color)"
                :stroke-linecap="row.text?.stroke?.lineCap"
                :stroke-linejoin="row.text?.stroke?.lineJoin"
                :stroke-dasharray="row.text?.stroke?.lineDash"
                :stroke-dashoffset="row.text?.stroke?.lineDashOffset"
                :stroke-miterlimit="row.text?.stroke?.miterLimit"
                :stroke-width="row.text?.stroke?.width"
                :fill="getColor(row.text?.fill?.color) || 'rgba(255,255,255,0)'"
              >
                {{ $st(row.label || 'legend.defaultLabelText') }}
              </text>
              <line
                v-else-if="row.type === StyleRowType.Stroke"
                x1="0"
                y1="12"
                x2="32"
                y2="12"
                :stroke="getColor(row.stroke?.color)"
                :stroke-linecap="row.stroke?.lineCap"
                :stroke-linejoin="row.stroke?.lineJoin"
                :stroke-dasharray="row.stroke?.lineDash"
                :stroke-dashoffset="row.stroke?.lineDashOffset"
                :stroke-miterlimit="row.stroke?.miterLimit"
                :stroke-width="row.stroke?.width"
              />
              <rect
                v-else-if="row.type === StyleRowType.Fill"
                width="32"
                height="24"
                :stroke="getColor(row.stroke?.color)"
                :stroke-linecap="row.stroke?.lineCap"
                :stroke-linejoin="row.stroke?.lineJoin"
                :stroke-dasharray="row.stroke?.lineDash"
                :stroke-dashoffset="row.stroke?.lineDashOffset"
                :stroke-miterlimit="row.stroke?.miterLimit"
                :stroke-width="row.stroke?.width"
                :fill="getColor(row.fill?.color) || 'rgba(255,255,255,0)'"
              />
              <circle
                v-else-if="row.type === StyleRowType.Circle"
                cx="16"
                cy="12"
                :r="row.image?.radius || 8"
                :stroke="getColor(row.image?.stroke?.color)"
                :stroke-linecap="row.image?.stroke?.lineCap"
                :stroke-linejoin="row.image?.stroke?.lineJoin"
                :stroke-dasharray="row.image?.stroke?.lineDash"
                :stroke-dashoffset="row.image?.stroke?.lineDashOffset"
                :stroke-miterlimit="row.image?.stroke?.miterLimit"
                :stroke-width="row.image?.stroke?.width"
                :fill="
                  getColor(row.image?.fill?.color) || 'rgba(255,255,255,0)'
                "
              />
            </svg>
          </template>

          <v-list-item-title
            class="pt-2"
            :title="$st(row.tooltip || row.title)"
          >
            {{ $st(row.title) }}
          </v-list-item-title>
        </v-list-item>
      </v-col>
    </v-row>
  </v-list>
</template>

<script>
  import { getStringColor } from '@vcmap/core';
  import {
    VRow,
    VImg,
    VCol,
    VList,
    VListItem,
    VListItemTitle,
  } from 'vuetify/components';
  import { computed } from 'vue';
  import { StyleRowType, getImageSrcFromShape } from './legendHelper.js';

  /**
   * @description A component rendering vector styles as list using {@link https://vuetifyjs.com/en/api/v-list-row v-list-row}
   * @vue-prop {StyleLegendItem} item - an item with multiple rows of style information and corresponding title
   */
  export default {
    name: 'StyleLegendItem',
    components: {
      VList,
      VRow,
      VCol,
      VListItem,
      VImg,
      VListItemTitle,
    },
    props: {
      item: {
        type: Object,
        required: true,
      },
    },
    setup(props) {
      /**
       * Determines if a list item has padding right or left, so it has correct spacing to second row.
       * @param {number} index The index of the list item. Starts with 0.
       * @returns {string} Vuetify padding helper.
       */
      function determineInnerPadding(index) {
        // check if there are more than two columns
        if (props.item.colNr !== 1) {
          // check if even number. If so, it is located in the left column and needs padding on the right.
          if (index % 2 === 0) {
            return 'pr-2';
          } else {
            return 'pl-2';
          }
        }
        return '';
      }
      return {
        StyleRowType,
        getImageSrcFromShape,
        getColor(color) {
          if (color) {
            return getStringColor(color);
          }
          return null;
        },
        determineInnerPadding,
        cols: computed(() => {
          return props.item.colNr === 1 ? 12 : 6;
        }),
      };
    },
  };
</script>

<style scoped>
  .v-list-item--dense {
    height: 32px;
  }
</style>
