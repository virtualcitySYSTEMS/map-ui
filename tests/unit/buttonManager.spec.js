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
import { isReactive } from '@vue/composition-api/dist/vue-composition-api.js';
import ButtonManager, {
  ButtonLocation,
  getActionsByLocation,
} from '../../src/manager/buttonManager.js';
import VcsUiApp from '../../src/vcsUiApp.js';
import { vcsAppSymbol } from '../../src/pluginHelper.js';

describe('ButtonManager', () => {
  describe('adding buttonComponents', () => {
    /** @type {ButtonManager} */
    let buttonManager;
    let buttonComponentOptions;

    beforeAll(() => {
      buttonComponentOptions = {
        id: 'id',
        location: ButtonLocation.TOOL,
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
      it('should throw if now button location is supplied', () => {
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

  describe('getting actions from the Manager', () => {
    let app;
    /** @type {ButtonManager} */
    let buttonManager;
    let buttonComponentOptions;

    beforeAll(() => {
      buttonManager = new ButtonManager();
      app = new VcsUiApp();
      app.plugins.add({ name: 'plugin1' });
      app.plugins.add({ name: 'plugin2' });
      app.plugins.add({ name: 'plugin3' });
      buttonComponentOptions = {
        location: ButtonLocation.CONTENT,
        action: {
          name: 'test',
          callback() {
          },
        },
      };
    });

    afterEach(() => {
      buttonManager.clear();
    });

    afterAll(() => {
      buttonManager.destroy();
    });


    it('should get only actions of specified button location', () => {
      buttonManager.add({ ...buttonComponentOptions, location: ButtonLocation.TOOL }, 'plugin3');
      buttonManager.add({ ...buttonComponentOptions, location: ButtonLocation.MENU }, 'plugin1');
      buttonManager.add(buttonComponentOptions, 'plugin2');
      buttonManager.add(buttonComponentOptions, vcsAppSymbol);
      const buttonComponents = buttonManager.componentIds.map(id => buttonManager.get(id));
      const actions = getActionsByLocation(buttonComponents, ButtonLocation.CONTENT);
      expect(actions.length).to.be.equal(2);
    });

    it('should get actions sorted by owner', () => {
      buttonManager.add(buttonComponentOptions, 'plugin3');
      buttonManager.add(buttonComponentOptions, 'plugin1');
      buttonManager.add(buttonComponentOptions, 'plugin2');
      buttonManager.add({ ...buttonComponentOptions, action: { name: 'testApp', callback() {} } }, vcsAppSymbol);
      const buttonComponents = buttonManager.componentIds.map(id => buttonManager.get(id));
      const actions = getActionsByLocation(buttonComponents, ButtonLocation.CONTENT);
      expect(actions.length).to.be.equal(4);
      expect(actions[0]).to.have.property('name', 'testApp');
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
        location: ButtonLocation.CONTENT,
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
        location: ButtonLocation.CONTENT,
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
