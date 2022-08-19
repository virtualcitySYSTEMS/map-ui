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
import ButtonManager from '../../../src/manager/buttonManager.js';
import { vcsAppSymbol } from '../../../src/pluginHelper.js';

describe('ButtonManager', () => {
  describe('adding buttonComponents', () => {
    /** @type {ButtonManager} */
    let buttonManager;
    let buttonComponentOptions;

    beforeAll(() => {
      buttonComponentOptions = {
        id: 'id',
        action: {
          name: 'test',
          callback() {
          },
        },
      };
    });

    describe('adding one buttonComponent to the Manager', () => {
      /** @type {ButtonComponent} */
      let buttonComponent;
      let addedSpy;

      beforeAll(() => {
        addedSpy = vi.fn();
        buttonManager = new ButtonManager();
        buttonManager.added.addEventListener(addedSpy);
        buttonComponent = buttonManager.add(buttonComponentOptions, 'plugin');
      });

      afterAll(() => {
        buttonManager.destroy();
      });

      it('should add the buttonComponent to the manager', () => {
        expect(buttonManager.has(buttonComponentOptions.id));
      });
      it('should add the buttonComponentId to the componentIds array', () => {
        expect(buttonManager.componentIds).to.have.members([buttonComponentOptions.id]);
      });
      it('should fire the added Event', () => {
        expect(addedSpy).toHaveBeenCalledTimes(1);
        expect(addedSpy).toHaveBeenLastCalledWith(buttonComponent);
      });
      it('should throw if now owner is supplied', () => {
        expect(buttonManager.add.bind(buttonManager, { id: 'test' })).to.throw;
      });
      it('should throw if same buttonId is already managed', () => {
        expect(buttonManager.add.bind(buttonManager, [{ id: 'test' }, 'plugin'])).to.throw;
      });

      it('should add new Components at the end of the array', () => {
        const buttonComponent2 = buttonManager.add({ ...buttonComponentOptions, id: 'id2' }, 'plugin2');
        expect(buttonManager.componentIds.length).to.be.equal(2);
        expect(buttonManager.componentIds).to.have.ordered.members([buttonComponent.id, buttonComponent2.id]);
      });

      describe('returns a buttonComponent', () => {
        it('id should be readonly', () => {
          expect(() => {
            buttonComponent.id = 'new';
          }).to.throw;
        });
        it('action should be readonly', () => {
          expect(() => {
            buttonComponent.action = 'new';
          }).to.throw;
        });
        it('action should be reactive', () => {
          expect(isReactive(buttonComponent.action)).to.be.true;
        });
      });
    });
  });

  describe('removing buttonComponents', () => {
    /** @type {ButtonManager} */
    let buttonManager;
    let buttonComponentOptions;
    let button1;
    let button2;

    beforeAll(() => {
      buttonManager = new ButtonManager();
      buttonComponentOptions = {
        action: {
          name: 'test',
          callback: () => {},
        },
      };
    });

    beforeEach(() => {
      button1 = buttonManager.add(buttonComponentOptions, 'plugin');
      button2 = buttonManager.add(buttonComponentOptions, 'plugin');
    });

    afterEach(() => {
      buttonManager.clear();
    });

    afterAll(() => {
      buttonManager.destroy();
    });

    it('should remove it from the buttonManager', () => {
      expect(buttonManager.has(button1.id)).to.be.true;
      buttonManager.remove(button1.id);
      expect(buttonManager.has(button1.id)).to.be.false;
      expect(buttonManager.has(button2.id)).to.be.true;
    });
    it('should remove the removed id from the buttonId List', () => {
      expect(buttonManager.componentIds).to.include(button1.id);
      buttonManager.remove(button1.id);
      expect(buttonManager.componentIds).to.not.include(button1.id);
    });
    it('should fire the removed event', () => {
      const removedSpy = vi.fn();
      buttonManager.removed.addEventListener(removedSpy);
      buttonManager.remove(button1.id);
      expect(removedSpy).toHaveBeenCalledTimes(1);
      expect(removedSpy).toHaveBeenLastCalledWith(button1);
    });
  });

  describe('clearing buttonComponents of owner', () => {
    /** @type {ButtonManager} */
    let buttonManager;
    let buttonComponentOptions;
    let button1;
    let button2;

    beforeAll(() => {
      buttonManager = new ButtonManager();
      buttonComponentOptions = {
        action: {
          name: 'test',
          callback: () => {},
        },
      };
    });

    beforeEach(() => {
      button1 = buttonManager.add(buttonComponentOptions, 'plugin');
      button2 = buttonManager.add(buttonComponentOptions, vcsAppSymbol);
    });

    afterEach(() => {
      buttonManager.clear();
    });

    afterAll(() => {
      buttonManager.destroy();
    });

    it('should remove all buttons of supplied owner from the buttonManager', () => {
      expect(buttonManager.has(button1.id)).to.be.true;
      buttonManager.removeOwner('plugin');
      expect(buttonManager.has(button1.id)).to.be.false;
      expect(buttonManager.has(button2.id)).to.be.true;
    });
  });
});
