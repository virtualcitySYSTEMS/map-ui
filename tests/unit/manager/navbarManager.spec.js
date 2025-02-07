import {
  describe,
  beforeAll,
  afterAll,
  afterEach,
  beforeEach,
  expect,
  it,
  vi,
} from 'vitest';
import NavbarManager, {
  ButtonLocation,
  locationSymbol,
  getActionsByLocation,
} from '../../../src/manager/navbarManager.js';
import VcsUiApp from '../../../src/vcsUiApp.js';
import { vcsAppSymbol } from '../../../src/pluginHelper.js';

describe('NavbarManager', () => {
  describe('adding buttonComponents', () => {
    /** @type {NavbarManager} */
    let navbarManager;
    let buttonComponentOptions;

    beforeAll(() => {
      buttonComponentOptions = {
        id: 'id',
        action: {
          name: 'test',
          callback() {},
        },
      };
    });

    describe('adding one buttonComponent to the Manager', () => {
      /** @type {ButtonComponent} */
      let buttonComponent;
      let addedSpy;

      beforeAll(() => {
        addedSpy = vi.fn();
        navbarManager = new NavbarManager();
        navbarManager.added.addEventListener(addedSpy);
        buttonComponent = navbarManager.add(
          buttonComponentOptions,
          'plugin',
          ButtonLocation.TOOL,
        );
      });

      afterAll(() => {
        navbarManager.destroy();
      });

      it('should throw if no location is supplied', () => {
        expect(
          navbarManager.add.bind(navbarManager, { id: 'test' }),
        ).to.throw();
      });

      describe('returns a buttonComponent', () => {
        it('should have a location symbol', () => {
          expect(buttonComponent).to.have.property(locationSymbol);
        });
      });
    });
  });

  describe('getting actions from the Manager', () => {
    let app;
    /** @type {NavbarManager} */
    let navbarManager;
    let buttonComponentOptions;

    beforeAll(() => {
      navbarManager = new NavbarManager();
      app = new VcsUiApp();
      app.plugins.add({ name: 'plugin1' });
      app.plugins.add({ name: 'plugin2' });
      app.plugins.add({ name: 'plugin3' });
      buttonComponentOptions = {
        action: {
          name: 'test',
          callback() {},
        },
      };
    });

    afterEach(() => {
      navbarManager.clear();
    });

    afterAll(() => {
      navbarManager.destroy();
    });

    it('should get only actions of specified button location', () => {
      navbarManager.add(
        { ...buttonComponentOptions },
        'plugin3',
        ButtonLocation.TOOL,
      );
      navbarManager.add(
        { ...buttonComponentOptions },
        'plugin1',
        ButtonLocation.MENU,
      );
      navbarManager.add(
        { ...buttonComponentOptions },
        'plugin2',
        ButtonLocation.CONTENT,
      );
      navbarManager.add(
        {
          ...buttonComponentOptions,
          action: { name: 'testApp', callback() {} },
        },
        vcsAppSymbol,
        ButtonLocation.CONTENT,
      );
      const buttonComponents = navbarManager.componentIds.map((id) =>
        navbarManager.get(id),
      );
      const actions = getActionsByLocation(
        buttonComponents,
        ButtonLocation.CONTENT,
      );
      expect(actions.length).to.be.equal(2);
    });

    it('should get actions sorted by owner', () => {
      navbarManager.add(
        { ...buttonComponentOptions },
        'plugin1',
        ButtonLocation.CONTENT,
      );
      navbarManager.add(
        { ...buttonComponentOptions },
        'plugin2',
        ButtonLocation.CONTENT,
      );
      navbarManager.add(
        { ...buttonComponentOptions },
        'plugin3',
        ButtonLocation.CONTENT,
      );
      navbarManager.add(
        {
          ...buttonComponentOptions,
          action: { name: 'testApp', callback() {} },
        },
        vcsAppSymbol,
        ButtonLocation.CONTENT,
      );
      const buttonComponents = navbarManager.componentIds.map((id) =>
        navbarManager.get(id),
      );
      const actions = getActionsByLocation(
        buttonComponents,
        ButtonLocation.CONTENT,
      );
      expect(actions.length).to.be.equal(4);
      expect(actions[0]).to.have.property('name', 'testApp');
    });

    it('should get actions sorted by weight and owner', () => {
      navbarManager.add(
        { action: { name: 'plugin1', callback() {} } },
        'plugin1',
        ButtonLocation.CONTENT,
      );
      navbarManager.add(
        { action: { name: 'plugin2', callback() {} }, weight: 1 },
        'plugin2',
        ButtonLocation.CONTENT,
      );
      navbarManager.add(
        { action: { name: 'plugin3', callback() {} }, weight: -1 },
        'plugin3',
        ButtonLocation.CONTENT,
      );
      navbarManager.add(
        {
          ...buttonComponentOptions,
          action: { name: 'testApp', callback() {} },
        },
        vcsAppSymbol,
        ButtonLocation.CONTENT,
      );
      const buttonComponents = navbarManager.componentIds.map((id) =>
        navbarManager.get(id),
      );
      const actions = getActionsByLocation(
        buttonComponents,
        ButtonLocation.CONTENT,
      );
      expect(actions.length).to.be.equal(4);
      expect(actions.map((a) => a.name)).to.have.ordered.members([
        'plugin2',
        'testApp',
        'plugin1',
        'plugin3',
      ]);
    });
  });

  describe('toggling buttons from the Manager', () => {
    /** @type {NavbarManager} */
    let navbarManager;
    let buttonComponent;

    beforeAll(() => {
      navbarManager = new NavbarManager();
    });

    beforeEach(() => {
      buttonComponent = navbarManager.add(
        {
          id: 'test-toggle',
          action: {
            name: 'test',
            active: false,
            callback() {
              this.active = !this.active;
            },
          },
        },
        'plugin',
        ButtonLocation.TOOL,
      );
    });

    afterEach(() => {
      navbarManager.remove(buttonComponent.id);
    });

    afterAll(() => {
      navbarManager.destroy();
    });

    it('should toggle a buttons state', () => {
      expect(buttonComponent.action.active).to.be.false;
      navbarManager.toggle('test-toggle');
      expect(buttonComponent.action.active).to.be.true;
    });

    it('should NOT toggle a buttons state, when provided flag equals buttons state', () => {
      expect(buttonComponent.action.active).to.be.false;
      navbarManager.toggle('test-toggle-flag', false);
      expect(buttonComponent.action.active).to.be.false;
    });

    it('should not click a callback, if the action is disabled', () => {
      buttonComponent.action.disabled = true;
      navbarManager.toggle('test-toggle');
      expect(buttonComponent.action.active).to.be.false;
    });

    it('should click an action, if the action is active, the state is active, but the action is in the background', () => {
      buttonComponent.action.callback = vi.fn();
      buttonComponent.action.active = true;
      buttonComponent.action.background = true;
      navbarManager.toggle('test-toggle', true);
      expect(buttonComponent.action.callback).toHaveBeenCalled();
    });

    it('should not click an action, if its active in the background and the passed state is false', () => {
      buttonComponent.action.callback = vi.fn();
      buttonComponent.action.active = true;
      buttonComponent.action.background = true;
      navbarManager.toggle('test-toggle', false);
      expect(buttonComponent.action.callback).not.toHaveBeenCalled();
    });
  });
});
