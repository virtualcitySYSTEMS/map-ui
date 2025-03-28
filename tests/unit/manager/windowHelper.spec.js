import {
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
  describe,
  expect,
  it,
} from 'vitest';
import {
  applyParentPosition,
  getPositionAppliedOnTarget,
  clipToTargetSize,
  getFittedWindowPositionOptions,
  getTargetSize,
  getWindowPositionOptions,
  moveWindow,
  optionsFromWindowPosition,
  posToNumber,
  updateWindowPosition,
  WindowAlignment,
  windowMoveMargin,
} from '../../../src/manager/window/windowHelper.js';
import WindowManager, {
  posToPixel,
  windowPositionFromOptions,
  WindowPositions,
  WindowSlot,
} from '../../../src/manager/window/windowManager.js';
import { setupMapTarget } from '../../helpers.js';

const targetRect = {
  top: 20,
  left: 10,
  width: 1900,
  height: 1080,
  bottom: 0,
  right: 0,
};

describe('windowHelper', () => {
  let target;
  let targetSize;
  let destroy;

  beforeAll(async () => {
    ({ target, destroy } = setupMapTarget(targetRect));
    targetSize = getTargetSize(target);
  });

  afterAll(() => destroy());

  describe('window position calculation', () => {
    it('should calculate the position for TOP_LEFT', () => {
      const position = getWindowPositionOptions(
        20,
        40,
        target,
        WindowAlignment.TOP_LEFT,
      );
      expect(position).to.have.property('left', 10);
      expect(position).to.have.property('top', 20);
    });

    it('should calculate the position for BOTTOM_LEFT', () => {
      const position = getWindowPositionOptions(
        20,
        40,
        target,
        WindowAlignment.BOTTOM_LEFT,
      );
      expect(position).to.have.property('left', 20 - targetSize.left);
      expect(position).to.have.property(
        'bottom',
        targetSize.height + targetSize.top - 40,
      );
    });

    it('should calculate the position for TOP_RIGHT', () => {
      const position = getWindowPositionOptions(
        20,
        40,
        target,
        WindowAlignment.TOP_RIGHT,
      );
      expect(position).to.have.property(
        'right',
        targetSize.left + targetSize.width - 20,
      );
      expect(position).to.have.property('top', 40 - targetSize.top);
    });

    it('should calculate the position for BOTTOM_RIGHT', () => {
      const position = getWindowPositionOptions(
        20,
        40,
        target,
        WindowAlignment.BOTTOM_RIGHT,
      );
      expect(position).to.have.property(
        'right',
        targetSize.left + targetSize.width - 20,
      );
      expect(position).to.have.property(
        'bottom',
        targetSize.height + targetSize.top - 40,
      );
    });

    it('should fit a window to the left, if click position is in left half of the screen', () => {
      const position = getFittedWindowPositionOptions(
        200,
        40,
        1800,
        40,
        target,
      );
      expect(position).to.have.property('left', 190);
      expect(position).to.have.property('top', 20);
    });

    it('should fit a window to the right, if click position is in right half of the screen', () => {
      const position = getFittedWindowPositionOptions(
        1800,
        40,
        1800,
        40,
        target,
      );
      expect(position).to.have.property('right', 110);
      expect(position).to.have.property('top', 20);
    });

    it('should fit a window to the top, if click position is in upper half of the screen', () => {
      const position = getFittedWindowPositionOptions(
        20,
        120,
        20,
        1000,
        target,
      );
      expect(position).to.have.property('left', 10);
      expect(position).to.have.property('top', 100);
    });

    it('should fit a window to the bottom, if click position is in lower half of the screen', () => {
      const position = getFittedWindowPositionOptions(
        20,
        1000,
        20,
        1000,
        target,
      );
      expect(position).to.have.property('left', 10);
      expect(position).to.have.property('bottom', 100);
    });

    it('should fit a window to right & bottom', () => {
      const position = getFittedWindowPositionOptions(
        1900,
        1090,
        20,
        40,
        target,
      );
      expect(position).to.have.property('right', 10);
      expect(position).to.have.property('bottom', 10);
    });

    describe('with offset', () => {
      it('should calculate the position for TOP_LEFT', () => {
        const position = getWindowPositionOptions(
          20,
          40,
          target,
          WindowAlignment.TOP_LEFT,
          16,
          16,
        );
        expect(position).to.have.property('left', 26);
        expect(position).to.have.property('top', 4);
      });

      it('should calculate the position for BOTTOM_LEFT', () => {
        const position = getWindowPositionOptions(
          20,
          40,
          target,
          WindowAlignment.BOTTOM_LEFT,
          16,
          16,
        );
        expect(position).to.have.property('left', 20 - targetSize.left + 16);
        expect(position).to.have.property(
          'bottom',
          targetSize.height + targetSize.top - 40 - 16,
        );
      });

      it('should calculate the position for TOP_RIGHT', () => {
        const position = getWindowPositionOptions(
          20,
          40,
          target,
          WindowAlignment.TOP_RIGHT,
          16,
          16,
        );
        expect(position).to.have.property(
          'right',
          targetSize.left + targetSize.width - 20 + 16,
        );
        expect(position).to.have.property('top', 40 - targetSize.top - 16);
      });

      it('should calculate the position for BOTTOM_RIGHT', () => {
        const position = getWindowPositionOptions(
          20,
          40,
          target,
          WindowAlignment.BOTTOM_RIGHT,
          16,
          16,
        );
        expect(position).to.have.property(
          'right',
          targetSize.left + targetSize.width - 20 + 16,
        );
        expect(position).to.have.property(
          'bottom',
          targetSize.height + targetSize.top - 40 - 16,
        );
      });

      it('should fit a window to the right', () => {
        const position = getFittedWindowPositionOptions(
          1900,
          40,
          20,
          40,
          target,
          16,
          16,
        );
        expect(position).to.have.property('right', 26);
        expect(position).to.have.property('top', 4);
      });

      it('should fit a window to the bottom', () => {
        const position = getFittedWindowPositionOptions(
          20,
          1090,
          20,
          40,
          target,
          16,
          16,
        );
        expect(position).to.have.property('left', 26);
        expect(position).to.have.property('bottom', -6);
      });

      it('should fit a window to right & bottom', () => {
        const position = getFittedWindowPositionOptions(
          1900,
          1090,
          20,
          40,
          target,
          16,
          16,
        );
        expect(position).to.have.property('right', 26);
        expect(position).to.have.property('bottom', -6);
      });
    });
  });

  describe('parsing WindowPosition to numerical values', () => {
    it('should parse pixel values', () => {
      const top = posToNumber('150px', 'top', targetSize);
      expect(top).to.equal(150);
    });

    it('should parse negative pixel values', () => {
      const top = posToNumber('-150px', 'top', targetSize);
      expect(top).to.equal(-150);
    });

    it('should round floating pixel to integer', () => {
      const top = posToNumber('150.156px', 'top', targetSize);
      expect(top).to.equal(150);
    });

    it('should parse percent values', () => {
      const left = posToNumber('25%', 'left', targetSize);
      const top = posToNumber('-25%', 'top', targetSize);
      expect(left).to.equal(targetSize.width / 4);
      expect(top).to.equal(-targetSize.height / 4);
    });

    it('should return undefined for non numeric values', () => {
      const top = posToNumber('unset', 'top', targetSize);
      expect(top).to.equal(undefined);
    });

    it('should parse WindowPosition to numeric values', () => {
      const parsedPosition = optionsFromWindowPosition(
        {
          top: '0px',
          left: '0px',
          right: 'unset',
          bottom: '20px',
          width: '50%',
          height: 'auto',
        },
        targetSize,
      );
      expect(parsedPosition).to.have.property('top', 0);
      expect(parsedPosition).to.have.property('left', 0);
      expect(parsedPosition).to.have.property('right', undefined);
      expect(parsedPosition).to.have.property('bottom', 20);
      expect(parsedPosition).to.have.property('width', targetSize.width / 2);
      expect(parsedPosition).to.have.property('height', undefined);
    });
  });

  describe('Updating a WindowPosition', () => {
    describe('updateWindowPosition', () => {
      let previous;
      let update;
      let updatedPosition;

      beforeAll(() => {
        previous = windowPositionFromOptions(WindowPositions.TOP_LEFT);
        update = { left: '50%', width: '250px', bottom: 50 };
        updatedPosition = updateWindowPosition(previous, update, targetSize);
      });

      it('should not update untouched values', () => {
        expect(updatedPosition).to.have.property('top', '0px');
      });

      it('should not update unset values', () => {
        expect(updatedPosition).to.have.property('bottom', 'unset');
        expect(updatedPosition).to.have.property('right', 'unset');
      });

      it('should not update auto values', () => {
        expect(updatedPosition).to.have.property('height', 'auto');
      });

      it('should update values keeping units', () => {
        expect(updatedPosition).to.have.property(
          'left',
          posToPixel(targetRect.width / 2),
        );
      });

      it('should update new values', () => {
        expect(updatedPosition).to.have.property('width', '250px');
      });
    });

    describe('moveWindow', () => {
      /** @type {WindowManager} */
      let windowManager;
      let windowComponent;

      beforeEach(() => {
        windowManager = new WindowManager();
        windowComponent = windowManager.add(
          {
            id: 'test',
            slot: WindowSlot.DYNAMIC_LEFT,
          },
          'plugin',
        );
      });

      afterEach(() => {
        windowManager.destroy();
      });

      it('should update a WindowPosition by a provided translation', () => {
        moveWindow(
          windowComponent.id,
          { dx: 50, dy: 100 },
          windowManager,
          targetSize,
        );
        expect(windowComponent.position).to.have.property('left', '50px');
        expect(windowComponent.position).to.have.property('top', '100px');
      });
    });
  });

  describe('Applying position on target', () => {
    describe('clipToTargetSize', () => {
      it('should set upper bound of top to 0', () => {
        const windowPositionOptions = { top: -50 };
        const clippedPosition = clipToTargetSize(
          windowPositionOptions,
          targetSize,
        );
        expect(clippedPosition).to.have.property('top', 0);
      });

      it('should set lower bound of top', () => {
        const windowPositionOptions = { top: 1090 };
        const clippedPosition = clipToTargetSize(
          windowPositionOptions,
          targetSize,
        );
        expect(clippedPosition).to.have.property(
          'top',
          targetRect.height - windowMoveMargin.bottom,
        );
      });

      it('should set upper bound of bottom', () => {
        const windowPositionOptions = { bottom: 2000, height: 200 };
        const clippedPosition = clipToTargetSize(
          windowPositionOptions,
          targetSize,
        );
        expect(clippedPosition).to.have.property(
          'bottom',
          targetRect.height - windowPositionOptions.height,
        );
      });

      it('should set lower bound of bottom', () => {
        const windowPositionOptions = { bottom: -1000, height: 200 };
        const clippedPosition = clipToTargetSize(
          windowPositionOptions,
          targetSize,
        );
        expect(clippedPosition).to.have.property(
          'bottom',
          -windowPositionOptions.height + windowMoveMargin.bottom,
        );
      });

      it('should set min bound of left', () => {
        const windowPositionOptions = { left: -150, width: 100 };
        const clippedPosition = clipToTargetSize(
          windowPositionOptions,
          targetSize,
        );
        expect(clippedPosition).to.have.property(
          'left',
          -windowPositionOptions.width + windowMoveMargin.left,
        );
      });

      it('should set max bound of left', () => {
        const windowPositionOptions = { left: 2000, width: 100 };
        const clippedPosition = clipToTargetSize(
          windowPositionOptions,
          targetSize,
        );
        expect(clippedPosition).to.have.property(
          'left',
          targetRect.width - windowMoveMargin.left,
        );
      });

      it('should set min bound of right', () => {
        const windowPositionOptions = { right: -150, width: 100 };
        const clippedPosition = clipToTargetSize(
          windowPositionOptions,
          targetSize,
        );
        expect(clippedPosition).to.have.property(
          'right',
          -windowPositionOptions.width + windowMoveMargin.right,
        );
      });

      it('should set max bound of right', () => {
        const windowPositionOptions = { right: 1900, width: 100 };
        const clippedPosition = clipToTargetSize(
          windowPositionOptions,
          targetSize,
        );
        expect(clippedPosition).to.have.property(
          'right',
          targetRect.width - windowMoveMargin.right,
        );
      });

      it('should set maxWidth and maxHeight, if not set', () => {
        const clippedPosition = clipToTargetSize({}, targetSize);
        expect(clippedPosition).to.have.property('maxWidth', targetRect.width);
        expect(clippedPosition).to.have.property(
          'maxHeight',
          targetRect.height - 4,
        );
      });

      it('should limit maxWidth and maxHeight to the target size', () => {
        const windowPositionOptions = { maxWidth: 2500, maxHeight: 1500 };
        const clippedPosition = clipToTargetSize(
          windowPositionOptions,
          targetSize,
        );
        expect(clippedPosition).to.have.property('maxWidth', targetRect.width);
        expect(clippedPosition).to.have.property(
          'maxHeight',
          targetRect.height,
        );
      });

      it('should limit maxWidth of a TOP_LEFT2 positioned window, if a static window is active', () => {
        const windowPositionOptions = optionsFromWindowPosition(
          { ...WindowPositions.TOP_LEFT2, width: 1000 },
          targetSize,
        );
        const clippedPosition = clipToTargetSize(
          windowPositionOptions,
          targetSize,
        );
        const topLeft2 = posToNumber(
          WindowPositions.TOP_LEFT2.left,
          'left',
          targetSize,
        );
        expect(clippedPosition).to.have.property(
          'maxWidth',
          targetRect.width - topLeft2,
        );
        expect(clippedPosition).to.have.property(
          'maxHeight',
          targetRect.height - 4,
        );
      });
    });

    describe('applyParentPosition', () => {
      it('should apply a parent position', () => {
        const windowPosition = optionsFromWindowPosition(
          {
            top: '10px',
            left: '60px',
            width: '20px',
            height: '20px',
          },
          targetSize,
        );
        const parentPosition = optionsFromWindowPosition(
          {
            top: '20px',
            left: '10%',
            width: '20%',
          },
          targetSize,
        );
        applyParentPosition(windowPosition, targetSize, parentPosition);
        expect(windowPosition).to.have.property('top', parentPosition.top);
        expect(windowPosition).to.have.property(
          'left',
          parentPosition.left + parentPosition.width + 2,
        );
        expect(windowPosition).to.have.property('width', windowPosition.width);
        expect(windowPosition).to.have.property(
          'height',
          windowPosition.height,
        );
      });

      it('should consider minWidth of parent', () => {
        const windowPosition = optionsFromWindowPosition(
          {
            top: '10px',
            left: '60px',
            width: '20px',
            height: '20px',
          },
          targetSize,
        );
        const parentPosition = optionsFromWindowPosition(
          {
            top: '20px',
            left: '10%',
            width: '200px',
            minWidth: '300px',
          },
          targetSize,
        );
        applyParentPosition(windowPosition, targetSize, parentPosition);
        expect(windowPosition).to.have.property('top', parentPosition.top);
        expect(windowPosition).to.have.property(
          'left',
          parentPosition.left + parentPosition.minWidth + 2,
        );
      });

      it('should derive parentWidth from left right', () => {
        const windowPosition = optionsFromWindowPosition(
          {
            top: '10px',
            left: '60px',
            width: '20px',
            height: '20px',
          },
          targetSize,
        );
        const parentPosition = optionsFromWindowPosition(
          {
            top: '20px',
            left: '10%',
            right: '20%',
          },
          targetSize,
        );
        const parentWidth =
          targetSize.width - parentPosition.left - parentPosition.right;
        applyParentPosition(windowPosition, targetSize, parentPosition);
        expect(windowPosition).to.have.property('top', parentPosition.top);
        expect(windowPosition).to.have.property(
          'left',
          parentPosition.left + parentWidth + 2,
        );
      });

      it('should derive parentTop from bottom and height', () => {
        const windowPosition = optionsFromWindowPosition(
          {
            top: '10px',
            left: '60px',
            width: '20px',
            height: '20px',
          },
          targetSize,
        );
        const parentPosition = optionsFromWindowPosition(
          {
            bottom: '20px',
            left: '10%',
            width: '200px',
            height: '20%',
          },
          targetSize,
        );
        const parentTop =
          targetSize.height - parentPosition.bottom - parentPosition.height;
        applyParentPosition(windowPosition, targetSize, parentPosition);
        expect(windowPosition).to.have.property('top', parentTop);
        expect(windowPosition).to.have.property(
          'left',
          parentPosition.left + parentPosition.width + 2,
        );
      });
    });

    describe('applyPositionOnTarget', () => {
      it('should apply all boundary conditions of the target', () => {
        const windowPosition = {
          top: '20px',
          bottom: '500px',
          left: '10%',
          right: 'unset',
          width: '110%',
          height: 'auto',
        };
        const appliedPosition = getPositionAppliedOnTarget(
          windowPosition,
          targetSize,
        );
        expect(appliedPosition).to.have.property('top', windowPosition.top);
        expect(appliedPosition).to.have.property(
          'bottom',
          windowPosition.bottom,
        );
        expect(appliedPosition).to.have.property('left', windowPosition.left);
        expect(appliedPosition).to.have.property('right', windowPosition.right);
        expect(appliedPosition).to.have.property('width', windowPosition.width);
        expect(appliedPosition).to.have.property(
          'height',
          windowPosition.height,
        );
        expect(appliedPosition).to.have.property(
          'maxWidth',
          posToPixel(targetRect.width),
        );
        expect(appliedPosition).to.have.property(
          'maxHeight',
          posToPixel(targetRect.height - 4),
        );
      });
    });
  });
});
