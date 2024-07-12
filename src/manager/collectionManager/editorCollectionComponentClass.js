import { nextTick, reactive, watch } from 'vue';
import { check, maybe, oneOf } from '@vcsuite/check';
import { WindowSlot } from '../window/windowManager.js';
import CollectionComponentClass from './collectionComponentClass.js';
import { createListEditAction } from '../../actions/listActions.js';

/**
 * @typedef {Omit<import("../window/windowManager.js").WindowComponentOptions,"id"|"parentId"|"slot">} EditorWindowComponentOptions
 */

/**
 * @typedef {{
 *   editor: EditorWindowComponentOptions|function(T):EditorWindowComponentOptions|undefined,
 *   multiEditor?: EditorWindowComponentOptions,
 *   predicate?: import("./collectionManager.js").PredicateFunction<T>,
 *   selectionBased?: boolean,
 *   editTitle?: string,
 *   bulkEditTitle?: string
 * }} EditingOptions
 * @property {EditorWindowComponentOptions|function(T)|undefined} editor
 * @property {EditorWindowComponentOptions} [multiEditor]
 * @property {import("./collectionManager.js").PredicateFunction<T>} [predicate=()=>true] - Optional predicate function for editor
 * @property {boolean} [selectionBased=true] - If true, editor windows are coupled to selection and editor windows are exclusive
 * @property {string} [editTitle="list.editItem"]
 * @property {string} [bulkEditTitle="list.edit"]
 * @template {Object} T
 */

/**
 * @typedef {import("./collectionComponentClass.js").default<T> & {
 *     getEditorWindowId: function(T):string,
 *     getMultiEditorWindowId: function():string|undefined,
 *     closeEditorWindow: function(T):void,
 *     closeEditorWindows: function():void,
 *     closeMultiEditorWindow: function():void,
 *     openEditorWindow: function(T):void,
 *     openMultiEditorWindow: function():void,
 *     parentId: string,
 * }} EditorCollectionComponentClass
 * @template {Object} T
 */

/**
 * A symbol added to collection component class with editor selection behaviour.
 */
export const isEditorCollectionComponentClass = Symbol(
  'EditorCollectionComponentClass',
);

/**
 * Adds select behaviour toggling editor or multi-editor components. Two modes are distinguished:
 * - selection based (default): editor windows are toggled on selection change. All editor windows are exclusive.
 * - clicked based: editor windows are opened on click. Multiple editor windows can be open at the same time.
 * @param {import("../../vcsUiApp.js").default} app
 * @param {import("./collectionComponentClass.js").default<T>} collectionComponent
 * @param {EditingOptions<T>} editingOptions
 * @param {string} [parentId='category-manager'] - windowId of window with CollectionComponent
 * @template {Object|import("@vcmap/core").VcsObject} T
 * @returns {EditorCollectionComponentClass<T>}
 */
