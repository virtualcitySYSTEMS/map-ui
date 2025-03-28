import { describe, beforeAll, afterAll, expect, it } from 'vitest';
import { IndexedCollection } from '@vcmap/core';
import VcsUiApp from '../../../src/vcsUiApp.js';
import CollectionComponentClass from '../../../src/manager/collectionManager/collectionComponentClass.js';
import {
  isEditorCollectionComponentClass,
  makeEditorCollectionComponentClass,
} from '../../../src/manager/collectionManager/editorCollectionComponentClass.js';
import { sleep } from '../../helpers.js';

const parentId = 'testParentWindow';

const component = {
  name: 'TestEditorComponent',
};

function getTestEditorOptions(collectionComponent) {
  return {
    editor: {
      component,
      state: {
        headerTitle: 'Editor',
        headerIcon: '$vcsEdit',
      },
      position: {
        width: 300,
      },
      props: {
        getConfig() {},
        setConfig() {},
      },
    },
    multiEditor: {
      component,
      state: {
        headerTitle: 'Multi Editor',
        headerIcon: '$vcsPen',
      },
      position: {
        width: 300,
      },
      props: {
        multi: true,
        selection: collectionComponent.selection,
        getConfig() {},
        setConfig() {},
      },
    },
  };
}

describe('EditorCollectionComponentClass', () => {
  describe('create a new instance', () => {
    let app;
    let collectionComponent;
    let collectionComponentOptions;
    let collection;

    beforeAll(() => {
      app = new VcsUiApp();
      collection = new IndexedCollection();
      collectionComponentOptions = {
        collection,
      };
      collectionComponent = new CollectionComponentClass(
        collectionComponentOptions,
        'test',
      );
      makeEditorCollectionComponentClass(
        app,
        collectionComponent,
        getTestEditorOptions(collectionComponent),
        parentId,
      );
    });

    afterAll(() => {
      collectionComponent.destroy();
      collection.destroy();
    });

    it('should set editor symbol', () => {
      expect(collectionComponent).to.have.property(
        isEditorCollectionComponentClass,
        true,
      );
    });

    it('should throw, if CollectionComponentClass is already an EditorCollectionComponentClass', () => {
      expect(
        makeEditorCollectionComponentClass.bind(
          null,
          app,
          collectionComponent,
          getTestEditorOptions(collectionComponent),
          parentId,
        ),
      ).to.throw();
    });

    it('should provide additional editor functions and the parentId', () => {
      expect(collectionComponent).to.have.property('getEditorWindowId');
      expect(collectionComponent).to.have.property('getMultiEditorWindowId');
      expect(collectionComponent).to.have.property('closeEditorWindow');
      expect(collectionComponent).to.have.property('closeEditorWindows');
      expect(collectionComponent).to.have.property('closeMultiEditorWindow');
      expect(collectionComponent).to.have.property('openEditorWindow');
      expect(collectionComponent).to.have.property('openMultiEditorWindow');
      expect(collectionComponent).to.have.property('parentId');
    });

    it('should add a multi editor action, if a multi editor is provided', () => {
      expect(
        collectionComponent
          .getActions()
          .value.some((a) => a.name === 'list.edit'),
      ).to.be.true;
    });

    it('should NOT add a multi editor action, if none is provided', () => {
      const collectionComponent2 = new CollectionComponentClass(
        collectionComponentOptions,
        'test2',
      );
      const { editor } = getTestEditorOptions(collectionComponent);
      makeEditorCollectionComponentClass(
        app,
        collectionComponent2,
        { editor },
        parentId,
      );
      expect(
        collectionComponent2
          .getActions()
          .value.some((a) => a.name === 'list.edit'),
      ).to.be.false;
    });
  });

  function multiEditorTests(selectionBased) {
    describe('multi editor behaviour', () => {
      let app;
      let collectionComponent;
      let collectionComponentOptions;
      let collection;
      let items;

      beforeAll(() => {
        app = new VcsUiApp();
        items = [{ name: 'item1' }, { name: 'item2' }];
        collection = IndexedCollection.from(items);
        collectionComponentOptions = {
          collection,
        };
        collectionComponent = new CollectionComponentClass(
          collectionComponentOptions,
          'test',
        );
        makeEditorCollectionComponentClass(
          app,
          collectionComponent,
          { ...getTestEditorOptions(collectionComponent), selectionBased },
          parentId,
        );
      });

      afterAll(() => {
        collectionComponent.destroy();
        collection.destroy();
      });

      it('should NOT automatically open a multi editor window on multi selection', async () => {
        collectionComponent.selection.value = collectionComponent.items.value;
        await sleep(0);
        expect(
          app.windowManager.has(collectionComponent.getMultiEditorWindowId()),
        ).to.be.false;
      });

      it('should open a multi editor window via overflow action for current selection', async () => {
        collectionComponent.selection.value = collectionComponent.items.value;
        const editItemsActions = collectionComponent
          .getActions()
          .value.find((a) => a.name === 'list.edit');
        editItemsActions.callback();
        await sleep(0);
        expect(
          app.windowManager.has(collectionComponent.getMultiEditorWindowId()),
        ).to.be.true;
      });

      it('should close the multi editor window on deselection', async () => {
        collectionComponent.selection.value = collectionComponent.items.value;
        collectionComponent.openMultiEditorWindow();
        expect(
          app.windowManager.has(collectionComponent.getMultiEditorWindowId()),
        ).to.be.true;
        collectionComponent.selection.value = [];
        await sleep(0);
        expect(
          app.windowManager.has(collectionComponent.getMultiEditorWindowId()),
        ).to.be.false;
      });

      it('should close the multi editor window on new selection', async () => {
        collectionComponent.selection.value = [
          collectionComponent.items.value[0],
        ];
        collectionComponent.openMultiEditorWindow();
        expect(
          app.windowManager.has(collectionComponent.getMultiEditorWindowId()),
        ).to.be.true;
        collectionComponent.items.value[1].clickedCallbacks.forEach((cb) =>
          cb(new Event('click')),
        );
        collectionComponent.selection.value = [
          collectionComponent.items.value[1],
        ];
        await sleep(0);
        expect(
          app.windowManager.has(collectionComponent.getMultiEditorWindowId()),
        ).to.be.false;
      });

      it('should close the multi editor window, when opening another editor', async () => {
        collectionComponent.selection.value = [
          collectionComponent.items.value[0],
        ];
        collectionComponent.openMultiEditorWindow();
        expect(
          app.windowManager.has(collectionComponent.getMultiEditorWindowId()),
        ).to.be.true;
        collectionComponent.openEditorWindow(items[1]);
        await sleep(0);
        expect(
          app.windowManager.has(collectionComponent.getMultiEditorWindowId()),
        ).to.be.false;
      });

      it('should close all other editor windows, when opening the multi editor', async () => {
        collectionComponent.selection.value = [
          collectionComponent.items.value[0],
        ];
        collectionComponent.openEditorWindow(items[0]);
        await sleep(0);
        expect(
          app.windowManager.has(
            collectionComponent.getEditorWindowId(items[0]),
          ),
        ).to.be.true;
        expect(
          app.windowManager.has(collectionComponent.getMultiEditorWindowId()),
        ).to.be.false;
        collectionComponent.openMultiEditorWindow();
        await sleep(0);
        expect(
          app.windowManager.has(collectionComponent.getMultiEditorWindowId()),
        ).to.be.true;
        expect(
          app.windowManager.has(
            collectionComponent.getEditorWindowId(items[0]),
          ),
        ).to.be.false;
      });
    });
  }

  describe('selection based behaviour', () => {
    let app;
    let collectionComponent;
    let collectionComponentOptions;
    let collection;
    let items;

    beforeAll(() => {
      app = new VcsUiApp();
      items = [{ name: 'item1' }, { name: 'item2' }, { name: 'item3' }];
      collection = IndexedCollection.from(items);
      collectionComponentOptions = {
        collection,
      };
      collectionComponent = new CollectionComponentClass(
        collectionComponentOptions,
        'test',
      );
      makeEditorCollectionComponentClass(
        app,
        collectionComponent,
        getTestEditorOptions(collectionComponent),
        parentId,
      );
    });

    afterAll(() => {
      collectionComponent.destroy();
      collection.destroy();
    });

    it('should open an editor window on selection', async () => {
      collectionComponent.selection.value = [
        collectionComponent.items.value[0],
      ];
      await sleep(0);
      expect(
        app.windowManager.has(collectionComponent.getEditorWindowId(items[0])),
      ).to.be.true;
    });

    it('should close the editor window on deselection', async () => {
      collectionComponent.selection.value = [];
      await sleep(0);
      expect(
        app.windowManager.has(collectionComponent.getEditorWindowId(items[0])),
      ).to.be.false;
    });

    it('should close the editor window, if more than one item is selected', async () => {
      collectionComponent.selection.value = [
        collectionComponent.items.value[0],
      ];
      await sleep(0);
      expect(
        app.windowManager.has(collectionComponent.getEditorWindowId(items[0])),
      ).to.be.true;
      collectionComponent.selection.value = [
        ...collectionComponent.items.value,
      ];
      await sleep(0);
      expect(
        app.windowManager.has(collectionComponent.getEditorWindowId(items[0])),
      ).to.be.false;
    });

    it('should open an editor window via overflow action and select this item', async () => {
      collectionComponent.selection.value = [];
      const listItem = collectionComponent.items.value[0];
      const editItemAction = listItem.actions.find(
        (a) => a.name === 'list.editItem',
      );
      editItemAction.callback();
      await sleep(0);
      expect(
        app.windowManager.has(collectionComponent.getEditorWindowId(items[0])),
      ).to.be.true;
      expect(collectionComponent.selection.value).to.have.members([listItem]);
    });

    it('should open an editor window via overflow action and select this item from an existing multiselection where it is a member', async () => {
      collectionComponent.selection.value = [
        collectionComponent.items.value[0],
        collectionComponent.items.value[1],
      ];
      const listItem = collectionComponent.items.value[0];
      const editItemAction = listItem.actions.find(
        (a) => a.name === 'list.editItem',
      );
      editItemAction.callback();
      await sleep(0);
      expect(
        app.windowManager.has(collectionComponent.getEditorWindowId(items[0])),
      ).to.be.true;
      expect(collectionComponent.selection.value).to.have.members([listItem]);
    });

    it('should open an editor window via overflow action and select this item from an existing multiselection where it is not a member', async () => {
      collectionComponent.selection.value = [
        collectionComponent.items.value[1],
        collectionComponent.items.value[2],
      ];
      const listItem = collectionComponent.items.value[0];
      const editItemAction = listItem.actions.find(
        (a) => a.name === 'list.editItem',
      );
      editItemAction.callback();
      await sleep(0);
      expect(
        app.windowManager.has(collectionComponent.getEditorWindowId(items[0])),
      ).to.be.true;
      expect(collectionComponent.selection.value).to.have.members([listItem]);
    });

    // eslint-disable-next-line mocha/no-setup-in-describe
    multiEditorTests(true);
  });

  describe('click based behaviour', () => {
    let app;
    let collectionComponent;
    let collectionComponentOptions;
    let collection;
    let items;

    beforeAll(() => {
      app = new VcsUiApp();
      items = [{ name: 'item1' }, { name: 'item2' }];
      collection = IndexedCollection.from(items);
      collectionComponentOptions = {
        collection,
      };
      collectionComponent = new CollectionComponentClass(
        collectionComponentOptions,
        'test',
      );
      makeEditorCollectionComponentClass(
        app,
        collectionComponent,
        { ...getTestEditorOptions(collectionComponent), selectionBased: false },
        parentId,
      );
    });

    afterAll(() => {
      collectionComponent.destroy();
      collection.destroy();
    });

    it('should open an editor window on click', async () => {
      const listItem = collectionComponent.items.value[0];
      listItem.clickedCallbacks.forEach((cb) => cb(new Event('click')));
      collectionComponent.selection.value = [listItem];
      await sleep(0);
      expect(
        app.windowManager.has(collectionComponent.getEditorWindowId(items[0])),
      ).to.be.true;
    });

    it('should close the editor window, if more than one item is selected', async () => {
      collectionComponent.selection.value = [
        collectionComponent.items.value[0],
      ];
      collectionComponent.openEditorWindow(items[0]);
      await sleep(0);
      expect(
        app.windowManager.has(collectionComponent.getEditorWindowId(items[0])),
      ).to.be.true;
      collectionComponent.selection.value = collectionComponent.items.value;
      await sleep(0);
      expect(
        app.windowManager.has(collectionComponent.getEditorWindowId(items[0])),
      ).to.be.false;
    });

    it('should open an editor window via overflow action, but do not select this item', async () => {
      collectionComponent.selection.value = [];
      const listItem = collectionComponent.items.value[0];
      const editItemAction = listItem.actions.find(
        (a) => a.name === 'list.editItem',
      );
      editItemAction.callback();
      await sleep(0);
      expect(
        app.windowManager.has(collectionComponent.getEditorWindowId(items[0])),
      ).to.be.true;
      expect(collectionComponent.selection.value).to.have.length(0);
    });

    // eslint-disable-next-line mocha/no-setup-in-describe
    multiEditorTests(false);
  });
});
