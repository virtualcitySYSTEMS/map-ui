import {
  PanelLocation,
  getPanelPosition,
  setPanelPosition,
  DefaultPanelPositions,
} from './panelManager.js';

/**
 *
 * @type {Partial<import("./panelManager.js").PanelPosition>}
 */
export const DefaultMainPanelPosition = {
  top: '0px',
  left: '0px',
  right: '0px',
  bottom: '0px',
  width: '100%',
  minWidth: '10%',
  minHeight: '25%',
};

/**
 * @typedef {Object} NumberPanelPosition
 * @property {number?} left - The left CSS property participates in specifying the horizontal position of a panel.
 * @property {number?} top - The top CSS property participates in specifying the vertical position of a panel.
 * @property {number?} right - The right CSS property participates in specifying the horizontal position of a panel.
 * @property {number?} bottom - The bottom CSS property participates in specifying the vertical position of a panel.
 * @property {number} width - The width CSS property sets an element's width.
 * @property {number} height - The height CSS property sets an element's height.
 * @property {number} maxHeight - The maxHeight CSS property sets an element's maximal height.
 * @property {number} maxWidth - The maxWidth CSS property sets an element's maximal width.
 * @property {number} minHeight - The minHeight CSS property sets an element's minimal height.
 * @property {number} minWidth - The minWidth CSS property sets an element's minimal width.
 */
/**
 * Parses a position to numeric percentage value (0-100). Non-numeric values return undefined.
 * @param {string|number|undefined} pos
 * @param {string} key - one of PanelPosition keys
 * @param {DOMRect} targetSize - size of the current target
 * @returns {number|undefined}
 */
export function posToRelativeTarget(pos, key, targetSize) {
  if (typeof pos === 'string') {
    if (pos.match(/^-?\d+\.?\d*px$/)) {
      const scalar = [
        'bottom',
        'top',
        'height',
        'minHeight',
        'maxHeight',
      ].includes(key)
        ? targetSize?.height
        : targetSize?.width;
      return (parseInt(pos, 10) / scalar) * 100;
    } else if (targetSize && pos.match(/^-?\d+\.?\d*%$/)) {
      return parseInt(pos, 10);
    }
    return undefined;
  }
  return pos;
}

/**
 * Parses CSS position string properties to percentage numeric position properties
 * @param {Partial<import("./panelManager.js").PanelPosition>} panelPosition
 * @param {DOMRect} targetSize - the map's target size
 * @returns {NumberPanelPosition}
 */
export function percentageFromPanelOptions(panelPosition, targetSize) {
  const options = {};
  Object.keys(panelPosition).forEach((key) => {
    if (panelPosition[key] !== undefined) {
      options[key] = posToRelativeTarget(panelPosition[key], key, targetSize);
    }
  });
  return options;
}

/**
 * Returns the maximum permitted width of a panel as a function of the main panel minWidth and other active side panel width
 * @param {Partial<import("./panelManager.js").PanelPosition>} main
 * @param {Partial<import("./panelManager.js").PanelPosition>} side
 * @param {DOMRect} targetSize
 * @returns {number}
 */
function getMaxWidth(main, side, targetSize) {
  const maxWidth =
    100 - posToRelativeTarget(main.minWidth, 'minWidth', targetSize);
  if (side) {
    return maxWidth - posToRelativeTarget(side.width, 'width', targetSize);
  }
  return maxWidth;
}

/**
 * Updates side panel width and height
 * Sets new main panel width depending on side panel
 * @param {'left'|'right'} key
 * @param {Partial<import("./panelManager.js").PanelComponent>} panel
 * @param {Partial<NumberPanelPosition>} main
 * @param {Partial<NumberPanelPosition>} side
 * @param {DOMRect} targetSize
 * @returns {Partial<import("./panelManager.js").PanelPosition>}
 */
function handleSidePanel(key, panel, main, side, targetSize) {
  const toUpdate = {};
  const position = percentageFromPanelOptions(
    getPanelPosition(panel),
    targetSize,
  );
  if (side.maxWidth !== position.maxWidth) {
    position.maxWidth = side.maxWidth;
    toUpdate.maxWidth = `${side.maxWidth}%`;
  }

  const width = Math.max(
    position.minWidth,
    Math.min(position.width, position.maxWidth),
  );
  main.width -= width;
  main[key] = width;

  if (width !== position.width) {
    toUpdate.width = `${width}%`;
  }
  if (position.height !== side.height) {
    toUpdate.height = `${side.height}%`;
  }
  return toUpdate;
}

