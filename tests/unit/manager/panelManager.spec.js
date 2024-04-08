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
import { isReactive } from 'vue';
import PanelManager, {
  getPanelPosition,
  PanelLocation,
  setPanelPosition,
} from '../../../src/manager/panel/panelManager.js';

describe('panelManager', () => {
  describe('adding panelComponents', () => {
    /** @type {PanelManager} */
    let panelManager;
    let panelComponentOptions;

    beforeAll(() => {
      panelComponentOptions = {
        id: 'test',
        state: {
          resizable: false,
          classes: {
            test: true,
          },
          styles: { 'background-color': 'red' },
        },
      };
    });

    describe('adding one panelComponent to the Manager', () => {
      /** @type {PanelComponent} */
      let panelComponent;
      let addedSpy;

      beforeAll(() => {
        addedSpy = vi.fn();
        panelManager = new PanelManager();
        panelManager.added.addEventListener(addedSpy);
        panelComponent = panelManager.add(
          panelComponentOptions,
          'plugin',
          PanelLocation.LEFT,
        );
      });

      afterAll(() => {
        panelManager.destroy();
      });

      it('should add the panelComponent to the manager', () => {
        expect(panelManager.has(panelComponentOptions.id));
      });

      it('should add the panelComponentId to the componentIds array', () => {
        expect(panelManager.componentIds).to.have.members([
          panelComponentOptions.id,
        ]);
      });

      it('should fire the added Event', () => {
        expect(addedSpy).toHaveBeenCalledTimes(1);
        expect(addedSpy).toHaveBeenLastCalledWith(panelComponent);
      });

      it('should throw if no owner is supplied', () => {
        expect(
          panelManager.add.bind(
            panelManager,
            { id: 'test' },
            undefined,
            PanelLocation.LEFT,
          ),
        ).to.throw();
      });

      it('should throw if no location is supplied', () => {
        expect(
          panelManager.add.bind(panelManager, { id: 'test' }, 'owner'),
        ).to.throw();
      });

      it('should remove previous panel content, if neccessary', () => {
        const previous = panelManager.add({}, 'owner', PanelLocation.LEFT);
        expect(panelManager.has(previous.id)).to.be.true;
        const current = panelManager.add({}, 'owner', PanelLocation.LEFT);
        expect(panelManager.has(previous.id)).to.be.false;
        expect(panelManager.has(current.id)).to.be.true;
      });

      describe('returns a panelComponent', () => {
        it('id should be readonly', () => {
          expect(() => {
            panelComponent.id = 'new';
          }).to.throw();
        });

        it('state should be readonly', () => {
          expect(() => {
            panelComponent.state = 'new';
          }).to.throw();
        });

        it('state should be reactive', () => {
          expect(isReactive(panelComponent.state)).to.be.true;
        });

        it('component should be readonly', () => {
          expect(() => {
            panelComponent.component = 'new';
          }).to.throw();
        });

        it('position should be reactive', () => {
          expect(isReactive(getPanelPosition(panelComponent))).to.be.true;
        });
      });
    });
  });

  describe('removing panelComponents', () => {
    /** @type {PanelManager} */
    let panelManager;
    let panel1;
    let panel2;

    beforeAll(() => {
      panelManager = new PanelManager();
    });

    beforeEach(() => {
      panel1 = panelManager.add({}, 'plugin', PanelLocation.LEFT);
      panel2 = panelManager.add({}, 'plugin', PanelLocation.RIGHT);
    });

    afterEach(() => {
      panelManager.clear();
    });

    afterAll(() => {
      panelManager.destroy();
    });

    it('should remove it from the panelManager', () => {
      expect(panelManager.has(panel1.id)).to.be.true;
      panelManager.remove(panel1.id);
      expect(panelManager.has(panel1.id)).to.be.false;
      expect(panelManager.has(panel2.id)).to.be.true;
    });

    it('should remove the removed id from the componentId List', () => {
      expect(panelManager.componentIds).to.include(panel1.id);
      panelManager.remove(panel1.id);
      expect(panelManager.componentIds).to.not.include(panel1.id);
    });

    it('should fire the removed event', () => {
      const removedSpy = vi.fn();
      panelManager.removed.addEventListener(removedSpy);
      panelManager.remove(panel1.id);
      expect(removedSpy).toHaveBeenCalledTimes(1);
      expect(removedSpy).toHaveBeenCalledWith(panel1);
    });

    it('should throw if main panel is removed', () => {
      // expect(panelManager.remove.bind(panelManager, main.id)).to.throw();
    });
  });

  describe('caching window position', () => {
    /** @type {PanelManager} */
    let panelManager;
    let panel1;

    beforeAll(() => {
      panelManager = new PanelManager();
    });

    beforeEach(() => {
      panel1 = panelManager.add({}, 'plugin', PanelLocation.LEFT);
    });

    afterEach(() => {
      panelManager.clear();
    });

    afterAll(() => {
      panelManager.destroy();
    });

    describe('on removing a window', () => {
      it('should cache the panel widht and height options', () => {
        setPanelPosition(panel1, { width: '35%' });
        panelManager.remove(panel1.id);
        expect(panelManager.getCachedPosition(panel1.id)).to.have.property(
          'width',
          getPanelPosition(panel1).width,
        );
      });
    });

    describe('on adding a window', () => {
      let cachedPosition;

      beforeEach(() => {
        setPanelPosition(panel1, { width: '35%' });
        panelManager.remove(panel1.id);
        cachedPosition = panelManager.getCachedPosition(panel1.id);
        panelManager.add({ id: panel1.id }, 'plugin', PanelLocation.LEFT);
      });

      it('should assign cached panel position, if existing', () => {
        expect(getPanelPosition(panel1)).to.have.property(
          'width',
          cachedPosition.width,
        );
      });
    });
  });

  describe('clearing panelComponents of owner', () => {
    /** @type {PanelManager} */
    let panelManager;
    let panel1;
    let panel2;

    beforeAll(() => {
      panelManager = new PanelManager();
    });

    beforeEach(() => {
      panel1 = panelManager.add({}, 'plugin', PanelLocation.LEFT);
      panel2 = panelManager.add({}, 'app', PanelLocation.RIGHT);
    });

    afterEach(() => {
      panelManager.clear();
    });

    afterAll(() => {
      panelManager.destroy();
    });

    it('should remove all panels of supplied owner from the panelManager', () => {
      expect(panelManager.has(panel1.id)).to.be.true;
      panelManager.removeOwner('plugin');
      expect(panelManager.has(panel1.id)).to.be.false;
      expect(panelManager.has(panel2.id)).to.be.true;
    });
  });
});
