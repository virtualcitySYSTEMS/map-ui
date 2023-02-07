import {
  WindowPositions,
  WindowSlot,
  posToPixel,
  windowPositionFromOptions,
} from './windowManager.js';

/**
 * margin in px at the border of the map target
 * limiting windows to be moved out of screen
 * @type {{top: number, left: number, bottom: number, right: number}}
 */
export const windowMoveMargin = {
  top: 0,
  right: 64,
  bottom: 32,
  left: 64,
};

/**
 * @enum {number}
 * @property {number} TOP_LEFT
 * @property {number} TOP_RIGHT
 * @property {number} BOTTOM_LEFT
 * @property {number} BOTTOM_RIGHT
 */
export const WindowAlignment = {
  TOP_LEFT: 1,
  TOP_RIGHT: 2,
  BOTTOM_LEFT: 3,
  BOTTOM_RIGHT: 4,
};

/**
 *
 * @param {HTMLElement} target
 * @returns {DOMRect|null}
 */
export function getTargetSize(target) {
  if (!target) {
    return null;
  }
  return target.parentElement.getBoundingClientRect();
}

/**
 * WindowPositionOptions from client position relative to a HTMLElement
 * @param {number} x - client pixel position
 * @param {number} y - client pixel position
 * @param {HTMLElement} target - the map's target { @link @import("@vcmap/core").MapCollection }
 * @param {WindowAlignment} [alignment=WindowAlignment.TOP_LEFT]
 * @returns {WindowPositionOptions}
 */
export function getWindowPositionOptions(x, y, target, alignment = WindowAlignment.TOP_LEFT) {
  const targetSize = getTargetSize(target);
  if (!targetSize) {
    return { left: x, top: y };
  }

  const { left, top, width, height } = targetSize;
  if (alignment === WindowAlignment.TOP_LEFT) {
    return { left: x - left, top: y - top };
  } else if (alignment === WindowAlignment.TOP_RIGHT) {
    return { right: (left + width) - x, top: y - top };
  } else if (alignment === WindowAlignment.BOTTOM_LEFT) {
    return { left: x - left, bottom: (height + top) - y };
  }
  return { right: (left + width) - x, bottom: (height + top) - y };
}

/**
 * Get window position options based on a pixel in the map
 * @param {import("@vcmap-cesium/engine").Cartesian2} windowPosition - the window position, as retrieved from an InteractionEvent
 * @param {HTMLElement} target - the map's target { @link @import("@vcmap/core").MapCollection }
 * @param {WindowAlignment} [alignment]
 * @returns {WindowPositionOptions}
 */
export function getWindowPositionOptionsFromMapEvent(windowPosition, target, alignment) {
  const targetSize = getTargetSize(target);
  if (!targetSize) {
    return { left: windowPosition.x, top: windowPosition.y };
  }

  const { left, top } = targetSize;
  return getWindowPositionOptions(windowPosition.x + left, windowPosition.y + top, target, alignment);
}


/**
 * Fits a window aligned top left, so it fits into the parent. This will change the alignment to be bottom or right depending
 * on if the window would not fit into the parent.
 * @param {number} x - client pixel position
 * @param {number} y - client pixel position
 * @param {number} width - window width to fit
 * @param {number} height - window height to fit
 *  @param {HTMLElement} target - the map's target { @link @import("@vcmap/core").MapCollection }
 * @returns {WindowPositionOptions}
 */
export function getFittedWindowPositionOptions(x, y, width, height, target) {
  const targetSize = getTargetSize(target);
  if (!targetSize) {
    return { left: x, top: y };
  }

  const { width: parentWidth, height: parentHeight } = targetSize;
  const bottom = y + height > parentHeight;
  const right = x + width > parentWidth;
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
  return getWindowPositionOptions(x, y, target, alignment);
}

