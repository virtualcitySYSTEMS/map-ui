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
        navbarManager = new NavbarManager();
        navbarManager.added.addEventListener(addedSpy);
        buttonComponent = navbarManager.add(buttonComponentOptions, 'plugin', ButtonLocation.TOOL);
      });

      afterAll(() => {
        navbarManager.destroy();
      });

      it('should throw if no location is supplied', () => {
        expect(navbarManager.add.bind(navbarManager, { id: 'test' })).to.throw;
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
          callback() {
          },
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
      navbarManager.add({ ...buttonComponentOptions }, 'plugin3', ButtonLocation.TOOL);
      navbarManager.add({ ...buttonComponentOptions }, 'plugin1', ButtonLocation.MENU);
      navbarManager.add({ ...buttonComponentOptions }, 'plugin2', ButtonLocation.CONTENT);
      navbarManager.add({ ...buttonComponentOptions, action: { name: 'testApp', callback() {} } }, vcsAppSymbol, ButtonLocation.CONTENT);
      const buttonComponents = navbarManager.componentIds.map(id => navbarManager.get(id));
      const actions = getActionsByLocation(buttonComponents, ButtonLocation.CONTENT);
      expect(actions.length).to.be.equal(2);
    });

    it('should get actions sorted by owner', () => {
      navbarManager.add({ ...buttonComponentOptions }, 'plugin1', ButtonLocation.CONTENT);
      navbarManager.add({ ...buttonComponentOptions }, 'plugin2', ButtonLocation.CONTENT);
      navbarManager.add({ ...buttonComponentOptions }, 'plugin3', ButtonLocation.CONTENT);
      navbarManager.add({ ...buttonComponentOptions, action: { name: 'testApp', callback() {} } }, vcsAppSymbol, ButtonLocation.CONTENT);
      const buttonComponents = navbarManager.componentIds.map(id => navbarManager.get(id));
      const actions = getActionsByLocation(buttonComponents, ButtonLocation.CONTENT);
      expect(actions.length).to.be.equal(4);
      expect(actions[0]).to.have.property('name', 'testApp');
    });
  });
});
