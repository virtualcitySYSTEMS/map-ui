import {
  FeatureLayer,
  type Layer,
  PatternType,
  type StyleItem,
  type VectorClusterGroup,
  VectorLayer,
  type VectorStyleItemFill,
  getRegularShapeImageUrl,
  getShapeFromOptions,
  getStringColor,
  parseColor,
} from '@vcmap/core';
import { type Reactive, reactive } from 'vue';
import type { Options as StrokeOptions } from 'ol/style/Stroke.js';
import type { Options as FillOptions } from 'ol/style/Fill.js';
import type { Options as CircleOptions } from 'ol/style/Circle.js';
import type { Options as ImageOptions } from 'ol/style/Image.js';
import type { Options as TextOptions } from 'ol/style/Text.js';
import type { Options as IconOptions } from 'ol/style/Icon.js';
import type { Options as RegularShapeOptions } from 'ol/style/RegularShape.js';
import { getLogger } from '@vcsuite/logger';
import type VcsUiApp from '../vcsUiApp.js';

/**
 * Symbol set a volatile legend property on a layer or style
 */
export const legendSymbol = Symbol('legend');

type LegendTypeType =
  | 'ImageLegendItem'
  | 'IframeLegendItem'
  | 'StyleLegendItem';

/** @deprecated Use literal string keys instead. */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const LegendType: Readonly<Record<string, LegendTypeType>> = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  get Image(): 'ImageLegendItem' {
    getLogger('legendHelper').deprecate(
      'LegendType.Image',
      "Use the literal string 'ImageLegendItem' instead.",
    );
    return 'ImageLegendItem';
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  get Iframe(): 'IframeLegendItem' {
    getLogger('legendHelper').deprecate(
      'LegendType.Iframe',
      "Use the literal string 'IframeLegendItem' instead.",
    );
    return 'IframeLegendItem';
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  get Style(): 'StyleLegendItem' {
    getLogger('legendHelper').deprecate(
      'LegendType.Style',
      "Use the literal string 'StyleLegendItem' instead.",
    );
    return 'StyleLegendItem';
  },
} as const;

type StyleRowTypeType =
  | 'StrokeLegendRow'
  | 'FillLegendRow'
  | 'CircleLegendRow'
  | 'IconLegendRow'
  | 'RegularShapeLegendRow'
  | 'TextLegendRow';

/** @deprecated Use literal string keys instead. */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const StyleRowType: Readonly<Record<string, StyleRowTypeType>> = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  get Stroke(): 'StrokeLegendRow' {
    getLogger('legendHelper').deprecate(
      'StyleRowType.Stroke',
      "Use the literal string 'StrokeLegendRow' instead.",
    );
    return 'StrokeLegendRow';
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  get Fill(): 'FillLegendRow' {
    getLogger('legendHelper').deprecate(
      'StyleRowType.Fill',
      "Use the literal string 'FillLegendRow' instead.",
    );
    return 'FillLegendRow';
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  get Circle(): 'CircleLegendRow' {
    getLogger('legendHelper').deprecate(
      'StyleRowType.Circle',
      "Use the literal string 'CircleLegendRow' instead.",
    );
    return 'CircleLegendRow';
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  get Icon(): 'IconLegendRow' {
    getLogger('legendHelper').deprecate(
      'StyleRowType.Icon',
      "Use the literal string 'IconLegendRow' instead.",
    );
    return 'IconLegendRow';
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  get Shape(): 'RegularShapeLegendRow' {
    getLogger('legendHelper').deprecate(
      'StyleRowType.Shape',
      "Use the literal string 'RegularShapeLegendRow' instead.",
    );
    return 'RegularShapeLegendRow';
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  get Text(): 'TextLegendRow' {
    getLogger('legendHelper').deprecate(
      'StyleRowType.Text',
      "Use the literal string 'TextLegendRow' instead.",
    );
    return 'TextLegendRow';
  },
} as const;

export type LegendItem = {
  /** Determines rendering, specialised properties are type based. */
  type: LegendTypeType;
};

export type ImageLegendItem = LegendItem & {
  /** the source url. Can be an i18n string. */
  src: string;
  /** show a button in legend title to open legend in new tab */
  popoutBtn?: boolean;
  /** Optional further explanation of the legend */
  tooltip?: string;
};

export type IframeLegendItem = LegendItem & {
  /** the source url. Can be an i18n string. */
  src: string;
  /** show a button in legend title to open legend in new tab */
  popoutBtn?: boolean;
};

export type StyleLegendItem = LegendItem & {
  /** Number of columns. Valid values are 1 or 2. Per default 2. */
  colNr?: number;
  /** style definitions with description */
  rows: StyleLegendRow[];
};

export type StyleLegendRow = {
  /** determines rendering of the row, specialised properties are type based. */
  type: StyleRowTypeType;
  /** Description of the style. Can be an i18n string */
  title: string;
  /** Optional further explanation of the legend row */
  tooltip?: string;
};

export type StrokeLegendRow = StyleLegendRow & {
  stroke: StrokeOptions;
};

export type FillLegendRow = StyleLegendRow & {
  fill: FillOptions | VectorStyleItemFill;
  stroke?: StrokeOptions;
};

type CircleLegendImageOptions = Omit<CircleOptions, 'fill' | 'stroke'> & {
  fill?: FillOptions;
  stroke?: StrokeOptions;
};

export type CircleLegendRow = StyleLegendRow & {
  image: CircleLegendImageOptions;
};

export type IconLegendRow = StyleLegendRow & {
  image: IconOptions;
};

export type RegularShapeLegendRow = StyleLegendRow & {
  image: RegularShapeOptions;
};

type TextLegendTextOptions = Omit<TextOptions, 'fill' | 'stroke'> & {
  fill?: FillOptions;
  stroke?: StrokeOptions;
};

export type TextLegendRow = StyleLegendRow & {
  text: TextLegendTextOptions;
  label?: string;
};

type PatternLine = { x1: number; y1: number; x2: number; y2: number };

export type PatternSvgData = {
  size: number;
  bgColor: string;
  lineColor: string;
  lineWidth: number;
  lines: PatternLine[];
};

/**
 * Computes the SVG data needed to render an inline pattern for a legend row.
 */
export function getPatternSvgData(fill: VectorStyleItemFill): PatternSvgData {
  const size = fill.pattern?.size || 10;
  const bgColor = getStringColor(parseColor(fill.color));
  const lineColor = getStringColor(fill.pattern!.color);
  const lineWidth = fill.pattern!.width;

  const lines: PatternLine[] = [];

  function addLine(x1: number, y1: number, x2: number, y2: number): void {
    lines.push({ x1, y1, x2, y2 });
  }

  switch (fill.pattern!.type) {
    case PatternType.NWSE:
      addLine(size / 2, size, size, size / 2);
      addLine(0, size / 2, size / 2, 0);
      break;
    case PatternType.SWNE:
      addLine(size / 2, size, 0, size / 2);
      addLine(size, size / 2, size / 2, 0);
      break;
    case PatternType.DIAGONALCROSS:
      addLine(size / 2, size, size, size / 2);
      addLine(0, size / 2, size / 2, 0);
      addLine(size / 2, size, 0, size / 2);
      addLine(size, size / 2, size / 2, 0);
      break;
    case PatternType.NS:
      addLine(size / 2, 0, size / 2, size);
      break;
    case PatternType.WE:
      addLine(0, size / 2, size, size / 2);
      break;
    case PatternType.CROSS:
      addLine(size / 2, 0, size / 2, size);
      addLine(0, size / 2, size, size / 2);
      break;
    default:
      break;
  }

  return { size, bgColor, lineColor, lineWidth, lines };
}

export function getImageSrcFromShape(
  image: ImageOptions | IconOptions | RegularShapeOptions,
): string | undefined {
  if ('src' in image && image.src) {
    return image.src;
  }
  const shape = getShapeFromOptions(image);
  return getRegularShapeImageUrl(shape);
}

export type LegendEntry = {
  key: string;
  /** layer or entry name */
  title: string;
  /** panel state of entry */
  open?: boolean;
  /** legend properties */
  legend: LegendItem[];
};

export function getStyleLegend(
  style?: StyleItem,
): Array<LegendItem> | undefined {
  // @ts-expect-error legendSymbol is not a property of VectorClusterGroup
  return style?.[legendSymbol] ?? style?.properties?.legend;
}

export function getLayerLegend(layer?: Layer): Array<LegendItem> | undefined {
  return (
    getStyleLegend((layer as VectorLayer)?.style) ??
    // @ts-expect-error legendSymbol is not a property of VectorClusterGroup
    layer?.[legendSymbol] ??
    layer?.properties?.legend
  );
}

export function getLegendEntries(app: VcsUiApp): {
  entries: Reactive<Array<LegendEntry>>;
  destroy: () => void;
} {
  const entries = reactive<LegendEntry[]>([]);
  const styleChangedListener: Record<string, () => void> = {};

  function removeEntryForLayer(layer: Layer): void {
    const layerName = layer.name;
    const entryIndex = entries.findIndex(({ key }) => key === layerName);
    if (entryIndex >= 0) {
      entries.splice(entryIndex, 1);
    }
    if (styleChangedListener[layerName]) {
      styleChangedListener[layerName]();
      delete styleChangedListener[layerName];
    }
  }

  /**
   * adds or removes a LegendEntry on layer state changes and layer style changes
   * adds a styleChangedListener for all layers changing its state
   */
  function syncLayerLegendEntries(layer: Layer): void {
    removeEntryForLayer(layer);
    if (layer.active && layer.isSupported(app.maps.activeMap!)) {
      const key = layer.name;
      const title = (layer.properties.title as string) || layer.name;
      const legend = getLayerLegend(layer);
      if (legend) {
        const legendEntry = { key, title, legend, open: true };
        entries.unshift(legendEntry);
      }
      if (layer instanceof FeatureLayer) {
        styleChangedListener[layer.name] = layer.styleChanged.addEventListener(
          () => {
            syncLayerLegendEntries(layer);
          },
        );
      }
    }
  }

  function removeEntryForGroup(group: VectorClusterGroup): void {
    const groupName = group.name;
    const entryIndex = entries.findIndex(({ key }) => key === groupName);
    if (entryIndex >= 0) {
      entries.splice(entryIndex, 1);
    }
  }

  /**
   * Handles addition or removal of VectorClusterGroups
   */
  function syncVectorClusterGroups(layers: Layer[]): void {
    [...app.vectorClusterGroups].forEach(removeEntryForGroup);
    const vectorClusterGroups = layers
      .filter(
        (layer) =>
          layer.active &&
          layer.isSupported(app.maps.activeMap!) &&
          layer instanceof VectorLayer,
      )
      .map((layer) => (layer as VectorLayer).vectorClusterGroup);
    const uniqueVectorClusterGroups = [...new Set(vectorClusterGroups)];
    uniqueVectorClusterGroups.forEach((groupName) => {
      const group = app.vectorClusterGroups.getByKey(groupName);
      // @ts-expect-error legendSymbol is not a property of VectorClusterGroup
      if (group?.[legendSymbol] ?? group?.properties?.legend) {
        const title = (group.properties.title as string) || group.name;
        const { legend } = group.properties as { legend: LegendItem[] };
        if (!entries.some(({ key }) => key === group.name)) {
          const legendEntry = { key: group.name, title, legend, open: true };
          entries.unshift(legendEntry);
        }
      }
    });
  }

  const destroyMapListener = app.maps.mapActivated.addEventListener(() => {
    [...app.layers].forEach(syncLayerLegendEntries);
    syncVectorClusterGroups([...app.layers]);
  });

  const destroyChangedListener = app.layers.stateChanged.addEventListener(
    (l) => {
      syncLayerLegendEntries(l);
      syncVectorClusterGroups([...app.layers]);
    },
  );
  const destroyAddedListener = app.layers.added.addEventListener((l) => {
    syncLayerLegendEntries(l);
    syncVectorClusterGroups([...app.layers]);
  });
  const destroyRemovedListener = app.layers.removed.addEventListener((l) => {
    removeEntryForLayer(l);
    syncVectorClusterGroups([...app.layers]);
  });

  [...app.layers].forEach((l) => {
    syncLayerLegendEntries(l);
  });
  syncVectorClusterGroups([...app.layers]);

  const destroy = (): void => {
    destroyMapListener();
    destroyChangedListener();
    destroyAddedListener();
    destroyRemovedListener();
    Object.values(styleChangedListener).forEach((cb) => {
      cb();
    });
  };

  return { entries, destroy };
}
