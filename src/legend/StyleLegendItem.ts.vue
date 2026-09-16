<template>
  <v-list class="style-legend-item">
    <v-row no-gutters>
      <v-col
        v-for="(row, idx) in item.rows"
        :key="idx"
        :cols="cols"
        :class="{ 'w-100': item.colNr === 1, 'w-50': item.colNr !== 1 }"
      >
        <v-list-item class="pa-0" :class="determineInnerPadding(idx)">
          <template #prepend>
            <v-img
              v-if="isIconOrImageRow(row)"
              width="32"
              height="24"
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
                v-if="isTextRow(row)"
                :style="`font:${row.text.font}`"
                x="0"
                y="17"
                :stroke="getColor(row.text?.stroke?.color)"
                :stroke-linecap="row.text?.stroke?.lineCap"
                :stroke-linejoin="row.text?.stroke?.lineJoin"
                :stroke-dasharray="row.text?.stroke?.lineDash?.join(' ')"
                :stroke-dashoffset="row.text?.stroke?.lineDashOffset"
                :stroke-miterlimit="row.text?.stroke?.miterLimit"
                :stroke-width="row.text?.stroke?.width"
                :fill="getColor(row.text?.fill?.color) || 'rgba(255,255,255,0)'"
              >
                {{ $st(row.label || 'legend.defaultLabelText') }}
              </text>
              <line
                v-else-if="isStrokeRow(row)"
                x1="0"
                y1="12"
                x2="32"
                y2="12"
                :stroke="getColor(row.stroke?.color)"
                :stroke-linecap="row.stroke?.lineCap"
                :stroke-linejoin="row.stroke?.lineJoin"
                :stroke-dash="row.stroke?.lineDash"
                :stroke-dashoffset="row.stroke?.lineDashOffset"
                :stroke-miterlimit="row.stroke?.miterLimit"
                :stroke-width="row.stroke?.width"
              />
              <template v-else-if="isFillRow(row)">
                <defs v-if="patterns[idx]">
                  <pattern
                    :id="`legend-fill-pattern-${idx}`"
                    x="0"
                    y="0"
                    :width="patterns[idx].size"
                    :height="patterns[idx].size"
                    patternUnits="userSpaceOnUse"
                  >
                    <rect
                      :width="patterns[idx].size"
                      :height="patterns[idx].size"
                      :fill="patterns[idx].bgColor"
                    />
                    <line
                      v-for="(line, lineIdx) in patterns[idx].lines"
                      :key="lineIdx"
                      :x1="line.x1"
                      :y1="line.y1"
                      :x2="line.x2"
                      :y2="line.y2"
                      :stroke="patterns[idx].lineColor"
                      :stroke-width="patterns[idx].lineWidth"
                      stroke-linecap="square"
                    />
                  </pattern>
                </defs>
                <rect
                  width="32"
                  height="24"
                  :stroke="getColor(row.stroke?.color)"
                  :stroke-linecap="row.stroke?.lineCap"
                  :stroke-linejoin="row.stroke?.lineJoin"
                  :stroke-dash="row.stroke?.lineDash"
                  :stroke-dashoffset="row.stroke?.lineDashOffset"
                  :stroke-miterlimit="row.stroke?.miterLimit"
                  :stroke-width="row.stroke?.width"
                  :fill="
                    patterns[idx]
                      ? `url(#legend-fill-pattern-${idx})`
                      : getColor(row.fill?.color) || 'rgba(255,255,255,0)'
                  "
                />
              </template>
              <circle
                v-else-if="isCircleRow(row)"
                cx="16"
                cy="12"
                :r="row.image?.radius || 8"
                :stroke="getColor(row.image?.stroke?.color)"
                :stroke-linecap="row.image?.stroke?.lineCap"
                :stroke-linejoin="row.image?.stroke?.lineJoin"
                :stroke-dash="row.image?.stroke?.lineDash"
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
            class="pa-2"
            :title="$st(row.tooltip || row.title)"
          >
            {{ $st(row.title) }}
          </v-list-item-title>
        </v-list-item>
      </v-col>
    </v-row>
  </v-list>
</template>

<script lang="ts">
  import type { ColorType, VectorStyleItemFill } from '@vcmap/core';
  import { getStringColor } from '@vcmap/core';
  import {
    VRow,
    VImg,
    VCol,
    VList,
    VListItem,
    VListItemTitle,
  } from 'vuetify/components';
  import type { PropType } from 'vue';
  import type { PatternDescriptor } from 'ol/colorlike.js';
  import { computed, defineComponent } from 'vue';
  import type {
    CircleLegendRow,
    FillLegendRow,
    IconLegendRow,
    PatternSvgData,
    RegularShapeLegendRow,
    StrokeLegendRow,
    StyleLegendItem,
    StyleLegendRow,
    TextLegendRow,
  } from './legendHelper.js';
  import { getImageSrcFromShape, getPatternSvgData } from './legendHelper.js';

  /**
   * @description A component rendering vector styles as list using {@link https://vuetifyjs.com/en/api/v-list-row v-list-row}
   * @vue-prop {StyleLegendItem} item - an item with multiple rows of style information and corresponding title
   */
  export default defineComponent({
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
      item: { type: Object as PropType<StyleLegendItem>, required: true },
    },
    setup(props) {
      /**
       * Determines if a list item has padding right or left, so it has correct spacing to second row.
       * @param index The index of the list item. Starts with 0.
       * @returns Vuetify padding helper.
       */
      function determineInnerPadding(index: number): string {
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

      const patterns = computed(() => {
        const cache: Record<number, PatternSvgData> = {};
        props.item.rows.forEach((row, idx) => {
          if (((row as FillLegendRow).fill as VectorStyleItemFill)?.pattern) {
            cache[idx] = getPatternSvgData(
              (row as FillLegendRow).fill as VectorStyleItemFill,
            );
          }
        });
        return cache;
      });

      return {
        getImageSrcFromShape,
        getColor(
          color?: ColorType | PatternDescriptor | null,
        ): string | undefined {
          if (color) {
            if (typeof color === 'object' && 'src' in color) {
              return undefined;
            }
            return getStringColor(color);
          }
          return undefined;
        },
        determineInnerPadding,
        patterns,
        cols: computed(() => (props.item.colNr === 1 ? 12 : 6)),
        isIconOrImageRow(
          row: StyleLegendRow,
        ): row is IconLegendRow | RegularShapeLegendRow {
          return (
            row.type === 'IconLegendRow' || row.type === 'RegularShapeLegendRow'
          );
        },
        isTextRow(row: StyleLegendRow): row is TextLegendRow {
          return row.type === 'TextLegendRow';
        },
        isStrokeRow(row: StyleLegendRow): row is StrokeLegendRow {
          return row.type === 'StrokeLegendRow';
        },
        isFillRow(row: StyleLegendRow): row is FillLegendRow {
          return row.type === 'FillLegendRow';
        },
        isCircleRow(row: StyleLegendRow): row is CircleLegendRow {
          return row.type === 'CircleLegendRow';
        },
      };
    },
  });
</script>

<style scoped></style>
