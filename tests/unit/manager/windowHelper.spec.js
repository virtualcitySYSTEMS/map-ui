import {
  beforeAll, beforeEach, afterEach, describe, expect, it,
} from 'vitest';
import {
  applyPositionOnTarget,
  clipToTargetSize,
  getFittedWindowPositionOptions,
  getTargetSize,
  getWindowPositionOptions,
  moveWindow,
  optionsFromWindowPosition,
  posToNumber,
  updateWindowPosition,
  WindowAlignment, windowMoveMargin,
} from '../../../src/manager/window/windowHelper.js';
import WindowManager, {
  posToPixel,
  windowPositionFromOptions,
  WindowPositions,
  WindowSlot,
} from '../../../src/manager/window/windowManager.js';

const targetRect = {
  top: 20,
  left: 10,
  width: 190,
  height: 380,
  bottom: 0,
  right: 0,
};

describe('windowHelper', () => {
  let target;
  let targetSize;

  beforeAll(async () => {
    const parentElement = document.createElement('div');
    target = document.createElement('div');
    parentElement.appendChild(target);
    parentElement.getBoundingClientRect = () => (targetRect);
    targetSize = getTargetSize(target);
  });

  describe('window position calculation', () => {
    it('should calculate the position for TOP_LEFT', () => {
      const position = getWindowPositionOptions(20, 40, target, WindowAlignment.TOP_LEFT);
      expect(position).to.have.property('left', 10);
      expect(position).to.have.property('top', 20);
    });

    it('should calculate the position for BOTTOM_LEFT', () => {
      const position = getWindowPositionOptions(20, 40, target, WindowAlignment.BOTTOM_LEFT);
      expect(position).to.have.property('left', 10);
      expect(position).to.have.property('bottom', 360);
    });

    it('should calculate the position for TOP_RIGHT', () => {
      const position = getWindowPositionOptions(20, 40, target, WindowAlignment.TOP_RIGHT);
      expect(position).to.have.property('right', 180);
      expect(position).to.have.property('top', 20);
    });

    it('should calculate the position for BOTTOM_RIGHT', () => {
      const position = getWindowPositionOptions(20, 40, target, WindowAlignment.BOTTOM_RIGHT);
      expect(position).to.have.property('right', 180);
      expect(position).to.have.property('bottom', 360);
    });

    it('should fit a window to the right', () => {
      const position = getFittedWindowPositionOptions(190, 40, 20, 40, target);
      expect(position).to.have.property('right', 10);
      expect(position).to.have.property('top', 20);
    });

    it('should fit a window to the bottom', () => {
      const position = getFittedWindowPositionOptions(20, 390, 20, 40, target);
      expect(position).to.have.property('left', 10);
      expect(position).to.have.property('bottom', 10);
    });

    it('should fit a window to right & bottom', () => {
      const position = getFittedWindowPositionOptions(190, 390, 20, 40, target);
      expect(position).to.have.property('right', 10);
      expect(position).to.have.property('bottom', 10);
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
        expect(updatedPosition).to.have.property('left', posToPixel(targetRect.width / 2));
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
        windowComponent = windowManager.add({
          id: 'test',
          slot: WindowSlot.DYNAMIC_LEFT,
        }, 'plugin');
      });

      afterEach(() => {
        windowManager.destroy();
      });

      it('should update a WindowPosition by a provided translation', () => {
        moveWindow(windowComponent.id, { dx: 50, dy: 100 }, windowManager, targetSize);
        expect(windowComponent.position).to.have.property('left', '50px');
        expect(windowComponent.position).to.have.property('top', '100px');
      });

      it('should remove size restrictions of slots, if slot changes', () => {
        console.log(windowComponent.position.maxWidth);
        expect(windowComponent.slot.value).to.eq(WindowSlot.DYNAMIC_LEFT);
        expect(windowComponent.position).to.have.property('maxWidth', WindowPositions.TOP_LEFT.maxWidth);
        moveWindow(windowComponent.id, { dx: 50, dy: 100 }, windowManager, targetSize);
        expect(windowComponent.slot.value).to.eq(WindowSlot.DETACHED);
        console.log(windowComponent.position.maxWidth);
        expect(windowComponent.position).to.have.property('maxWidth', 'unset');
      });
    });
  });

  describe('Applying position on target', () => {
    describe('clipToTargetSize', () => {
      it('should set upper bound of top to 0', () => {
        const windowPositionOptions = { top: -50 };
        const clippedPosition = clipToTargetSize(windowPositionOptions, targetSize);
        expect(clippedPosition).to.have.property('top', 0);
      });
      it('should set lower bound of top', () => {
        const windowPositionOptions = { top: 500 };
        const clippedPosition = clipToTargetSize(windowPositionOptions, targetSize);
        expect(clippedPosition).to.have.property('top', targetRect.height - windowMoveMargin.bottom);
      });
      it('should set upper bound of bottom', () => {
        const windowPositionOptions = { bottom: 200, height: 200 };
        const clippedPosition = clipToTargetSize(windowPositionOptions, targetSize);
        expect(clippedPosition).to.have.property('bottom', targetRect.height - windowPositionOptions.height);
      });
      it('should set lower bound of bottom', () => {
        const windowPositionOptions = { bottom: -1000, height: 200 };
        const clippedPosition = clipToTargetSize(windowPositionOptions, targetSize);
        expect(clippedPosition).to.have.property('bottom', -windowPositionOptions.height + windowMoveMargin.bottom);
      });
      it('should set min bound of left', () => {
        const windowPositionOptions = { left: -150, width: 100 };
        const clippedPosition = clipToTargetSize(windowPositionOptions, targetSize);
        expect(clippedPosition).to.have.property('left', -windowPositionOptions.width + windowMoveMargin.left);
      });
      it('should set max bound of left', () => {
        const windowPositionOptions = { left: 200, width: 100 };
        const clippedPosition = clipToTargetSize(windowPositionOptions, targetSize);
        expect(clippedPosition).to.have.property('left', targetRect.width - windowMoveMargin.left);
      });
      it('should set min bound of right', () => {
        const windowPositionOptions = { right: -150, width: 100 };
        const clippedPosition = clipToTargetSize(windowPositionOptions, targetSize);
        expect(clippedPosition).to.have.property('right', -windowPositionOptions.width + windowMoveMargin.right);
      });
      it('should set max bound of right', () => {
        const windowPositionOptions = { right: 300, width: 100 };
        const clippedPosition = clipToTargetSize(windowPositionOptions, targetSize);
        expect(clippedPosition).to.have.property('right', targetRect.width - windowMoveMargin.right);
      });
      it('should set maxWidth and maxHeight, if not set', () => {
        const clippedPosition = clipToTargetSize({}, targetSize);
        expect(clippedPosition).to.have.property('maxWidth', targetRect.width);
        expect(clippedPosition).to.have.property('maxHeight', targetRect.height);
      });
      it('should limit maxWidth and maxHeight to the target size', () => {
        const windowPositionOptions = { maxWidth: 500, maxHeight: 500 };
        const clippedPosition = clipToTargetSize(windowPositionOptions, targetSize);
        expect(clippedPosition).to.have.property('maxWidth', targetRect.width);
        expect(clippedPosition).to.have.property('maxHeight', targetRect.height);
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
        const appliedPosition = applyPositionOnTarget(windowPosition, targetSize);
        expect(appliedPosition).to.have.property('top', windowPosition.top);
        expect(appliedPosition).to.have.property('bottom', windowPosition.bottom);
        expect(appliedPosition).to.have.property('left', windowPosition.left);
        expect(appliedPosition).to.have.property('right', windowPosition.right);
        expect(appliedPosition).to.have.property('width', windowPosition.width);
        expect(appliedPosition).to.have.property('height', windowPosition.height);
        expect(appliedPosition).to.have.property('maxWidth', posToPixel(targetRect.width));
        expect(appliedPosition).to.have.property('maxHeight', posToPixel(targetRect.height));
      });
    });
  });
});
