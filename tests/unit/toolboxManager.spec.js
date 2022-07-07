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
import { ToolboxManager } from '../../src/manager/toolbox/toolboxManager.js';
import ButtonManager from '../../src/manager/buttonManager.js';
import { vcsAppSymbol } from '../../src/pluginHelper.js';

describe('toolboxManager', () => {
  describe('adding toolboxGroupComponent', () => {
    /** @type {ToolboxManager} */
    let toolboxManager;
    let toolboxGroupComponentOptions;

    beforeAll(() => {
      toolboxGroupComponentOptions = {
        id: 'groupId',
        icon: 'groupIcon',
        title: 'groupTitle',
        buttonComponents: [
          {
            id: 'id',
            action: {
              name: 'test',
              callback() {
              },
            },
          },
        ],
      };
    });

    describe('adding toolboxGroupComponent to the Manager', () => {
      /** @type {ToolboxGroupComponent} */
      let toolboxGroupComponent;
      let addedSpy;

      beforeAll(() => {
        addedSpy = vi.fn();
        toolboxManager = new ToolboxManager();
        toolboxManager.added.addEventListener(addedSpy);
        toolboxGroupComponent = toolboxManager.add(toolboxGroupComponentOptions, 'plugin');
      });

      afterAll(() => {
        toolboxManager.destroy();
      });

      it('should add the toolboxGroupComponent to the manager', () => {
        expect(toolboxManager.has(toolboxGroupComponentOptions.id));
      });
      it('should add the toolboxGroupComponent id to the componentIds array', () => {
        expect(toolboxManager.componentIds).to.have.members([toolboxGroupComponentOptions.id]);
      });
      it('should fire the added Event', () => {
        expect(addedSpy).toHaveBeenCalledTimes(1);
        expect(addedSpy).toHaveBeenLastCalledWith(toolboxGroupComponent);
      });
      it('should throw if now owner is supplied', () => {
        expect(toolboxManager.add.bind(toolboxManager, { id: 'test' })).to.throw;
      });
      it('should throw if same componentId is already managed', () => {
        expect(toolboxManager.add.bind(toolboxManager, [{ id: 'test' }, 'plugin'])).to.throw;
      });

      it('should add new Components at the end of the array', () => {
        const toolboxGroupComponent2 = toolboxManager.add({ ...toolboxGroupComponentOptions, id: 'id2' }, 'plugin2');
        expect(toolboxManager.componentIds.length).to.be.equal(2);
        expect(toolboxManager.componentIds).to.have.ordered.members(
          [toolboxGroupComponent.id, toolboxGroupComponent2.id],
        );
      });

      describe('returns a toolboxGroupComponent', () => {
        it('id should be readonly', () => {
          expect(() => {
            toolboxGroupComponent.id = 'new';
          }).to.throw;
        });
        it('icon should be readonly', () => {
          expect(() => {
            toolboxGroupComponent.icon = 'new';
          }).to.throw;
        });
        it('title should be readonly', () => {
          expect(() => {
            toolboxGroupComponent.title = 'new';
          }).to.throw;
        });
        it('buttonManager should be readonly', () => {
          expect(() => {
            toolboxGroupComponent.buttonManager = new ButtonManager();
          }).to.throw;
        });
      });
    });
  });

  describe('requesting a toolboxGroupComponent', () => {
    /** @type {ToolboxManager} */
    let toolboxManager;
    let toolboxGroupComponentOptions;

    beforeEach(() => {
      toolboxManager = new ToolboxManager();
      toolboxGroupComponentOptions = {
        id: 'groupId',
        icon: 'groupIcon',
        title: 'groupTitle',
        buttonComponents: [
          {
            id: 'id',
            action: {
              name: 'test',
              callback() {
              },
            },
          },
        ],
      };
    });

    afterEach(() => {
      toolboxManager.destroy();
    });

    it('should create a new toolboxGroupComponent, if not existing', () => {
      toolboxManager.requestGroup(toolboxGroupComponentOptions.id);
      expect(toolboxManager.has(toolboxGroupComponentOptions.id));
    });

    it('should return toolboxGroupComponent, if existing', () => {
      toolboxManager.requestGroup(toolboxGroupComponentOptions.id);
      expect(toolboxManager.requestGroup('groupId')).to.equal(toolboxManager.get('groupId'));
    });

    it('should not change an existing group', () => {
      const { id, icon, title } = toolboxGroupComponentOptions;
      const initialGroup = toolboxManager.requestGroup(id, icon, title);
      const group = toolboxManager.requestGroup(id, 'new-icon', 'new-title');
      expect(group).to.equal(initialGroup);
    });
  });

  describe('removing toolboxGroupComponent', () => {
    /** @type {ToolboxManager} */
    let toolboxManager;
    let group1;
    let group2;

    beforeAll(() => {
      toolboxManager = new ToolboxManager();
    });

    beforeEach(() => {
      group1 = toolboxManager.add({ id: 'group1' }, 'plugin');
      group2 = toolboxManager.add({ id: 'group2' }, 'plugin');
    });

    afterEach(() => {
      toolboxManager.clear();
    });

    afterAll(() => {
      toolboxManager.destroy();
    });

    it('should remove it from the toolboxManager', () => {
      expect(toolboxManager.has(group1.id)).to.be.true;
      toolboxManager.remove(group1.id);
      expect(toolboxManager.has(group1.id)).to.be.false;
      expect(toolboxManager.has(group2.id)).to.be.true;
    });
    it('should remove the removed id from the componentId List', () => {
      expect(toolboxManager.componentIds).to.include(group1.id);
      toolboxManager.remove(group1.id);
      expect(toolboxManager.componentIds).to.not.include(group1.id);
    });
    it('should fire the removed event', () => {
      const removedSpy = vi.fn();
      toolboxManager.removed.addEventListener(removedSpy);
      toolboxManager.remove(group1.id);
      expect(removedSpy).toHaveBeenCalledTimes(1);
      expect(removedSpy).toHaveBeenLastCalledWith(group1);
    });
  });

  describe('clearing toolboxGroupComponent of owner', () => {
    /** @type {ToolboxManager} */
    let toolboxManager;
    let group1;
    let group2;

    beforeAll(() => {
      toolboxManager = new ToolboxManager();
    });

    beforeEach(() => {
      group1 = toolboxManager.add({ id: 'group1' }, 'plugin');
      group2 = toolboxManager.add({ id: 'group2' }, vcsAppSymbol);
    });

    afterEach(() => {
      toolboxManager.clear();
    });

    afterAll(() => {
      toolboxManager.destroy();
    });

    it('should NOT remove toolboxGroupComponents', () => {
      expect(toolboxManager.has(group1.id)).to.be.true;
      toolboxManager.removeOwner('plugin');
      expect(toolboxManager.has(group1.id)).to.be.true;
      expect(toolboxManager.has(group2.id)).to.be.true;
    });

    it('should remove all buttonComponents of supplied owner from groups', () => {
      group2.buttonManager.add({
        id: 'id',
        action: {
          name: 'test',
          callback() {
          },
        },
      }, 'plugin');
      expect(group2.buttonManager.componentIds).to.have.members(['id']);
      toolboxManager.removeOwner('plugin');
      expect(group2.buttonManager.componentIds).to.not.include('id');
    });
  });
});
