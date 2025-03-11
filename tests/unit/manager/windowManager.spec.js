import {
  describe,
  beforeAll,
  beforeEach,
  afterAll,
  afterEach,
  expect,
  it,
  vi,
} from 'vitest';
import { computed, isReactive, isRef } from 'vue';
import WindowManager, {
  WindowPositions,
  WindowSlot,
  windowPositionFromOptions,
  isSlotPosition,
} from '../../../src/manager/window/windowManager.js';

describe('windowManager', () => {
  describe('windowPosition Options parser', () => {
    let windowPosition;

    it('should normalize and parse values', () => {
      windowPosition = windowPositionFromOptions({
        left: 15,
        right: '15',
        top: '20px',
        bottom: '15%',
      });
      expect(windowPosition.left).to.equal('15px');
      expect(windowPosition.right).to.equal('15px');
      expect(windowPosition.top).to.equal('20px');
      expect(windowPosition.bottom).to.equal('15%');
    });

    it('should set width to auto, if left and right values are given', () => {
      windowPosition = windowPositionFromOptions({
        left: 15,
        right: '15',
        width: '15',
      });
      expect(windowPosition.width).to.equal('auto');
    });

    it('should set height to auto, if top and bottom values are given', () => {
      windowPosition = windowPositionFromOptions({
        top: 15,
        bottom: '15',
        height: '15',
      });
      expect(windowPosition.height).to.equal('auto');
    });

    it('should set default values', () => {
      windowPosition = windowPositionFromOptions({});
      expect(windowPosition.left).to.equal('200px');
      expect(windowPosition.width).to.equal('320px');
      expect(windowPosition.top).to.equal('200px');
      expect(windowPosition.height).to.equal('auto');
    });

    it('should set default width if right is not set and no width value is given', () => {
      windowPosition = windowPositionFromOptions({
        left: 15,
      });
      expect(windowPosition.width).to.equal('320px');
    });

    it('should set default width if left is not set and no width value is given', () => {
      windowPosition = windowPositionFromOptions({
        right: 15,
      });
      expect(windowPosition.width).to.equal('320px');
    });

    it('should set default left value if neither left or right value is given ', () => {
      windowPosition = windowPositionFromOptions({
        width: 15,
      });
      expect(windowPosition.left).to.equal('200px');
    });

    it('should set undefined values to "unset"', () => {
      windowPosition = windowPositionFromOptions({
        left: 15,
        width: 15,
        top: 15,
      });
      expect(windowPosition.right).to.equal('unset');
      expect(windowPosition.bottom).to.equal('unset');
    });
  });

  describe('adding windowComponents', () => {
    /** @type {WindowManager} */
    let windowManager;
    let windowComponentOptions;

    beforeAll(() => {
      windowComponentOptions = {
        id: 'test',
        slot: WindowSlot.DYNAMIC_LEFT,
        state: {
          hideHeader: true,
          headerTitle: 'test',
          headerIcon: 'icon',
          classes: {
            test: true,
          },
          styles: { 'background-color': 'red' },
        },
      };
    });

    describe('adding one windowComponent to the Manager', () => {
      /** @type {WindowComponent} */
      let windowComponent;
      let addedSpy;

      beforeAll(() => {
        addedSpy = vi.fn();
        windowManager = new WindowManager();
        windowManager.added.addEventListener(addedSpy);
        windowComponent = windowManager.add(windowComponentOptions, 'plugin');
      });

      afterAll(() => {
        windowManager.destroy();
      });

      it('should add the windowComponent to the manager', () => {
        expect(windowManager.has(windowComponentOptions.id));
      });

      it('should add the windowComponentId to the componentIds array', () => {
        expect(windowManager.componentIds).to.have.members([
          windowComponentOptions.id,
        ]);
      });

      it('should fire the added Event', () => {
        expect(addedSpy).toHaveBeenCalledTimes(1);
        expect(addedSpy).toHaveBeenLastCalledWith(windowComponent);
      });

      it('should throw if no owner is supplied', () => {
        expect(
          windowManager.add.bind(windowManager, { id: 'test' }),
        ).to.throw();
      });

      it('should throw if same windowId is already managed', () => {
        expect(
          windowManager.add.bind(windowManager, [{ id: 'test' }, 'plugin']),
        ).to.throw();
      });

      it('should throw if same windowId is already provided as an external id', () => {
        windowManager.addExternalIdToZIndex('test2', 'plugin');
        expect(
          windowManager.add.bind(windowManager, [{ id: 'test2' }, 'plugin']),
        ).to.throw();
      });

      it('should throw if slot DYNAMIC_CHILD is used without parentId or if the parent window is not registered', () => {
        expect(
          windowManager.add.bind(
            windowManager,
            { id: 'testDynamicChild', slot: WindowSlot.DYNAMIC_CHILD },
            'plugin',
          ),
        ).to.throw();
      });

      describe('returns a windowComponent', () => {
        it('id should be readonly', () => {
          expect(() => {
            windowComponent.id = 'new';
          }).to.throw();
        });

        it('state should be readonly', () => {
          expect(() => {
            windowComponent.state = 'new';
          }).to.throw();
        });

        it('state should be reactive', () => {
          expect(isReactive(windowComponent.state)).to.be.true;
        });

        it('component should be readonly', () => {
          expect(() => {
            windowComponent.component = 'new';
          }).to.throw();
        });

        it('headerComponent should be readonly', () => {
          expect(() => {
            windowComponent.headerComponent = 'new';
          }).to.throw();
        });

        it('slot should be readonly', () => {
          expect(() => {
            windowComponent.slot = 'new';
          }).to.throw();
        });

        it('slot should be reactive', () => {
          expect(isRef(windowComponent.slot)).to.be.true;
        });

        it('position should be readonly', () => {
          expect(() => {
            windowComponent.position = 'new';
          }).to.throw();
        });

        it('position should be reactive', () => {
          expect(isReactive(windowComponent.position)).to.be.true;
        });

        it('zIndex should be readonly', () => {
          expect(() => {
            windowComponent.zIndex = computed(() => 5);
          }).to.throw();
        });
      });
    });

    describe('slotBehaviour', () => {
      beforeAll(() => {
        windowManager = new WindowManager();
      });

      afterEach(() => {
        windowManager.clear();
      });

      afterAll(() => {
        windowManager.destroy();
      });

      it('should remove windowComponent at DYNAMIC_LEFT slot on adding a new DYNAMIC_LEFT windowComponent', () => {
        const window1 = windowManager.add(
          { slot: WindowSlot.DYNAMIC_LEFT },
          'plugin',
        );
        const window2 = windowManager.add(
          { slot: WindowSlot.DYNAMIC_LEFT },
          'plugin',
        );
        expect(windowManager.has(window1.id)).to.be.false;
        expect(windowManager.has(window2.id)).to.be.true;
        expect(windowManager.componentIds).to.have.lengthOf(1);
      });

      it('should remove windowComponent at DYNAMIC_RIGHT slot on adding a new DYNAMIC_RIGHT windowComponent', () => {
        const window1 = windowManager.add(
          { slot: WindowSlot.DYNAMIC_RIGHT },
          'plugin',
        );
        const window2 = windowManager.add(
          { slot: WindowSlot.DYNAMIC_RIGHT },
          'plugin',
        );
        expect(windowManager.has(window1.id)).to.be.false;
        expect(windowManager.has(window2.id)).to.be.true;
        expect(windowManager.componentIds).to.have.lengthOf(1);
      });

      it('should remove windowComponent at STATIC slot on adding a new STATIC windowComponent', () => {
        const window1 = windowManager.add(
          { slot: WindowSlot.STATIC },
          'plugin',
        );
        const window2 = windowManager.add(
          { slot: WindowSlot.STATIC },
          'plugin',
        );
        expect(windowManager.has(window1.id)).to.be.false;
        expect(windowManager.has(window2.id)).to.be.true;
        expect(windowManager.componentIds).to.have.lengthOf(1);
      });

      it('should allow several windowComponents at the DETACHED slot', () => {
        const window1 = windowManager.add(
          { slot: WindowSlot.DETACHED },
          'plugin',
        );
        const window2 = windowManager.add(
          { slot: WindowSlot.DETACHED },
          'plugin',
        );
        expect(windowManager.has(window1.id)).to.be.true;
        expect(windowManager.has(window2.id)).to.be.true;
        expect(windowManager.componentIds).to.have.lengthOf(2);
      });

      it('should move dynamicLeft Slot to TOP_LEFT2 if a STATIC Slot is added', () => {
        const window1 = windowManager.add(
          { slot: WindowSlot.DYNAMIC_LEFT },
          'plugin',
        );
        expect(window1.position.left).to.equal(WindowPositions.TOP_LEFT.left);
        const window2 = windowManager.add(
          { slot: WindowSlot.STATIC },
          'plugin',
        );
        expect(window1.position.left).to.equal(WindowPositions.TOP_LEFT2.left);
        expect(windowManager.has(window1.id)).to.be.true;
        expect(windowManager.has(window2.id)).to.be.true;
        expect(windowManager.componentIds).to.have.lengthOf(2);
      });

      it('should move parentless child to TOP_LEFT2 if a STATIC Slot is added', () => {
        const window1 = windowManager.add(
          { slot: WindowSlot.DYNAMIC_CHILD, parentId: 'foo' },
          'plugin',
        );
        expect(window1.position.left).to.equal(WindowPositions.TOP_LEFT.left);
        const window2 = windowManager.add(
          { slot: WindowSlot.STATIC },
          'plugin',
        );
        expect(window1.position.left).to.equal(WindowPositions.TOP_LEFT2.left);
        expect(windowManager.has(window1.id)).to.be.true;
        expect(windowManager.has(window2.id)).to.be.true;
        expect(windowManager.componentIds).to.have.lengthOf(2);
      });
    });

    describe('should handle ordering of windowComponents managing zIndices', () => {
      beforeAll(() => {
        windowManager = new WindowManager();
      });

      afterEach(() => {
        windowManager.clear();
      });

      afterAll(() => {
        windowManager.destroy();
      });

      it('should add new Components at the end of the array', () => {
        const window1 = windowManager.add(
          { slot: WindowSlot.DETACHED },
          'plugin',
        );
        const window2 = windowManager.add(
          { slot: WindowSlot.DETACHED },
          'plugin',
        );
        expect(windowManager.componentIds.length).to.be.equal(2);
        expect(windowManager.componentIds).to.have.ordered.members([
          window1.id,
          window2.id,
        ]);
      });

      it('should update zIndex, if a window is put on top with bringWindowToTop', () => {
        const window1 = windowManager.add(
          { slot: WindowSlot.DETACHED },
          'plugin',
        );
        const window2 = windowManager.add(
          { slot: WindowSlot.DETACHED },
          'plugin',
        );
        expect(window1.zIndex.value).to.equal(0);
        expect(window2.zIndex.value).to.equal(1);
        windowManager.bringWindowToTop(window1.id);
        expect(window1.zIndex.value).to.equal(1);
        expect(window2.zIndex.value).to.equal(0);
      });
    });
  });

  describe('removing windowComponents', () => {
    /** @type {WindowManager} */
    let windowManager;
    let window1;
    let window2;

    beforeAll(() => {
      windowManager = new WindowManager();
    });

    beforeEach(() => {
      window1 = windowManager.add({ slot: WindowSlot.DETACHED }, 'plugin');
      window2 = windowManager.add({ slot: WindowSlot.DETACHED }, 'plugin');
    });

    afterEach(() => {
      windowManager.clear();
    });

    afterAll(() => {
      windowManager.destroy();
    });

    it('should remove it from the windowManager', () => {
      expect(windowManager.has(window1.id)).to.be.true;
      windowManager.remove(window1.id);
      expect(windowManager.has(window1.id)).to.be.false;
      expect(windowManager.has(window2.id)).to.be.true;
    });

    it('should remove the removed id from the windowId List', () => {
      expect(windowManager.componentIds).to.include(window1.id);
      windowManager.remove(window1.id);
      expect(windowManager.componentIds).to.not.include(window1.id);
    });

    it('should fire the removed event', () => {
      const removedSpy = vi.fn();
      windowManager.removed.addEventListener(removedSpy);
      windowManager.remove(window1.id);
      expect(removedSpy).toHaveBeenCalledTimes(1);
      expect(removedSpy).toHaveBeenCalledWith(window1);
    });

    it('should remove child windows, when removing the parent', () => {
      const window3 = windowManager.add(
        { slot: WindowSlot.DYNAMIC_CHILD, parentId: window2.id },
        'plugin',
      );
      expect(windowManager.has(window2.id)).to.be.true;
      expect(windowManager.has(window3.id)).to.be.true;
      windowManager.remove(window2.id);
      expect(windowManager.has(window2.id)).to.be.false;
      expect(windowManager.has(window3.id)).to.be.false;
    });
  });

  describe('caching window position', () => {
    /** @type {WindowManager} */
    let windowManager;
    let window1;

    beforeAll(() => {
      windowManager = new WindowManager();
    });

    beforeEach(() => {
      window1 = windowManager.add({ slot: WindowSlot.DYNAMIC_LEFT }, 'plugin');
    });

    afterEach(() => {
      windowManager.clear();
    });

    afterAll(() => {
      windowManager.destroy();
    });

    describe('on removing a window', () => {
      it('should NOT cache the window position, if the position is the initial position', () => {
        windowManager.remove(window1.id);
        expect(windowManager.getCachedPosition(window1.id)).to.be.undefined;
      });

      it('should cache the window position, if position differs from initial position', () => {
        windowManager.setWindowPositionOptions(window1.id, {
          left: 500,
          top: 40,
        });
        windowManager.remove(window1.id);
        expect(windowManager.getCachedPosition(window1.id)).to.deep.equal(
          window1.position,
        );
      });
    });

    describe('on adding a window', () => {
      let cachedPosition;

      beforeEach(() => {
        windowManager.setWindowPositionOptions(window1.id, {
          left: 500,
          top: 40,
        });
        windowManager.remove(window1.id);
        cachedPosition = windowManager.getCachedPosition(window1.id);
        windowManager.add({ id: window1.id }, 'plugin');
      });

      it('should assign cached window position, if existing', () => {
        expect(window1.position).to.deep.equal(cachedPosition);
      });

      it('should update the dockable state', () => {
        expect(window1.state.dockable).to.be.true;
      });
    });

    describe('on pinning a window', () => {
      it('should clear cached position on pin', () => {
        expect(windowManager.getCachedPosition(window1.id)).to.be.undefined;
      });
    });
  });

  describe('slotBehaviour on removing windowComponents', () => {
    /** @type {WindowManager} */
    let windowManager;
    let windowComponentLeft;
    let windowComponentStatic;

    beforeAll(() => {
      windowManager = new WindowManager();
    });

    beforeEach(() => {
      windowComponentLeft = windowManager.add(
        { slot: WindowSlot.DYNAMIC_LEFT },
        'plugin',
      );
      windowComponentStatic = windowManager.add(
        { slot: WindowSlot.STATIC },
        'plugin',
      );
    });

    afterEach(() => {
      windowManager.clear();
    });

    afterAll(() => {
      windowManager.destroy();
    });

    it('should restore DYNAMIC_LEFT windowComponent Position on STATIC Remove', () => {
      expect(windowComponentLeft.position.left).to.equal(
        WindowPositions.TOP_LEFT2.left,
      );
      windowManager.remove(windowComponentStatic.id);
      expect(windowComponentLeft.position.left).to.equal(
        WindowPositions.TOP_LEFT.left,
      );
    });
  });

  describe('clearing windowComponents of owner', () => {
    /** @type {WindowManager} */
    let windowManager;
    let window1;
    let window2;

    beforeAll(() => {
      windowManager = new WindowManager();
    });

    beforeEach(() => {
      window1 = windowManager.add({ slot: WindowSlot.DETACHED }, 'plugin');
      window2 = windowManager.add({ slot: WindowSlot.DETACHED }, 'app');
      windowManager.addExternalIdToZIndex('external', 'plugin');
    });

    afterEach(() => {
      windowManager.clear();
    });

    afterAll(() => {
      windowManager.destroy();
    });

    it('should remove all windows & external ids of supplied owner from the windowManager', () => {
      expect(windowManager.has(window1.id)).to.be.true;
      windowManager.removeOwner('plugin');
      expect(windowManager.has(window1.id)).to.be.false;
      expect(windowManager.has(window2.id)).to.be.true;
      expect(windowManager.externalZIndexIds).to.not.include('external');
    });

    it('should remove parent and child windows of supplied owner', () => {
      const child = windowManager.add(
        { slot: WindowSlot.DYNAMIC_CHILD, parentId: window1.id },
        'plugin',
      );
      windowManager.removeOwner('plugin');
      expect(windowManager.has(child.id)).to.be.false;
      expect(windowManager.has(window1.id)).to.be.false;
      expect(windowManager.has(window2.id)).to.be.true;
    });
  });

  describe('pin window', () => {
    /** @type {WindowManager} */
    let windowManager;
    let window1;
    let window2;

    beforeAll(() => {
      windowManager = new WindowManager();
    });

    beforeEach(() => {
      window1 = windowManager.add({ slot: WindowSlot.DYNAMIC_LEFT }, 'plugin');
      windowManager.setWindowPositionOptions(window1.id, {
        left: 500,
        top: 40,
      });
      window2 = windowManager.add({ slot: WindowSlot.DYNAMIC_LEFT }, 'app');
      windowManager.pinWindow(window1.id);
    });

    afterEach(() => {
      windowManager.clear();
    });

    afterAll(() => {
      windowManager.destroy();
    });

    it('should reset the slot to the windows initial slot', () => {
      expect(window1.slot.value).to.eq(WindowSlot.DYNAMIC_LEFT);
    });

    it('should reset the position to the windows initial position', () => {
      expect(window1.position.left).to.equal(WindowPositions.TOP_LEFT.left);
      expect(window1.position.top).to.equal(WindowPositions.TOP_LEFT.top);
    });

    it('should update the dockable state', () => {
      expect(window1.state.dockable).to.be.false;
    });

    it('should remove windows at initial slot', () => {
      expect(windowManager.has(window2.id)).to.be.false;
    });

    it('should clear cached position', () => {
      expect(windowManager.getCachedPosition(window1.id)).to.be.undefined;
    });
  });

  describe('setting WindowPositions', () => {
    /** @type {WindowManager} */
    let windowManager;
    let windowComponentLeft;

    beforeAll(() => {
      windowManager = new WindowManager();
    });

    beforeEach(() => {
      windowComponentLeft = windowManager.add(
        { slot: WindowSlot.DYNAMIC_LEFT },
        'plugin',
      );
      windowManager.setWindowPositionOptions(windowComponentLeft.id, {
        left: 15,
        right: 25,
      });
    });

    afterEach(() => {
      windowManager.clear();
    });

    afterAll(() => {
      windowManager.destroy();
    });

    it('should set the given Position to the windowComponent', () => {
      expect(windowComponentLeft.position.left).to.be.equal('15px');
      expect(windowComponentLeft.position.right).to.be.equal('25px');
    });

    it('should Detach a Window if a new Position is set which is not a default POSITION', () => {
      expect(windowComponentLeft.slot.value).to.be.equal(WindowSlot.DETACHED);
    });

    it('should update the dockable state', () => {
      expect(windowComponentLeft.state.dockable).to.be.true;
    });

    it('should reset the initial slot, if window returned to initial position', () => {
      windowManager.pinWindow(windowComponentLeft.id);
      expect(windowComponentLeft.slot.value).to.be.equal(
        WindowSlot.DYNAMIC_LEFT,
      );
    });
  });

  describe('handling of child windows', () => {
    /** @type {WindowManager} */
    let windowManager;
    let childOptions;
    let parentOptions;

    beforeAll(() => {
      windowManager = new WindowManager();
      parentOptions = {
        id: 'test',
        slot: WindowSlot.DYNAMIC_LEFT,
      };

      childOptions = {
        id: 'childTest',
        parentId: parentOptions.id,
        slot: WindowSlot.DYNAMIC_CHILD,
      };
    });

    afterEach(() => {
      windowManager.clear();
    });

    describe('if their parent is not open', () => {
      it('should open the child top left', () => {
        const child = windowManager.add(childOptions, 'plugin');
        expect(isSlotPosition(child.position)).to.be.true;
      });

      it('should override a dynamic left component', () => {
        const dynamicLeft = windowManager.add(
          { slot: WindowSlot.DYNAMIC_LEFT },
          'plugin',
        );
        windowManager.add(childOptions, 'plugin');
        expect(windowManager.has(dynamicLeft.id)).to.be.false;
      });

      it('should override another parent-less child component', () => {
        const otherChild = windowManager.add(
          { parentId: 'foo', slot: WindowSlot.DYNAMIC_CHILD },
          'plugin',
        );
        windowManager.add(childOptions, 'plugin');
        expect(windowManager.has(otherChild.id)).to.be.false;
      });

      it('should render as a child, should the parent be opened', () => {
        const child = windowManager.add(childOptions, 'plugin');
        windowManager.add(parentOptions, 'plugin');
        expect(windowManager.has(child.id)).to.be.true;
        expect(windowManager.has(parentOptions.id)).to.be.true;
      });

      it('should not remove itself when pinning', () => {
        const child = windowManager.add(childOptions, 'plugin');
        windowManager.pinWindow(child.id);
        expect(windowManager.has(child.id)).to.be.true;
      });

      it('should overwrite children of the same parent on pin', () => {
        const child = windowManager.add(childOptions, 'plugin');
        child.slot.value = WindowSlot.DETACHED;
        child.state.dockable = true;
        const child2 = windowManager.add(
          { ...childOptions, id: 'child2' },
          'plugin',
        );
        expect(windowManager.has(child.id)).to.be.true;
        expect(windowManager.has(child2.id)).to.be.true;
        windowManager.pinWindow(child.id);
        expect(windowManager.has(child2.id)).to.be.false;
      });
    });

    describe('if their parent is open', () => {
      beforeEach(() => {
        windowManager.add(parentOptions, 'plugin');
      });

      it('should render as a child', () => {
        const child = windowManager.add(childOptions, 'plugin');
        expect(windowManager.has(child.id)).to.be.true;
        expect(windowManager.has(parentOptions.id)).to.be.true;
      });

      it('should not overwrite other children', () => {
        windowManager.add(
          { id: 'otherParent', slot: WindowSlot.DETACHED },
          'plugin',
        );
        const otherChild = windowManager.add(
          {
            parentId: 'otherParent',
            slot: WindowSlot.DYNAMIC_CHILD,
          },
          'plugin',
        );
        const child = windowManager.add(childOptions, 'plugin');
        expect(windowManager.has(child.id)).to.be.true;
        expect(windowManager.has(parentOptions.id)).to.be.true;
        expect(windowManager.has(otherChild.id)).to.be.true;
      });

      it('should overwrite children of the same parent', () => {
        const otherChild = windowManager.add(
          {
            parentId: parentOptions.id,
            slot: WindowSlot.DYNAMIC_CHILD,
          },
          'plugin',
        );
        const child = windowManager.add(childOptions, 'plugin');
        expect(windowManager.has(child.id)).to.be.true;
        expect(windowManager.has(otherChild.id)).to.be.false;
      });

      it('should not remove itself when pinning', () => {
        const child = windowManager.add(childOptions, 'plugin');
        child.slot.value = WindowSlot.DETACHED;
        child.state.dockable = true;
        windowManager.pinWindow(child.id);
        expect(windowManager.has(child.id)).to.be.true;
      });

      it('should overwrite children of the same parent on pin', () => {
        const child = windowManager.add(childOptions, 'plugin');
        child.slot.value = WindowSlot.DETACHED;
        child.state.dockable = true;
        const child2 = windowManager.add(
          { ...childOptions, id: 'child2' },
          'plugin',
        );
        expect(windowManager.has(child.id)).to.be.true;
        expect(windowManager.has(child2.id)).to.be.true;
        windowManager.pinWindow(child.id);
        expect(windowManager.has(child2.id)).to.be.false;
      });
    });
  });

  describe('external zIndex handling', () => {
    let windowComponentOptions;
    beforeAll(() => {
      windowComponentOptions = {
        id: 'test',
        slot: WindowSlot.DYNAMIC_LEFT,
        state: {
          hideHeader: true,
          headerTitle: 'test',
          headerIcon: 'icon',
          classes: {
            test: true,
          },
          styles: { 'background-color': 'red' },
        },
      };
    });

    describe('adding an external id', () => {
      /** @type {WindowManager} */
      let windowManager;

      beforeEach(() => {
        windowManager = new WindowManager();
      });

      afterEach(() => {
        windowManager.destroy();
      });

      it('should add an external id', () => {
        const zIndex = windowManager.addExternalIdToZIndex('test', 'test');
        expect(zIndex.value).to.equal(0);
        expect(windowManager.externalZIndexIds).to.include('test');
      });

      it('should not add an external id, if there is already a window id with said id', () => {
        windowManager.add(windowComponentOptions, 'test');
        expect(
          windowManager.addExternalIdToZIndex.bind(
            windowManager,
            'test',
            'test',
          ),
        ).to.throw;
      });

      it('should not add an external id, if there is already an external id', () => {
        windowManager.addExternalIdToZIndex('test', 'test');
        expect(
          windowManager.addExternalIdToZIndex.bind(
            windowManager,
            'test',
            'test',
          ),
        ).to.throw;
      });

      it('should push the zIndex', () => {
        windowManager.add(windowComponentOptions, 'test');
        const zIndex = windowManager.addExternalIdToZIndex('test2', 'test');
        expect(zIndex.value).to.equal(1);
      });
    });

    describe('bringing an external id to the top', () => {
      let windowManager;

      beforeAll(() => {
        windowManager = new WindowManager();
      });

      afterAll(() => {
        windowManager.destroy();
      });

      it('should bring the id to the top', () => {
        const testZIndex = windowManager.addExternalIdToZIndex('test', 'test');
        windowManager.addExternalIdToZIndex('test2', 'test');
        windowManager.bringWindowToTop('test');
        expect(testZIndex.value).to.equal(windowManager.maxZIndex);
      });
    });

    describe('removeing an external id', () => {
      /** @type {WindowManager} */
      let windowManager;
      let zIndex;

      beforeAll(() => {
        windowManager = new WindowManager();
        zIndex = windowManager.addExternalIdToZIndex('test', 'plugin');
        windowManager.removeExternalIdFromZIndex('test');
      });

      afterAll(() => {
        windowManager.destroy();
      });

      it('should set the zIndex to -1', () => {
        expect(zIndex.value).to.equal(-1);
      });

      it('should reduce the max zIndex', () => {
        expect(windowManager.maxZIndex).to.equal(-1);
      });

      it('should no longer contain the id', () => {
        expect(windowManager.externalZIndexIds).to.not.include('test');
      });
    });
  });
});
