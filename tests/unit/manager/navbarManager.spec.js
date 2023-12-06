import {
  describe,
  beforeAll,
  afterAll,
  afterEach,
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
    let action;

    beforeAll(() => {
      navbarManager = new NavbarManager();
      action = {
        name: 'test',
        active: false,
        callback() {
          this.active = !this.active;
        },
      };
    });

    afterAll(() => {
      navbarManager.destroy();
    });

    it('should toggle a buttons state', () => {
      const buttonComponent = navbarManager.add(
        { id: 'test-toggle', action: { ...action } },
        'plugin',
        ButtonLocation.TOOL,
      );
      expect(buttonComponent.action.active).to.be.false;
      navbarManager.toggle('test-toggle');
      expect(buttonComponent.action.active).to.be.true;
    });

    it('should NOT toggle a buttons state, when provided flag equals buttons state', () => {
      const buttonComponent = navbarManager.add(
        { id: 'test-toggle-flag', action: { ...action } },
        'plugin',
        ButtonLocation.TOOL,
      );
      expect(buttonComponent.action.active).to.be.false;
      navbarManager.toggle('test-toggle-flag', false);
      expect(buttonComponent.action.active).to.be.false;
    });
  });
});
