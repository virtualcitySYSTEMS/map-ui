import type { Cartesian2 } from '@vcmap-cesium/engine';
import type { WindowPosition, WindowPositionOptions } from './windowManager.js';
import type WindowManager from './windowManager.js';
import {
  WindowPositions,
  posToPixel,
  windowPositionFromOptions,
} from './windowManager.js';

/**
 * margin in px at the border of the map target
 * limiting windows to be moved out of screen
 */
export const windowMoveMargin = {
  top: 0,
  right: 64,
  bottom: 32,
  left: 64,
};

export enum WindowAlignment {
  TOP_LEFT = 1,
  TOP_RIGHT = 2,
  BOTTOM_LEFT = 3,
  BOTTOM_RIGHT = 4,
}

/**
 *
 * returns the targetSize of the div element of the panel where the Map is rendered.
 * This is the base for calculating the position of the windows on the map, as the window position is relative to this element.
 * @param target The map Target of the mapCollection
 */
export function getPanelTargetSize(target: HTMLElement | null): DOMRect | null {
  if (!target) {
    return null;
  }
  return target.parentElement?.parentElement?.getBoundingClientRect() || null;
}

/**
 *
 * returns the targetSize of the windowManager div element.
 * @param target The map Target of the mapCollection
 */
export function getTargetSize(target: HTMLElement | null): DOMRect | null {
  if (!target) {
    return null;
  }
  return (
    target.parentElement?.parentElement?.parentElement?.parentElement?.getBoundingClientRect() ||
    null
  );
}

/**
 * WindowPositionOptions from client position relative to a HTMLElement
 * @param x - client pixel position
 * @param y - client pixel position
 * @param target - the map's target { @link @import("@vcmap/core").MapCollection }
 */
export function getWindowPositionOptions(
  x: number,
  y: number,
  target: HTMLElement | null,
  alignment = WindowAlignment.TOP_LEFT,
  offsetX = 0,
  offsetY = 0,
): WindowPositionOptions {
  const targetSize = getTargetSize(target);
  if (!targetSize) {
    return { left: x, top: y };
  }

  const { left, top, width, height } = targetSize;
  if (alignment === WindowAlignment.TOP_LEFT) {
    return { left: x - left + offsetX, top: y - top - offsetY };
  } else if (alignment === WindowAlignment.TOP_RIGHT) {
    return { right: left + width - x + offsetX, top: y - top - offsetY };
  } else if (alignment === WindowAlignment.BOTTOM_LEFT) {
    return {
      left: x - left + offsetX,
      bottom: height + top - y - offsetY,
    };
  }
  return {
    right: left + width - x + offsetX,
    bottom: height + top - y - offsetY,
  };
}

/**
 * Get window position options based on a pixel in the map
 * @param windowPosition - the window position, as retrieved from an InteractionEvent
 * @param target - the map's target { @link @import("@vcmap/core").MapCollection }
 */
export function getWindowPositionOptionsFromMapEvent(
  windowPosition: Cartesian2,
  target: HTMLElement | null,
  alignment: WindowAlignment,
): WindowPositionOptions {
  const targetSize = getPanelTargetSize(target);
  if (!targetSize) {
    return { left: windowPosition.x, top: windowPosition.y };
  }

  const { left, top } = targetSize;
  return getWindowPositionOptions(
    windowPosition.x + left,
    windowPosition.y + top,
    target,
    alignment,
  );
}

/**
 * Fits a window aligned top left, so it fits into the parent. This will change the alignment to be bottom or right depending
 * on if the window would not fit into the parent.
 * @param x - client pixel position
 * @param y - client pixel position
 * @param width - window width to fit
 * @param height - window height to fit
 * @param target - the map's target { @link @import("@vcmap/core").MapCollection }
 */
export function getFittedWindowPositionOptions(
  x: number,
  y: number,
  width: number,
  height: number,
  target: HTMLElement | null,
  offsetX = 0,
  offsetY = 0,
): WindowPositionOptions {
  const targetSize = getTargetSize(target);
  if (!targetSize) {
    return { left: x, top: y };
  }

  const { left, top, width: parentWidth, height: parentHeight } = targetSize;
  const bottom = y - top + height > parentHeight && y - top > parentHeight / 2;
  const right = x - left + width > parentWidth && x - left > parentWidth / 2;
  let alignment = WindowAlignment.TOP_LEFT;
  if (bottom) {
    if (right) {
      alignment = WindowAlignment.BOTTOM_RIGHT;
    } else {
      alignment = WindowAlignment.BOTTOM_LEFT;
    }
  } else if (right) {
    alignment = WindowAlignment.TOP_RIGHT;
  }
  return getWindowPositionOptions(x, y, target, alignment, offsetX, offsetY);
}

