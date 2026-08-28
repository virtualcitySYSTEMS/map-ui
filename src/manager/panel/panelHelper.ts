import type { PanelComponent, PanelPosition } from './panelManager.js';
import type PanelManager from './panelManager.js';
import {
  PanelLocation,
  getPanelPosition,
  setPanelPosition,
  DefaultPanelPositions,
} from './panelManager.js';

export const defaultMainPanelPosition: PanelPosition = {
  top: '0px',
  left: '0px',
  right: '0px',
  bottom: '0px',
  width: '100%',
  minWidth: '10%',
  minHeight: '25%',
};

/**
 * Parses a position to numeric percentage value (0-100). Non-numeric values return undefined.
 */
export function posToRelativeTarget(
  pos: string | number | undefined,
  key: string,
  targetSize: DOMRect,
): number | undefined {
  if (typeof pos === 'string') {
    if (pos.match(/^-?\d+\.?\d*px$/)) {
      const scalar = [
        'bottom',
        'top',
        'height',
        'minHeight',
        'maxHeight',
      ].includes(key)
        ? targetSize.height
        : targetSize.width;
      return (parseInt(pos, 10) / scalar) * 100;
    } else if (pos.match(/^-?\d+\.?\d*%$/)) {
      return parseInt(pos, 10);
    }
    return undefined;
  }
  return pos;
}

/**
 * Parses CSS position string properties to percentage numeric position properties
 */
export function percentageFromPanelOptions(
  panelPosition: Partial<PanelPosition> | undefined,
  targetSize: DOMRect,
): PanelPosition<number> {
  const options: PanelPosition<number> = {};
  const source = panelPosition ?? {};
  (Object.keys(source) as (keyof PanelPosition)[]).forEach((key) => {
    const parsed = posToRelativeTarget(source[key], key, targetSize);
    options[key] = parsed;
  });
  return options;
}

/**
 * Returns the maximum permitted width of a panel as a function of the main panel minWidth and other active side panel width
 */
function getMaxWidth(
  main: PanelPosition<string | number>,
  side: PanelPosition | undefined,
  targetSize: DOMRect,
): number {
  const minWidth =
    posToRelativeTarget(main.minWidth, 'minWidth', targetSize) ?? 0;
  const maxWidth = 100 - minWidth;
  if (side) {
    const sideWidth = posToRelativeTarget(side.width, 'width', targetSize) ?? 0;
    return maxWidth - sideWidth;
  }
  return maxWidth;
}

/**
 * Updates side panel width and height
 * Sets new main panel width depending on side panel
 */
function handleSidePanel(
  key: 'left' | 'right',
  panel: Partial<PanelComponent>,
  main: PanelPosition<number>,
  side: PanelPosition<number>,
  targetSize: DOMRect,
): PanelPosition {
  const toUpdate: Partial<PanelPosition> = {};
  const position = percentageFromPanelOptions(
    getPanelPosition(panel) ?? {},
    targetSize,
  );

  if (side.maxWidth !== undefined && side.maxWidth !== position.maxWidth) {
    position.maxWidth = side.maxWidth;
    toUpdate.maxWidth = `${side.maxWidth}%`;
  }

  const minWidth = position.minWidth ?? 0;
  const currentWidth = position.width ?? 0;
  const maxWidth = position.maxWidth ?? 100;
  const width = Math.max(minWidth, Math.min(currentWidth, maxWidth));

  main.width = (main.width ?? 0) - width;
  main[key] = width;

  if (width !== currentWidth) {
    toUpdate.width = `${width}%`;
  }
  if (side.height !== undefined && position.height !== side.height) {
    toUpdate.height = `${side.height}%`;
  }
  return toUpdate;
}

/**
 * Updates size of main panel according to other active panels
 */
export function updatePanelSizes(
  panelManager: PanelManager,
  mainPanel: Partial<PanelComponent>,
  targetSize: DOMRect,
  resizeKey?: string,
): void {
  const defaultMain = percentageFromPanelOptions(
    defaultMainPanelPosition,
    targetSize,
  );
  const defaultSide: PanelPosition<number> = { height: 100 };

  if (panelManager.hasLocation(PanelLocation.BOTTOM)) {
    const bottomPanelPosition = getPanelPosition(
      panelManager.getLocation(PanelLocation.BOTTOM),
    );
    const bottomHeight = Math.max(
      posToRelativeTarget(
        bottomPanelPosition?.minHeight,
        'minHeight',
        targetSize,
      ) ?? 0,
      Math.min(
        posToRelativeTarget(
          bottomPanelPosition?.height,
          'height',
          targetSize,
        ) ?? 0,
        posToRelativeTarget(
          bottomPanelPosition?.maxHeight,
          'maxHeight',
          targetSize,
        ) ?? 0,
      ),
    );
    defaultMain.bottom = (defaultMain.bottom ?? 0) + bottomHeight;
    defaultSide.height = (defaultSide.height ?? 100) - bottomHeight;
  }

  const leftPanel = panelManager.getLocation(PanelLocation.LEFT);
  const leftWidth =
    posToRelativeTarget(
      getPanelPosition(leftPanel)?.width,
      'width',
      targetSize,
    ) ?? 0;

  const rightPanel = panelManager.getLocation(PanelLocation.RIGHT);
  const rightWidth =
    posToRelativeTarget(
      getPanelPosition(rightPanel)?.width,
      'width',
      targetSize,
    ) ?? 0;

  const left: PanelPosition<number> = {
    maxWidth:
      posToRelativeTarget(
        DefaultPanelPositions[PanelLocation.LEFT].maxWidth,
        'maxWidth',
        targetSize,
      ) ?? 100,
  };

  const right: PanelPosition<number> = {
    maxWidth:
      posToRelativeTarget(
        DefaultPanelPositions[PanelLocation.RIGHT].maxWidth,
        'maxWidth',
        targetSize,
      ) ?? 100,
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
    getPanelPosition(mainPanel) ?? {},
    targetSize,
  );

  const toUpdate = (Object.keys(defaultMain) as (keyof PanelPosition)[]).reduce<
    Partial<PanelPosition>
  >((acc, key) => {
    const nextValue = defaultMain[key];
    if (nextValue !== undefined && nextValue !== main[key]) {
      acc[key] = `${nextValue}%`;
    }
    return acc;
  }, {});

  if (Object.keys(toUpdate).length > 0) {
    setPanelPosition(panelManager, mainPanel, toUpdate);
  }
}
