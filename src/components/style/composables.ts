import type { ComputedRef } from 'vue';
import { computed } from 'vue';
import type { Color } from 'ol/color.js';
import type { ColorLike, PatternDescriptor } from 'ol/colorlike.js';
import type { Options as FillOptions } from 'ol/style/Fill.js';
import type { Options as StrokeOptions } from 'ol/style/Stroke.js';

/**
 * A plain JSON representation of an ol/style/Text style as edited by the text
 * style components. In contrast to ol's `Options`, `fill`/`stroke` are plain
 * option objects (not runtime instances) and `text` is always a single string.
 */
export type TextStyleOptions = {
  text?: string;
  font?: string;
  fill?: FillOptions;
  stroke?: StrokeOptions;
  offsetX?: number;
  offsetY?: number;
  textBaseline?: string;
};

/**
 * Computes a color object from a color array.
 * @param colorGetter Getter that returns an array containing rgba values.
 * @returns An object with rgba keys.
 */
export function useColorObject(
  colorGetter: () => Color | ColorLike | PatternDescriptor | null | undefined,
): ComputedRef<{
  r: number;
  g: number;
  b: number;
  a: number;
}> {
  return computed(() => {
    const rgba = colorGetter();
    if (Array.isArray(rgba)) {
      return {
        r: rgba[0],
        g: rgba[1],
        b: rgba[2],
        a: rgba[3],
      };
    } else if (
      rgba &&
      typeof rgba === 'object' &&
      'r' in rgba &&
      'g' in rgba &&
      'b' in rgba &&
      'a' in rgba
    ) {
      return {
        r: Number(rgba.r),
        g: Number(rgba.g),
        b: Number(rgba.b),
        a: Number(rgba.a),
      };
    } else {
      return { r: 255, g: 255, b: 255, a: 0 };
    }
  });
}

/**
 * Checks if a value is in a value range.
 * @param value Value checked to see if it is in the allowed range.
 * @param range Min and max value
 * @returns If value is between min and max.
 */
export function between(value: number, range: [number, number]): boolean {
  return value >= range[0] && value <= range[1];
}

/**
 * Creates a string from a color object.
 * @param rgbaObject An object with rgba keys.
 * @returns A string looking like this: rgba(0,0,0,0).
 */
export function rgbaObjectToString(rgbaObject: {
  r: number;
  g: number;
  b: number;
  a: number;
}): string {
  return `rgba(${Object.values(rgbaObject).toString()})`;
}