/**
 * Fits a window aligned top left, so it fits into currently active map. This will change the alignment to be bottom or right depending
 * on if the window would not fit into active map element.
 * @param windowPosition - the window position, as retrieved from an InteractionEvent
 * @param target - the map's target { @link @import("@vcmap/core").MapCollection }
 */
export function getFittedWindowPositionOptionsFromMapEvent(
  windowPosition: Cartesian2,
  width: number,
  height: number,
  target: HTMLElement | null,
): WindowPositionOptions {
  const targetSize = getPanelTargetSize(target);
  if (!targetSize) {
    return { left: windowPosition.x, top: windowPosition.y };
  }
  const { left, top } = targetSize;
  return getFittedWindowPositionOptions(
    windowPosition.x + left,
    windowPosition.y + top,
    width,
    height,
    target,
  );
}

/**
 * Parses a position to numeric value. Non-numeric values return undefined.
 * @param key - one of WindowPosition keys
 * @param targetSize - size of the current target
 */
export function posToNumber(
  pos: string | number | undefined,
  key: string,
  targetSize: DOMRect | null,
): number | undefined {
  if (typeof pos === 'string') {
    if (pos.match(/^-?\d+\.?\d*px$/)) {
      return parseInt(pos, 10);
    } else if (targetSize && pos.match(/^-?\d+\.?\d*%$/)) {
      const scalar = ['bottom', 'top', 'height', 'maxHeight'].includes(key)
        ? targetSize?.height
        : targetSize?.width;
      return (parseInt(pos, 10) / 100) * scalar;
    }
    return undefined;
  }
  return pos;
}

/**
 * @param key - one of WindowPosition keys
 * @param targetSize - size of the current target
 */
export function posToPercent(
  pos: number,
  key: string,
  targetSize: DOMRect | null,
): string | undefined {
  if (!targetSize) {
    return undefined;
  }
  const scalar = ['bottom', 'top', 'height', 'maxHeight'].includes(key)
    ? targetSize.height
    : targetSize.width;
  return `${((pos / scalar) * 100).toFixed(0)}%`;
}

/**
 * Parses CSS position string properties to absolute numeric position properties
 */
export function optionsFromWindowPosition(
  windowPosition: WindowPosition,
  targetSize: DOMRect | null,
): WindowPositionOptions {
  const options: WindowPositionOptions = {};
  (Object.keys(windowPosition) as (keyof WindowPosition)[]).forEach((key) => {
    if (windowPosition[key] !== undefined) {
      options[key] = posToNumber(windowPosition[key], key, targetSize);
    }
  });
  return options;
}

/**
 * Returns an updated WindowPosition by applying new options keeping the original object unchanged.
 * Ensures units are maintained.
 * Previous values 'auto' and 'unset' will not be touched.
 */
export function updateWindowPosition(
  previous: WindowPosition,
  update: WindowPositionOptions,
  targetSize: DOMRect | null,
): WindowPosition {
  /**
   * returns the position of a key in the same unit 'px' or '%' as previously
   */
  const toString = (
    key: keyof WindowPosition,
    prev: WindowPosition,
    updated: WindowPositionOptions,
  ): string => {
    const next = updated[key];
    const prevValue = prev[key] as string;

    if (next === undefined || prevValue === 'auto' || prevValue === 'unset') {
      return prevValue;
    }
    if (next === 'auto' || next === 'unset') {
      return next;
    }

    const numeric = posToNumber(next, key, targetSize);
    if (numeric !== undefined) {
      if (/^-?\d+\.?\d*%$/.test(prevValue)) {
        return posToPercent(numeric, key, targetSize) ?? prevValue;
      }
      if (/^-?\d+\.?\d*px$/.test(prevValue)) {
        return posToPixel(numeric)!;
      }
    }

    if (typeof next === 'number') {
      return posToPixel(next)!;
    }

    return next;
  };

  const updatedPosition: WindowPositionOptions = { ...update };
  (Object.keys(previous) as (keyof WindowPosition)[]).forEach((key) => {
    updatedPosition[key] = toString(key, previous, update);
  });
  return updatedPosition as WindowPosition;
}