/**
 * Fits a window aligned top left, so it fits into currently active map. This will change the alignment to be bottom or right depending
 * on if the window would not fit into active map element.
 * @param {import("@vcmap-cesium/engine").Cartesian2} windowPosition - the window position, as retrieved from an InteractionEvent
 * @param {number} width
 * @param {number} height
 * @param {HTMLElement} target - the map's target { @link @import("@vcmap/core").MapCollection }
 * @returns {WindowPositionOptions}
 */
export function getFittedWindowPositionOptionsFromMapEvent(windowPosition, width, height, target) {
  const targetSize = getTargetSize(target);
  if (!targetSize) {
    return { left: windowPosition.x, top: windowPosition.y };
  }
  const { left, top } = targetSize;
  return getFittedWindowPositionOptions(windowPosition.x + left, windowPosition.y + top, width, height, target);
}

/**
 * Parses a position to numeric value. Non-numeric values return undefined.
 * @param {string|number|undefined} pos
 * @param {string} key - one of WindowPosition keys
 * @param {DOMRect} targetSize - size of the current target
 * @returns {number|undefined}
 */
export function posToNumber(pos, key, targetSize) {
  if (typeof pos === 'string') {
    if (pos.match(/^-?\d+\.?\d*px$/)) {
      return parseInt(pos, 10);
    } else if (targetSize && pos.match(/^-?\d+\.?\d*%$/)) {
      const scalar = ['bottom', 'top', 'height', 'maxHeight'].includes(key) ? targetSize?.height : targetSize?.width;
      return (parseInt(pos, 10) / 100) * scalar;
    }
    return undefined;
  }
  return pos;
}

/**
 * @param {number} pos
 * @param {string} key - one of WindowPosition keys
 * @param {DOMRect} targetSize - size of the current target
 * @returns {string}
 */
export function posToPercent(pos, key, targetSize) {
  if (!targetSize) {
    return undefined;
  }
  const scalar = ['bottom', 'top', 'height', 'maxHeight'].includes(key) ? targetSize.height : targetSize.width;
  return `${((pos / scalar) * 100).toFixed(0)}%`;
}

/**
 * Parses CSS position string properties to absolute numeric position properties
 * @param {WindowPosition} windowPosition
 * @param {DOMRect} targetSize - the map's target size
 * @returns {WindowPositionOptions|null}
 */