/**
 * Updates size of main panel according to other active panels
 * @param {import("./panelManager.js").default} panelManager
 * @param {Partial<import("./panelManager.js").PanelComponent>} mainPanel
 * @param {DOMRect} targetSize
 * @param {string|undefined} resizeKey
 */
export function updatePanelSizes(
  panelManager,
  mainPanel,
  targetSize,
  resizeKey = undefined,
) {
  const defaultMain = percentageFromPanelOptions(
    DefaultMainPanelPosition,
    targetSize,
  );
  const defaultSide = {
    height: 100,
  };

  if (panelManager.hasLocation(PanelLocation.BOTTOM)) {
    const bottomPanelPosition = getPanelPosition(
      panelManager.getLocation(PanelLocation.BOTTOM),
    );
    const bottomHeight = Math.max(
      posToRelativeTarget(
        bottomPanelPosition.minHeight,
        'minHeight',
        targetSize,
      ),
      Math.min(
        posToRelativeTarget(bottomPanelPosition.height, 'height', targetSize),
        posToRelativeTarget(
          bottomPanelPosition.maxHeight,
          'maxHeight',
          targetSize,
        ),
      ),
    );
    defaultMain.bottom += bottomHeight;
    defaultSide.height -= bottomHeight;
  }

  const leftPanel = panelManager.getLocation(PanelLocation.LEFT);
  const leftWidth =
    posToRelativeTarget(
      getPanelPosition(leftPanel)?.width,
      'width',
      targetSize,
    ) || 0;

  const rightPanel = panelManager.getLocation(PanelLocation.RIGHT);
  const rightWidth =
    posToRelativeTarget(
      getPanelPosition(rightPanel)?.width,
      'width',
      targetSize,
    ) || 0;

  const left = {
    maxWidth: DefaultPanelPositions[PanelLocation.LEFT].maxWidth,
  };

  const right = {
    maxWidth: DefaultPanelPositions[PanelLocation.RIGHT].maxWidth,
  };

  const maxWidth = getMaxWidth(defaultMain, undefined, targetSize);
  if (
    panelManager.hasLocation(PanelLocation.LEFT) &&
    panelManager.hasLocation(PanelLocation.RIGHT) &&
    leftWidth + rightWidth > maxWidth
  ) {
    if (leftWidth > maxWidth / 2 && rightWidth > maxWidth / 2) {
      left.maxWidth = maxWidth / 2;
      right.maxWidth = maxWidth / 2;
    } else if (leftWidth > maxWidth / 2) {
      left.maxWidth = maxWidth - rightWidth;
      right.maxWidth = rightWidth;
    } else if (rightWidth > maxWidth / 2) {
      right.maxWidth = maxWidth - leftWidth;
      left.maxWidth = leftWidth;
    }
  } else {
    left.maxWidth = getMaxWidth(
      defaultMain,
      getPanelPosition(rightPanel),
      targetSize,
    );
    right.maxWidth = getMaxWidth(
      defaultMain,
      getPanelPosition(leftPanel),
      targetSize,
    );
  }

  if (panelManager.hasLocation(PanelLocation.LEFT) && resizeKey !== 'right') {
    const updatedLeft = handleSidePanel(
      'left',
      leftPanel,
      defaultMain,
      {
        ...defaultSide,
        ...left,
      },
      targetSize,
    );
    setPanelPosition(panelManager, leftPanel, updatedLeft);
  }
  if (panelManager.hasLocation(PanelLocation.RIGHT) && resizeKey !== 'left') {
    const updatedRight = handleSidePanel(
      'right',
      rightPanel,
      defaultMain,
      {
        ...defaultSide,
        ...right,
      },
      targetSize,
    );
    setPanelPosition(panelManager, rightPanel, updatedRight);
  }

  const main = percentageFromPanelOptions(
    getPanelPosition(mainPanel),
    targetSize,
  );

  const toUpdate = Object.keys(defaultMain).reduce((acc, key) => {
    if (defaultMain[key] !== main[key]) {
      acc[key] = `${defaultMain[key]}%`;
    }
    return acc;
  }, {});
  if (Object.keys(toUpdate).length > 0) {
    setPanelPosition(panelManager, mainPanel, toUpdate);
  }
}