/**
 * Move window position in x and y.
 * Rightward and downward movements are positive.
 * @param id - the window id
 * @param translation - translation in px
 * @param windowManager - the window manager instance
 * @param targetSize - the map's target size
 * @param windowPosition - Optional position to be preferred over windowComponent's position as start.
 */
export function moveWindow(
  id: string,
  translation: { dx: number; dy: number },
  windowManager: WindowManager,
  targetSize: DOMRect | null,
  windowPosition?: WindowPosition,
): void {
  const { position, slot } = windowManager.get(id);
  if (slot.value === 'static') {
    return;
  }
  const windowPositionOptions = optionsFromWindowPosition(
    windowPosition || position,
    targetSize,
  );
  if (windowPositionOptions.top !== undefined) {
    windowPositionOptions.top =
      Number(windowPositionOptions.top) + translation.dy;
  }
  if (windowPositionOptions.bottom !== undefined) {
    windowPositionOptions.bottom =
      Number(windowPositionOptions.bottom) - translation.dy;
  }
  if (windowPositionOptions.left !== undefined) {
    windowPositionOptions.left =
      Number(windowPositionOptions.left) + translation.dx;
  }
  if (windowPositionOptions.right !== undefined) {
    windowPositionOptions.right =
      Number(windowPositionOptions.right) - translation.dx;
  }
  const updatedPosition = updateWindowPosition(
    position,
    windowPositionOptions,
    targetSize,
  );
  windowManager.setWindowPositionOptions(id, updatedPosition);
}

/**
 * Clips a provided WindowPosition corresponding to the size of its target
 */
export function clipToTargetSize(
  windowPositionOptions: WindowPositionOptions,
  targetSize: DOMRect,
): WindowPositionOptions {
  const { width: targetWidth, height: targetHeight } = targetSize;
  if (!targetWidth || !targetHeight) {
    return windowPositionOptions;
  }
  const clippedPosition: WindowPositionOptions = {};
  if (windowPositionOptions.top !== undefined) {
    clippedPosition.top = Math.min(
      Math.max(0, Number(windowPositionOptions.top)),
      targetHeight - windowMoveMargin.bottom,
    );
  }
  if (windowPositionOptions.bottom !== undefined) {
    const height =
      Number(windowPositionOptions.height) ||
      targetHeight -
        Number(windowPositionOptions.bottom) -
        Number(windowPositionOptions.top) ||
      windowMoveMargin.bottom;
    clippedPosition.bottom = Math.min(
      Math.max(
        Number(windowPositionOptions.bottom),
        -height + windowMoveMargin.bottom,
      ),
      targetHeight - height,
    );
  }
  if (windowPositionOptions.left !== undefined) {
    const width =
      Number(windowPositionOptions.width) ||
      targetWidth -
        Number(windowPositionOptions.right) -
        Number(windowPositionOptions.left);
    clippedPosition.left = Math.min(
      Math.max(
        Number(windowPositionOptions.left),
        -width + windowMoveMargin.left,
      ),
      targetWidth - windowMoveMargin.left,
    );
  }
  if (windowPositionOptions.right !== undefined) {
    const width =
      Number(windowPositionOptions.width) ||
      targetWidth -
        Number(windowPositionOptions.right) -
        Number(windowPositionOptions.left);
    clippedPosition.right = Math.min(
      Math.max(
        Number(windowPositionOptions.right),
        -width + windowMoveMargin.right,
      ),
      targetWidth - windowMoveMargin.right,
    );
  }
  if (windowPositionOptions.width !== undefined) {
    clippedPosition.width = windowPositionOptions.width;
  }
  if (windowPositionOptions.height !== undefined) {
    clippedPosition.height = windowPositionOptions.height;
  }
  clippedPosition.maxWidth = targetWidth;
  clippedPosition.maxHeight = targetHeight - 4; // 2px space plus 2px due to margin bottom
  if (windowPositionOptions.maxWidth !== undefined) {
    clippedPosition.maxWidth = Math.min(
      Number(windowPositionOptions.maxWidth),
      targetWidth,
    );
  }
  if (windowPositionOptions.maxHeight !== undefined) {
    clippedPosition.maxHeight = Math.min(
      Number(windowPositionOptions.maxHeight),
      targetHeight,
    );
  }
  // max width of a top left 2 window (active static window)
  const topLeft2 = posToNumber(
    WindowPositions.TOP_LEFT2.left,
    'left',
    targetSize,
  );
  if (topLeft2 && clippedPosition.left === topLeft2) {
    clippedPosition.maxWidth = Math.min(
      clippedPosition.maxWidth - topLeft2,
      targetWidth,
    );
  }

  return clippedPosition;
}