export function optionsFromWindowPosition(windowPosition, targetSize) {
  const options = {};
  Object.keys(windowPosition).forEach((key) => {
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
 * @param {WindowPosition} previous
 * @param {WindowPositionOptions} update
 * @param {DOMRect} targetSize - the map's target size
 * @returns {WindowPosition}
 */
export function updateWindowPosition(previous, update, targetSize) {
  /**
   * returns the position of a key in the same unit 'px' or '%' as previously
   * @param {string} key
   * @param {WindowPosition} prev
   * @param {WindowPositionOptions} updated
   * @returns {string}
   */
  const toString = (key, prev, updated) => {
    if (prev[key] === 'auto' || prev[key] === 'unset' || updated[key] === undefined) {
      return prev[key];
    } else if (updated[key] !== 'auto' && updated[key] !== 'unset') {
      const numeric = posToNumber(updated[key], key, targetSize);
      if (prev[key] && prev[key].match(/^-?\d+\.?\d*px$/)) {
        return posToPixel(numeric);
      } else if (prev[key] && prev[key].match(/^-?\d+%$/)) {
        return posToPercent(numeric, key, targetSize);
      }
    }
    return updated[key];
  };

  const updatedPosition = { ...update };
  Object.keys(previous).forEach((key) => {
    updatedPosition[key] = toString(key, previous, update);
  });
  return updatedPosition;
}


/**
 * Move window position in x and y.
 * Rightward and downward movements are positive.
 * @param {string} id - the window id
 * @param {{dx: number, dy: number}} translation - translation in px
 * @param {WindowManager} windowManager
 * @param {DOMRect} targetSize - the map's target size
 */
export function moveWindow(id, translation, windowManager, targetSize) {
  const { position, slot } = windowManager.get(id);
  if (slot.value === WindowSlot.STATIC) {
    return;
  }
  const windowPositionOptions = optionsFromWindowPosition(position, targetSize);
  if (windowPositionOptions.top !== undefined) {
    windowPositionOptions.top += translation.dy;
  }
  if (windowPositionOptions.bottom !== undefined) {
    windowPositionOptions.bottom -= translation.dy;
  }
  if (windowPositionOptions.left !== undefined) {
    windowPositionOptions.left += translation.dx;
  }
  if (windowPositionOptions.right !== undefined) {
    windowPositionOptions.right -= translation.dx;
  }
  const updatedPosition = updateWindowPosition(position, windowPositionOptions, targetSize);
  windowManager.setWindowPositionOptions(id, updatedPosition);
}

/**
 * Clips a provided WindowPosition corresponding to the size of its target
 * @param {WindowPositionOptions} windowPositionOptions - numerical WindowPositionOptions
 * @param {DOMRect} targetSize - the map's target size
 * @returns {WindowPositionOptions}
 */
export function clipToTargetSize(windowPositionOptions, targetSize) {
  const { width: targetWidth, height: targetHeight } = targetSize;
  if (!targetWidth || !targetHeight) {
    return windowPositionOptions;
  }
  const clippedPosition = {};
  if (windowPositionOptions.top !== undefined) {
    clippedPosition.top = Math.min(
      Math.max(0, windowPositionOptions.top),
      targetHeight - windowMoveMargin.bottom,
    );
  }
  if (windowPositionOptions.bottom !== undefined) {
    const height = windowPositionOptions.height ||
      targetHeight - windowPositionOptions.bottom - windowPositionOptions.top || windowMoveMargin.bottom;
    clippedPosition.bottom = Math.min(
      Math.max(windowPositionOptions.bottom, -height + windowMoveMargin.bottom),
      targetHeight - height,
    );
  }
  if (windowPositionOptions.left !== undefined) {
    const width = windowPositionOptions.width ||
      targetWidth - windowPositionOptions.right - windowPositionOptions.left;
    clippedPosition.left = Math.min(
      Math.max(windowPositionOptions.left, -width + windowMoveMargin.left),
      targetWidth - windowMoveMargin.left,
    );
  }
  if (windowPositionOptions.right !== undefined) {
    const width = windowPositionOptions.width ||
      targetWidth - windowPositionOptions.right - windowPositionOptions.left;
    clippedPosition.right = Math.min(
      Math.max(windowPositionOptions.right, -width + windowMoveMargin.right),
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
  clippedPosition.maxHeight = targetHeight;
  if (windowPositionOptions.maxWidth !== undefined) {
    clippedPosition.maxWidth = Math.min(windowPositionOptions.maxWidth, targetWidth);
  }
  if (windowPositionOptions.maxHeight !== undefined) {
    clippedPosition.maxHeight = Math.min(windowPositionOptions.maxHeight, targetHeight);
  }
  // max width of a top left 2 window (active static window)
  const topLeft2 = posToNumber(WindowPositions.TOP_LEFT2.left, 'left', targetSize);
  if (clippedPosition.left === topLeft2) {
    clippedPosition.maxWidth = Math.min(clippedPosition.maxWidth - topLeft2, targetWidth);
  }

  return clippedPosition;
}

/**
 * Applies the position on the target clipping the position to the target's size.
 * @param {WindowPosition} position
 * @param {DOMRect} targetSize
 * @returns {WindowPosition}
 */
export function applyPositionOnTarget(position, targetSize) {
  if (!targetSize) {
    return position;
  }
  const windowPositionOptions = optionsFromWindowPosition(position, targetSize);
  const clippedPosition = clipToTargetSize(windowPositionOptions, targetSize);
  const updatedPosition = updateWindowPosition(position, clippedPosition, targetSize);
  return windowPositionFromOptions(updatedPosition);
}