export function makeEditorCollectionComponentClass(
  app,
  collectionComponent,
  editingOptions,
  parentId = 'category-manager',
) {
  check(collectionComponent, CollectionComponentClass);
  check(editingOptions.editor, oneOf(Object, Function));
  check(editingOptions.multiEditor, maybe(Object));
  check(editingOptions.predicate, maybe(Function));

  const editorCollectionComponent =
    /** @type {EditorCollectionComponentClass} */ collectionComponent;

  if (!editorCollectionComponent.selectable.value) {
    editorCollectionComponent.selectable.value = true;
  }

  if (editorCollectionComponent[isEditorCollectionComponentClass]) {
    throw new Error(
      'Cannot transform collectionComponentClass, since it is already an EditorCollectionComponentClass',
    );
  }
  editorCollectionComponent[isEditorCollectionComponentClass] = true;

  const {
    editor,
    multiEditor = undefined,
    predicate = () => true,
    selectionBased = true,
  } = editingOptions;
  const keyProperty = editorCollectionComponent.collection.uniqueKey;
  const exclusiveEditorId = `${editorCollectionComponent.id}-editor`;
  const multiEditorId = `${editorCollectionComponent.id}-multi-editor`;

  /**
   * @param {import("collectionComponentClass.js").CollectionComponentListItem} listItem
   * @returns {T}
   */
  function getItemForListItem(listItem) {
    return editorCollectionComponent.collection.getByKey(listItem.name);
  }

  /**
   * @param {T} item
   * @returns {string}
   */
  function getEditorWindowId(item) {
    if (selectionBased) {
      return exclusiveEditorId;
    }
    return `${exclusiveEditorId}-${item[keyProperty]}`;
  }

  /**
   * @returns {string|undefined}
   */
  function getMultiEditorWindowId() {
    if (multiEditor) {
      return multiEditorId;
    }
    return undefined;
  }

  /**
   * @param {T} item
   * @returns {EditorWindowComponentOptions}
   */
  function getEditorWindowOptions(item) {
    return typeof editor === 'function' ? editor(item) : editor;
  }

  /**
   * @param {T} item
   */
  function closeEditorWindow(item) {
    const id = getEditorWindowId(item);
    if (app.windowManager.has(id)) {
      app.windowManager.remove(id);
    }
  }

  function closeEditorWindows() {
    app.windowManager.componentIds
      .filter((id) => id.startsWith(exclusiveEditorId))
      .forEach((id) => app.windowManager.remove(id));
  }

  function closeMultiEditorWindow() {
    if (app.windowManager.has(multiEditorId)) {
      app.windowManager.remove(multiEditorId);
    }
  }

  /**
   * @param {T} item
   */
  function openEditorWindow(item) {
    const editorOptions = getEditorWindowOptions(item);
    const id = getEditorWindowId(item);
    if (editorOptions) {
      closeMultiEditorWindow();
      if (app.windowManager.has(id)) {
        app.windowManager.bringWindowToTop(id);
      } else {
        app.windowManager.add(
          {
            ...editorOptions,
            id,
            slot: WindowSlot.DYNAMIC_CHILD,
            parentId,
          },
          editorCollectionComponent.owner,
        );
      }
    }
  }

  function openMultiEditorWindow() {
    if (multiEditor) {
      closeEditorWindows();
      if (app.windowManager.has(multiEditorId)) {
        app.windowManager.bringWindowToTop(multiEditorId);
      } else {
        app.windowManager.add(
          {
            ...multiEditor,
            id: multiEditorId,
            slot: WindowSlot.DYNAMIC_CHILD,
            parentId,
          },
          editorCollectionComponent.owner,
        );
      }
    }
  }

  const selectionWatcher = watch(
    editorCollectionComponent.selection,
    async (selection, previous) => {
      if (selection.length > 1) {
        closeEditorWindows();
      } else if (selection.length === 1 && previous.indexOf(selection[0]) < 0) {
        if (selectionBased) {
          // we need wait with opening the new window otherwise the editor will not be rerendered.
          closeEditorWindows();
          await nextTick();
        }
        openEditorWindow(getItemForListItem(selection[0]));
      } else if (selection.length === 0) {
        if (selectionBased) {
          closeEditorWindows();
        }
        closeMultiEditorWindow();
      }
    },
  );

  const itemRemovedListener =
    editorCollectionComponent.collection.removed.addEventListener(
      closeEditorWindow,
    );

  editorCollectionComponent.addItemMapping({
    predicate,
    mappingFunction: (item, c, listItem) => {
      listItem.clickedCallbacks.push((event) => {
        if (!(event.shiftKey || event.ctrlKey)) {
          if (editorCollectionComponent.selection.value.length > 1) {
            openEditorWindow(item);
          }
          if (
            !selectionBased &&
            editorCollectionComponent.selection.value.length === 1 &&
            editorCollectionComponent.selection.value[0] === listItem
          ) {
            closeEditorWindow(item);
          }
        }
      });

      const editItemAction = {
        name: editingOptions.editTitle ?? 'list.editItem',
        async callback() {
          if (selectionBased) {
            closeEditorWindows();
            await nextTick();
            collectionComponent.selection.value = [listItem];
          } else {
            collectionComponent.selection.value = [];
          }
          openEditorWindow(item);
        },
        weight: 10,
      };
      listItem.actions.push(editItemAction);
    },
    owner: editorCollectionComponent.owner,
  });

  let multiEditorDestroy = () => {};

  if (multiEditor) {
    const { action, destroy } = createListEditAction(
      editorCollectionComponent.selection,
      openMultiEditorWindow,
      app.windowManager,
      editorCollectionComponent.owner,
      getMultiEditorWindowId(),
      editingOptions.bulkEditTitle,
    );

    editorCollectionComponent.addActions([
      {
        action: reactive(action),
        owner: editorCollectionComponent.owner,
        weight: 101,
      },
    ]);
    multiEditorDestroy = destroy;
  }

  editorCollectionComponent.getEditorWindowId = getEditorWindowId;
  editorCollectionComponent.getMultiEditorWindowId = getMultiEditorWindowId;
  editorCollectionComponent.closeEditorWindow = closeEditorWindow;
  editorCollectionComponent.closeEditorWindows = closeEditorWindows;
  editorCollectionComponent.closeMultiEditorWindow = closeMultiEditorWindow;
  editorCollectionComponent.openEditorWindow = openEditorWindow;
  editorCollectionComponent.openMultiEditorWindow = openMultiEditorWindow;
  editorCollectionComponent.parentId = parentId;

  const originalDestroy = editorCollectionComponent.destroy.bind(
    editorCollectionComponent,
  );

  editorCollectionComponent.destroy = function destroy() {
    originalDestroy();
    selectionWatcher();
    itemRemovedListener();
    multiEditorDestroy();
  };

  return editorCollectionComponent;
}