/**
 * Derives a child window position from a parent window, placing the child top-right of the parent.
 * @param  windowPositionOptions - numerical WindowPositionOptions
 * @param targetSize - the map's target size
 * @param parentPosition - numerical WindowPositionOptions
 */
export function applyParentPosition(
  windowPositionOptions: WindowPositionOptions,
  targetSize: DOMRect,
  parentPosition: WindowPositionOptions,
): void {
  const asNumber = (value: string | number | undefined): number | undefined => {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    return undefined;
  };

  const parsedParentPosition = optionsFromWindowPosition(
    parentPosition as WindowPosition,
    targetSize,
  );
  const {
    left,
    right,
    top,
    bottom,
    width,
    height,
    minWidth,
    minHeight,
    maxWidth,
    maxHeight,
  } = {
    left: asNumber(parsedParentPosition.left),
    right: asNumber(parsedParentPosition.right),
    top: asNumber(parsedParentPosition.top),
    bottom: asNumber(parsedParentPosition.bottom),
    width: asNumber(parsedParentPosition.width),
    height: asNumber(parsedParentPosition.height),
    minWidth: asNumber(parsedParentPosition.minWidth),
    minHeight: asNumber(parsedParentPosition.minHeight),
    maxWidth: asNumber(parsedParentPosition.maxWidth),
    maxHeight: asNumber(parsedParentPosition.maxHeight),
  };
  let parentWidth = width;
  if (parentWidth === undefined && left !== undefined && right !== undefined) {
    parentWidth = targetSize.width - left - right;
  }
  if (parentWidth !== undefined && minWidth !== undefined) {
    parentWidth = Math.max(parentWidth, minWidth);
  }
  if (parentWidth !== undefined && maxWidth !== undefined) {
    parentWidth = Math.min(parentWidth, maxWidth);
  }

  let parentLeft = left;
  if (
    parentLeft === undefined &&
    right !== undefined &&
    parentWidth !== undefined
  ) {
    parentLeft = targetSize.width - right - parentWidth;
  }

  let parentHeight = height;
  if (parentHeight !== undefined && minHeight !== undefined) {
    parentHeight = Math.max(parentHeight, minHeight);
  }
  if (parentHeight !== undefined && maxHeight !== undefined) {
    parentHeight = Math.min(parentHeight, maxHeight);
  }

  let parentTop = top;
  if (
    parentTop === undefined &&
    bottom !== undefined &&
    parentHeight !== undefined
  ) {
    parentTop = targetSize.height - bottom - parentHeight;
  }

  if (parentLeft !== undefined && parentWidth !== undefined) {
    windowPositionOptions.left = parentLeft + parentWidth + 2;
  }
  if (parentTop !== undefined) {
    windowPositionOptions.top = parentTop;
  }
}

/**
 * Returns the position applied on the target by clipping the position to the target's size.
 * Maintains units of the input position.
 * If parent position is provided, returned position is placed top-right of its parent
 */
export function getPositionAppliedOnTarget(
  position: WindowPosition,
  targetSize: DOMRect | null,
  parentPosition?: WindowPosition,
): WindowPosition {
  if (!targetSize) {
    return position;
  }
  const windowPositionOptions = optionsFromWindowPosition(position, targetSize);
  if (parentPosition) {
    applyParentPosition(windowPositionOptions, targetSize, parentPosition);
  }
  const clippedPosition = clipToTargetSize(windowPositionOptions, targetSize);
  const updatedPosition = updateWindowPosition(
    position,
    clippedPosition,
    targetSize,
  );
  return windowPositionFromOptions(updatedPosition);
}
