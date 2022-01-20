import sinon from 'sinon';
import { isReactive, isRef } from '@vue/composition-api';
import {
  WINDOW_POSITIONS,
  WindowManager,
  windowPositionFromOptions,
  windowSlot,
} from '../../src/modules/window-manager/windowManager.js';


describe('windowManager', () => {
  let sandbox;

  before(() => {
    sandbox = sinon.createSandbox();
  });

  after(() => {
    sandbox.restore();
  });

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
      expect(windowPosition.right).to.equal('15');
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

    before(() => {
      windowComponentOptions = {
        id: 'test',
        slot: windowSlot.DYNAMIC_LEFT,
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

      before(() => {
        addedSpy = sandbox.spy();
        windowManager = new WindowManager();
        windowManager.added.addEventListener(addedSpy);
        windowComponent = windowManager.add(windowComponentOptions);
      });

      after(() => {
        windowManager.destroy();
      });

      it('should add the windowComponent to the manager', () => {
        expect(windowManager.has(windowComponentOptions.id));
      });
      it('should add the windowComponentId to the windowIds array', () => {
        expect(windowManager.windowIds).to.have.members([windowComponentOptions.id]);
      });
      it('should fire the added Event', () => {
        expect(addedSpy).to.have.been.calledOnce;
        expect(addedSpy.calledWith(windowComponent)).to.be.true;
      });
      it('should throw if same windowId is already managed', () => {
        expect(windowManager.add.bind(windowManager, { id: 'test' })).to.throw;
      });

      describe('returns a windowComponent', () => {
        it('id should be readonly', () => {
          expect(() => { windowComponent.id = 'new'; }).to.throw;
        });
        it('state should be readonly', () => {
          expect(() => { windowComponent.state = 'new'; }).to.throw;
        });
        it('state should be reactive', () => {
          expect(isReactive(windowComponent.state)).to.be.true;
        });
        it('component should be readonly', () => {
          expect(() => { windowComponent.component = 'new'; }).to.throw;
        });
        it('headerComponent should be readonly', () => {
          expect(() => { windowComponent.headerComponent = 'new'; }).to.throw;
        });
        it('slot should be readonly', () => {
          expect(() => { windowComponent.slot = 'new'; }).to.throw;
        });
        it('slot should be reactive', () => {
          expect(isRef(windowComponent.slot)).to.be.true;
        });
        it('position should be readonly', () => {
          expect(() => { windowComponent.position = 'new'; }).to.throw;
        });
        it('position should be reactive', () => {
          expect(isReactive(windowComponent.position)).to.be.true;
        });
      });
    });

    describe('slotBehaviour', () => {
      before(() => {
        windowManager = new WindowManager();
      });

      afterEach(() => {
        windowManager.clear();
      });

      after(() => {
        windowManager.destroy();
      });

      it('should remove windowComponent at DYNAMIC_LEFT slot on adding a new DYNAMIC_LEFT windowComponent', () => {
        const window1 = windowManager.add({ slot: windowSlot.DYNAMIC_LEFT });
        const window2 = windowManager.add({ slot: windowSlot.DYNAMIC_LEFT });
        expect(windowManager.has(window1.id)).to.be.false;
        expect(windowManager.has(window2.id)).to.be.true;
        expect(windowManager.windowIds).to.have.lengthOf(1);
      });
      it('should remove windowComponent at DYNAMIC_RIGHT slot on adding a new DYNAMIC_RIGHT windowComponent', () => {
        const window1 = windowManager.add({ slot: windowSlot.DYNAMIC_RIGHT });
        const window2 = windowManager.add({ slot: windowSlot.DYNAMIC_RIGHT });
        expect(windowManager.has(window1.id)).to.be.false;
        expect(windowManager.has(window2.id)).to.be.true;
        expect(windowManager.windowIds).to.have.lengthOf(1);
      });
      it('should remove windowComponent at STATIC slot on adding a new STATIC windowComponent', () => {
        const window1 = windowManager.add({ slot: windowSlot.STATIC });
        const window2 = windowManager.add({ slot: windowSlot.STATIC });
        expect(windowManager.has(window1.id)).to.be.false;
        expect(windowManager.has(window2.id)).to.be.true;
        expect(windowManager.windowIds).to.have.lengthOf(1);
      });
      it('should allow several windowComponents at the DETACHED slot', () => {
        const window1 = windowManager.add({ slot: windowSlot.DETACHED });
        const window2 = windowManager.add({ slot: windowSlot.DETACHED });
        expect(windowManager.has(window1.id)).to.be.true;
        expect(windowManager.has(window2.id)).to.be.true;
        expect(windowManager.windowIds).to.have.lengthOf(2);
      });
      it('should move dynamicLeft Slot to TOP_LEFT2 if a STATIC Slot is added', () => {
        const window1 = windowManager.add({ slot: windowSlot.DYNAMIC_LEFT });
        expect(window1.position.left).to.equal(WINDOW_POSITIONS.TOP_LEFT.left);
        const window2 = windowManager.add({ slot: windowSlot.STATIC });
        expect(window1.position.left).to.equal(WINDOW_POSITIONS.TOP_LEFT2.left);
        expect(windowManager.has(window1.id)).to.be.true;
        expect(windowManager.has(window2.id)).to.be.true;
        expect(windowManager.windowIds).to.have.lengthOf(2);
      });
    });

    describe('should handle ordering of windowComponents', () => {
      before(() => {
        windowManager = new WindowManager();
      });

      afterEach(() => {
        windowManager.clear();
      });

      after(() => {
        windowManager.destroy();
      });

      it('should add new Components at the end of the array', () => {
        const window1 = windowManager.add({ slot: windowSlot.DETACHED });
        const window2 = windowManager.add({ slot: windowSlot.DETACHED });
        expect(windowManager.windowIds.length).to.be.equal(2);
        expect(windowManager.windowIds).to.have.ordered.members([window1.id, window2.id]);
      });
      it('should reorder array, if a window is put on top with bringWindowToTop', () => {
        const window1 = windowManager.add({ slot: windowSlot.DETACHED });
        const window2 = windowManager.add({ slot: windowSlot.DETACHED });
        expect(windowManager.windowIds).to.have.ordered.members([window1.id, window2.id]);
        windowManager.bringWindowToTop(window1.id);
        expect(windowManager.windowIds).to.have.ordered.members([window2.id, window1.id]);
      });
    });
  });

  describe('removing windowComponents', () => {
    /** @type {WindowManager} */
    let windowManager;
    let window1;
    let window2;

    before(() => {
      windowManager = new WindowManager();
    });

    beforeEach(() => {
      window1 = windowManager.add({ slot: windowSlot.DETACHED });
      window2 = windowManager.add({ slot: windowSlot.DETACHED });
    });

    afterEach(() => {
      windowManager.clear();
    });

    after(() => {
      windowManager.destroy();
    });

    it('should remove it from the windowManager', () => {
      expect(windowManager.has(window1.id)).to.be.true;
      windowManager.remove(window1.id);
      expect(windowManager.has(window1.id)).to.be.false;
      expect(windowManager.has(window2.id)).to.be.true;
    });
    it('should remove the removed id from the windowId List', () => {
      expect(windowManager.windowIds).to.include(window1.id);
      windowManager.remove(window1.id);
      expect(windowManager.windowIds).to.not.include(window1.id);
    });
    it('should fire the removed event', () => {
      const removedSpy = sandbox.spy();
      windowManager.removed.addEventListener(removedSpy);
      windowManager.remove(window1.id);
      expect(removedSpy).to.have.been.calledOnce;
      expect(removedSpy.calledWith(window1)).to.be.true;
    });
  });
  describe('slotBehaviour on removing windowComponents', () => {
    /** @type {WindowManager} */
    let windowManager;
    let windowComponentLeft;
    let windowComponentStatic;

    before(() => {
      windowManager = new WindowManager();
    });

    beforeEach(() => {
      windowComponentLeft = windowManager.add({ slot: windowSlot.DYNAMIC_LEFT });
      windowComponentStatic = windowManager.add({ slot: windowSlot.STATIC });
    });

    afterEach(() => {
      windowManager.clear();
    });

    after(() => {
      windowManager.destroy();
    });
    it('should restore DYNAMIC_LEFT windowComponent Position on STATIC Remove', () => {
      expect(windowComponentLeft.position.left).to.equal(WINDOW_POSITIONS.TOP_LEFT2.left);
      windowManager.remove(windowComponentStatic.id);
      expect(windowComponentLeft.position.left).to.equal(WINDOW_POSITIONS.TOP_LEFT.left);
    });
  });

  describe('setting WindowPositions', () => {
    /** @type {WindowManager} */
    let windowManager;
    let windowComponentLeft;

    before(() => {
      windowManager = new WindowManager();
    });

    beforeEach(() => {
      windowComponentLeft = windowManager.add({ slot: windowSlot.DYNAMIC_LEFT });
      windowManager.setWindowPositionOptions(windowComponentLeft.id, {
        left: 15,
        right: 25,
      });
    });

    afterEach(() => {
      windowManager.clear();
    });

    after(() => {
      windowManager.destroy();
    });

    it('should Detach a Window if a new Position is set which is not a default POSITION', () => {
      expect(windowComponentLeft.slot.value).to.be.equal(windowSlot.DETACHED);
    });
    it('should set the given Position to the windowComponent', () => {
      expect(windowComponentLeft.position.left).to.be.equal('15px');
      expect(windowComponentLeft.position.right).to.be.equal('25px');
    });
  });
});
