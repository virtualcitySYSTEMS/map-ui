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
import ToolboxManager, {
  getComponentsByOrder,
  ToolboxType,
} from '../../../src/manager/toolbox/toolboxManager.js';
import ButtonManager from '../../../src/manager/buttonManager.js';
import { vcsAppSymbol } from '../../../src/pluginHelper.js';

const components = {
  single: {
    id: 'single',
    type: ToolboxType.SINGLE,
    action: {
      name: 'single',
      icon: 'single',
      active: false,
      callback() {
        this.active = !this.active;
      },
    },
  },
  select: {
    id: 'select',
    type: ToolboxType.SELECT,
    action: {
      name: 'select',
      active: false,
      currentIndex: 0,
      callback() {},
      selected() {},
      tools: [
        {
          name: 'foo',
          icon: 'foo',
        },
        {
          name: 'bar',
          icon: 'bar',
        },
      ],
    },
  },
  group: {
    id: 'group',
    type: ToolboxType.GROUP,
    icon: 'group',
  },
};

describe('toolboxManager', () => {
  describe('adding toolboxComponents', () => {
    /** @type {ToolboxManager} */
    let toolboxManager;

    describe('adding SingleToolboxComponent', () => {
      let toolboxComponent;
      let addedSpy;

      beforeAll(() => {
        addedSpy = vi.fn();
        toolboxManager = new ToolboxManager();
        toolboxManager.added.addEventListener(addedSpy);
        toolboxComponent = toolboxManager.add(components.single, 'plugin');
      });

      afterAll(() => {
        toolboxManager.destroy();
      });

      it('should add the component to the manager', () => {
        expect(toolboxManager.has(components.single.id));
      });
      it('should add the component id to the componentIds array', () => {
        expect(toolboxManager.componentIds).to.have.members([
          components.single.id,
        ]);
      });
      it('should fire the added Event', () => {
        expect(addedSpy).toHaveBeenCalledTimes(1);
        expect(addedSpy).toHaveBeenLastCalledWith(toolboxComponent);
      });
      it('should throw if no owner is supplied', () => {
        expect(
          toolboxManager.add.bind(toolboxManager, { id: components.single.id }),
        ).to.throw;
      });
      it('should throw if same componentId is already managed', () => {
        expect(
          toolboxManager.add.bind(toolboxManager, [
            { id: components.single.id },
            'plugin',
          ]),
        ).to.throw;
      });

      it('should add new components at the end of the array', () => {
        const toolboxComponent2 = toolboxManager.add(
          { ...components.single, id: 'id2' },
          'plugin2',
        );
        expect(toolboxManager.componentIds.length).to.be.equal(2);
        expect(toolboxManager.componentIds).to.have.ordered.members([
          toolboxComponent.id,
          toolboxComponent2.id,
        ]);
      });

      describe('returns a SingleToolboxComponent', () => {
        it('id should be readonly', () => {
          expect(() => {
            toolboxComponent.id = 'new';
          }).to.throw;
        });
        it('type should be readonly', () => {
          expect(() => {
            toolboxComponent.type = 'new';
          }).to.throw;
        });
        it('owner should be readonly', () => {
          expect(() => {
            toolboxComponent.owner = 'new';
          }).to.throw;
        });
        it('action should be readonly', () => {
          expect(() => {
            toolboxComponent.action = { name: 'new' };
          }).to.throw;
        });
        it('action should be reactive', () => {
          expect(isReactive(toolboxComponent.action)).to.be.true;
        });
      });
    });

    describe('adding SelectToolboxComponent', () => {
      let toolboxComponent;
      let addedSpy;

      beforeAll(() => {
        addedSpy = vi.fn();
        toolboxManager = new ToolboxManager();
        toolboxManager.added.addEventListener(addedSpy);
        toolboxComponent = toolboxManager.add(components.select, 'plugin');
      });

      afterAll(() => {
        toolboxManager.destroy();
      });

      it('should add the component to the manager', () => {
        expect(toolboxManager.has(components.select.id));
      });
      it('should add the component id to the componentIds array', () => {
        expect(toolboxManager.componentIds).to.have.members([
          components.select.id,
        ]);
      });
      it('should fire the added Event', () => {
        expect(addedSpy).toHaveBeenCalledTimes(1);
        expect(addedSpy).toHaveBeenLastCalledWith(toolboxComponent);
      });
      it('should throw if no owner is supplied', () => {
        expect(
          toolboxManager.add.bind(toolboxManager, { id: components.select.id }),
        ).to.throw;
      });
      it('should throw if same componentId is already managed', () => {
        expect(
          toolboxManager.add.bind(toolboxManager, [
            { id: components.select.id },
            'plugin',
          ]),
        ).to.throw;
      });

      it('should add new components at the end of the array', () => {
        const toolboxComponent2 = toolboxManager.add(
          { ...components.select, id: 'id2' },
          'plugin2',
        );
        expect(toolboxManager.componentIds.length).to.be.equal(2);
        expect(toolboxManager.componentIds).to.have.ordered.members([
          toolboxComponent.id,
          toolboxComponent2.id,
        ]);
      });

      describe('returns a SelectToolboxComponent', () => {
        it('id should be readonly', () => {
          expect(() => {
            toolboxComponent.id = 'new';
          }).to.throw;
        });
        it('type should be readonly', () => {
          expect(() => {
            toolboxComponent.type = 'new';
          }).to.throw;
        });
        it('owner should be readonly', () => {
          expect(() => {
            toolboxComponent.owner = 'new';
          }).to.throw;
        });
        it('action should be readonly', () => {
          expect(() => {
            toolboxComponent.action = { name: 'new' };
          }).to.throw;
        });
        it('action should be reactive', () => {
          expect(isReactive(toolboxComponent.action)).to.be.true;
        });
      });
    });

    describe('adding GroupToolboxComponent', () => {
      let toolboxComponent;
      let addedSpy;

      beforeAll(() => {
        addedSpy = vi.fn();
        toolboxManager = new ToolboxManager();
        toolboxManager.added.addEventListener(addedSpy);
        toolboxComponent = toolboxManager.add(components.group, 'plugin');
      });

      afterAll(() => {
        toolboxManager.destroy();
      });

      it('should add the component to the manager', () => {
        expect(toolboxManager.has(components.group.id));
      });
      it('should add the component id to the componentIds array', () => {
        expect(toolboxManager.componentIds).to.have.members([
          components.group.id,
        ]);
      });
      it('should fire the added Event', () => {
        expect(addedSpy).toHaveBeenCalledTimes(1);
        expect(addedSpy).toHaveBeenLastCalledWith(toolboxComponent);
      });
      it('should throw if no owner is supplied', () => {
        expect(
          toolboxManager.add.bind(toolboxManager, { id: components.group.id }),
        ).to.throw;
      });
      it('should throw if same componentId is already managed', () => {
        expect(
          toolboxManager.add.bind(toolboxManager, [
            { id: components.group.id },
            'plugin',
          ]),
        ).to.throw;
      });

      it('should add new components at the end of the array', () => {
        const toolboxComponent2 = toolboxManager.add(
          { ...components.group, id: 'id2' },
          'plugin2',
        );
        expect(toolboxManager.componentIds.length).to.be.equal(2);
        expect(toolboxManager.componentIds).to.have.ordered.members([
          toolboxComponent.id,
          toolboxComponent2.id,
        ]);
      });

      describe('returns a GroupToolboxComponent', () => {
        it('id should be readonly', () => {
          expect(() => {
            toolboxComponent.id = 'new';
          }).to.throw;
        });
        it('type should be readonly', () => {
          expect(() => {
            toolboxComponent.type = 'new';
          }).to.throw;
        });
        it('owner should be readonly', () => {
          expect(() => {
            toolboxComponent.owner = 'new';
          }).to.throw;
        });
        it('icon should be readonly', () => {
          expect(() => {
            toolboxComponent.icon = 'new';
          }).to.throw;
        });
        it('title should be readonly', () => {
          expect(() => {
            toolboxComponent.title = 'new';
          }).to.throw;
        });
        it('buttonManager should be readonly', () => {
          expect(() => {
            toolboxComponent.buttonManager = new ButtonManager();
          }).to.throw;
        });
      });
    });
  });

  describe('getting a toolboxComponent', () => {
    /** @type {ToolboxManager} */
    let toolboxManager;

    beforeEach(() => {
      toolboxManager = new ToolboxManager();
      Object.values(components).forEach((comp) =>
        toolboxManager.add(comp, 'plugin'),
      );
    });

    afterEach(() => {
      toolboxManager.destroy();
    });

    it('should return toolboxComponent, if existing', () => {
      /**
       * @type {SingleToolboxComponent}
       */
      const comp = toolboxManager.get(components.single.id);
      expect(comp.id).to.equal(components.single.id);
      expect(comp.type).to.equal(components.single.type);
      expect(comp.action.name).to.equal(components.single.action.name);
      expect(comp.action.callback).to.equal(components.single.action.callback);
    });

    describe('getComponentsByOrder', () => {
      it('should return toolboxComponent sorted by owner and plugin order', () => {
        toolboxManager.add({ ...components.single, id: 'id2' }, vcsAppSymbol);
        const ordered = getComponentsByOrder(
          toolboxManager.componentIds.map((id) => toolboxManager.get(id)),
        );
        expect(ordered.map((c) => c.id)).to.have.ordered.members([
          'id2',
          components.single.id,
          components.select.id,
          components.group.id,
        ]);
      });
    });
  });

  describe('removing toolboxComponent', () => {
    /** @type {ToolboxManager} */
    let toolboxManager;

    beforeAll(() => {
      toolboxManager = new ToolboxManager();
    });

    beforeEach(() => {
      toolboxManager = new ToolboxManager();
      Object.values(components).forEach((comp) =>
        toolboxManager.add(comp, 'plugin'),
      );
    });

    afterEach(() => {
      toolboxManager.clear();
    });

    afterAll(() => {
      toolboxManager.destroy();
    });

    it('should remove it from the toolboxManager', () => {
      expect(toolboxManager.has(components.single.id)).to.be.true;
      toolboxManager.remove(components.single.id);
      expect(toolboxManager.has(components.single.id)).to.be.false;
      expect(toolboxManager.has(components.select.id)).to.be.true;
      expect(toolboxManager.has(components.group.id)).to.be.true;
    });
    it('should remove the removed id from the componentId List', () => {
      expect(toolboxManager.componentIds).to.include(components.single.id);
      toolboxManager.remove(components.single.id);
      expect(toolboxManager.componentIds).to.not.include(components.single.id);
    });
    it('should fire the removed event', () => {
      const removedSpy = vi.fn();
      toolboxManager.removed.addEventListener(removedSpy);
      toolboxManager.remove(components.single.id);
      expect(removedSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('clearing toolboxGroupComponent of owner', () => {
    /** @type {ToolboxManager} */
    let toolboxManager;

    beforeAll(() => {
      toolboxManager = new ToolboxManager();
    });

    beforeEach(() => {
      toolboxManager = new ToolboxManager();
      Object.values(components).forEach((comp) =>
        toolboxManager.add(comp, 'plugin'),
      );
    });

    afterEach(() => {
      toolboxManager.clear();
    });

    afterAll(() => {
      toolboxManager.destroy();
    });

    it('should remove toolboxComponents of provided owner', () => {
      expect(toolboxManager.has(components.single.id)).to.be.true;
      toolboxManager.removeOwner('plugin');
      expect(toolboxManager.has(components.single.id)).to.be.false;
      expect(toolboxManager.has(components.select.id)).to.be.false;
      expect(toolboxManager.has(components.group.id)).to.be.false;
    });

    it('should NOT remove toolboxComponents of other owners', () => {
      toolboxManager.add({ ...components.single, id: 'id2' }, vcsAppSymbol);
      toolboxManager.removeOwner('plugin');
      expect(toolboxManager.has(components.single.id)).to.be.false;
      expect(toolboxManager.has(components.select.id)).to.be.false;
      expect(toolboxManager.has(components.group.id)).to.be.false;
      expect(toolboxManager.has('id2')).to.be.true;
    });
  });
});
