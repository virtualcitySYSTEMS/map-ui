import { nextTick, reactive, watch } from 'vue';
import { check, maybe, oneOf } from '@vcsuite/check';
import type { VcsObject } from '@vcmap/core';
import type VcsUiApp from '../../vcsUiApp.js';
import type { WindowComponentOptions } from '../window/windowManager.js';
import CollectionComponentClass, {
  type CollectionComponentListItem,
} from './collectionComponentClass.js';
import { createListEditAction } from '../../actions/listActions.js';
import { categoryManagerWindowId } from '../../application/vcsAppHelper.js';
import type { VcsAction } from '../../actions/actionHelper.js';

/**
 * A symbol added to collection component class with editor selection behaviour.
 */
export const isEditorCollectionComponentClass = Symbol(
  'EditorCollectionComponentClass',
);

export type EditorWindowComponentOptions = Omit<
  WindowComponentOptions,
  'id' | 'parentId' | 'slot'
>;

type EditingOptions<T> = {
  editor:
    | EditorWindowComponentOptions
    | ((item: T) => EditorWindowComponentOptions)
    | undefined;
  multiEditor?: EditorWindowComponentOptions;
  /** Predicate function for editor. Defaults to () => true */
  predicate?: (item: T) => boolean;
  /** If true, editor windows are coupled to selection and editor windows are exclusive. Defaults to true */
  selectionBased?: boolean;
  /** Defaults to "list.editItem" */
  editTitle?: string;
  /** Defaults to "list.edit" */
  bulkEditTitle?: string;
};

export type EditorCollectionComponentClass<T> = {
  getEditorWindowId: (item: T) => string;
  getMultiEditorWindowId: () => string | undefined;
  closeEditorWindow: (item: T) => void;
  closeEditorWindows: () => void;
  closeMultiEditorWindow: () => void;
  openEditorWindow: (item: T) => void;
  openMultiEditorWindow: () => void;
  parentId: string;
  [isEditorCollectionComponentClass]?: boolean;
};

/**
 * Adds select behaviour toggling editor or multi-editor components. Two modes are distinguished:
 * - selection based (default): editor windows are toggled on selection change. All editor windows are exclusive.
 * - clicked based: editor windows are opened on click. Multiple editor windows can be open at the same time.
 * @param parentId - windowId of window with CollectionComponent
 */
export function makeEditorCollectionComponentClass<
  T extends object | VcsObject,
>(
  app: VcsUiApp,
  collectionComponent: CollectionComponentClass<T>,
  editingOptions: EditingOptions<T>,
  parentId = categoryManagerWindowId,
): EditorCollectionComponentClass<T> {
  check(collectionComponent, CollectionComponentClass);
  check(editingOptions.editor, oneOf(Object, Function));
  check(editingOptions.multiEditor, maybe(Object));
  check(editingOptions.predicate, maybe(Function));

  const editorCollectionComponent: CollectionComponentClass<T> &
    Partial<EditorCollectionComponentClass<T>> = collectionComponent;

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
    multiEditor,
    predicate = (): boolean => true,
    selectionBased = true,
  } = editingOptions;
  const keyProperty = editorCollectionComponent.collection.uniqueKey!;
  const exclusiveEditorId = `${editorCollectionComponent.id}-editor`;
  const multiEditorId = `${editorCollectionComponent.id}-multi-editor`;

  function getItemForListItem(
    listItem: CollectionComponentListItem,
  ): T | undefined {
    return editorCollectionComponent.collection.getByKey(listItem.name);
  }

  function getEditorWindowId(item: T): string {
    if (selectionBased) {
      return exclusiveEditorId;
    }
    return `${exclusiveEditorId}-${item[keyProperty] as string}`;
  }

  function getMultiEditorWindowId(): string | undefined {
    if (multiEditor) {
      return multiEditorId;
    }
    return undefined;
  }

  function getEditorWindowOptions(item: T): EditorWindowComponentOptions {
    return typeof editor === 'function' ? editor(item) : editor;
  }

  function closeEditorWindow(item: T): void {
    const id = getEditorWindowId(item);
    if (app.windowManager.has(id)) {
      app.windowManager.remove(id);
    }
  }

  function closeEditorWindows(): void {
    app.windowManager.componentIds
      .filter((id) => id.startsWith(exclusiveEditorId))
      .forEach((id) => {
        app.windowManager.remove(id);
      });
  }

  function closeMultiEditorWindow(): void {
    if (app.windowManager.has(multiEditorId)) {
      app.windowManager.remove(multiEditorId);
    }
  }

  function openEditorWindow(item?: T): void {
    if (item) {
      const editorOptions = getEditorWindowOptions(item);
      const id = getEditorWindowId(item);
      if (editorOptions) {
        closeMultiEditorWindow();
        if (app.windowManager.has(id)) {
          app.windowManager.bringWindowToTop(id);
        } else {
          app.windowManager.add(
            { ...editorOptions, id, slot: 'dynamicChild', parentId },
            editorCollectionComponent.owner,
          );
        }
      }
    }
  }

  function openMultiEditorWindow(): void {
    if (multiEditor) {
      closeEditorWindows();
      if (app.windowManager.has(multiEditorId)) {
        app.windowManager.bringWindowToTop(multiEditorId);
      } else {
        app.windowManager.add(
          {
            ...multiEditor,
            id: multiEditorId,
            slot: 'dynamicChild',
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
    editorCollectionComponent.collection.removed.addEventListener((item) => {
      if (predicate(item)) {
        closeEditorWindow(item);
      }
    });

  editorCollectionComponent.addItemMapping({
    predicate,
    mappingFunction: (item, _c, listItem) => {
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

      const editItemAction: VcsAction & { weight?: number } = {
        name: editingOptions.editTitle ?? 'list.editItem',
        async callback(): Promise<void> {
          if (selectionBased) {
            closeEditorWindows();
            await nextTick();
            editorCollectionComponent.selection.value = [listItem];
          } else {
            editorCollectionComponent.selection.value = [];
          }
          openEditorWindow(item);
        },
        weight: 10,
      };
      listItem.actions.push(editItemAction);
    },
    owner: editorCollectionComponent.owner,
  });

  let multiEditorDestroy = (): void => {};

  if (multiEditor) {
    const { action, destroy } = createListEditAction(
      editorCollectionComponent.selection,
      openMultiEditorWindow,
      app.windowManager,
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

  editorCollectionComponent.destroy = function destroy(): void {
    originalDestroy();
    selectionWatcher();
    itemRemovedListener();
    multiEditorDestroy();
  };

  return editorCollectionComponent as EditorCollectionComponentClass<T>;
}
