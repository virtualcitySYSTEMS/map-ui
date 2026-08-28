import { getLogger } from '@vcsuite/logger';
import {
  createMapButtonAction,
  createToggleAction,
} from '../actions/actionHelper.js';
import type CollectionComponentClass from '../manager/collectionManager/collectionComponentClass.js';
import CollectionManager from '../manager/collectionManager/CollectionManager.vue';
import { ButtonLocation } from '../manager/navbarManager.js';
import { vcsAppSymbol } from '../pluginHelper.js';
import type VcsUiApp from '../vcsUiApp.js';
import type { VcsPlugin } from '../vcsUiApp.js';

export const attributionsComponentId = 'attributionId';
export const categoryManagerWindowId = 'category-manager';
export const customScreenComponentId = 'customScreenId';
export const helpComponentId = 'helpButton';
export const legendComponentId = 'legendId';
export const settingsComponentId = 'vcsSettings';
export const splashScreenComponentId = 'splashScreenToggle';

/**
 * This helper function will add a category manager button to the navbar. The category Manager
 * will only be shown if there is at least one category under management in the categoryManager.
 */
export function setupCategoryManagerWindow(app: VcsUiApp): () => void {
  const { action: categoryManagerAction, destroy } = createToggleAction(
    {
      name: categoryManagerWindowId,
      icon: '$vcsComponents',
      title: 'categoryManager.tooltip',
    },
    {
      id: categoryManagerWindowId,
      state: {
        headerTitle: 'categoryManager.title',
        headerIcon: '$vcsComponents',
        infoUrlCallback: app.getHelpUrlCallback(
          '/components/contentspace.html#id_myWorkspace',
        ),
      },
      component: CollectionManager,
      provides: { collectionManager: app.categoryManager },
      slot: 'dynamicLeft',
    },
    app.windowManager,
    vcsAppSymbol,
  );

  const collectionListeners = new Map<string, () => void>();

  /**
   * Makes sure that the category-manager button is in the navbar.
   * Adds listener to the collectionComponents collection to display hasUpdate if new item is added to collection AND category-manager window is closed.
   */
  function handleAdded(collectionComponent: CollectionComponentClass): void {
    if (!app.navbarManager.has(categoryManagerWindowId)) {
      app.navbarManager.add(
        { id: categoryManagerWindowId, action: categoryManagerAction },
        vcsAppSymbol,
        ButtonLocation.CONTENT,
      );
    }
    collectionListeners.set(
      collectionComponent.id,
      collectionComponent.collection.added.addEventListener((item) => {
        if (
          !app.windowManager.has(categoryManagerWindowId) &&
          // @ts-expect-error moduleIdSymbol is not typed on item
          item[moduleIdSymbol] === app.dynamicModuleId
        ) {
          categoryManagerAction.hasUpdate = true;
        }
      }),
    );
  }

  /**
   * Removes listener on collection of collectionComponent.
   * Removes collection-manager button in navbar, if categoryManager has no more collectionComponents.
   */
  function handleRemoved(collectionComponent: CollectionComponentClass): void {
    collectionListeners.get(collectionComponent.id)?.();
    collectionListeners.delete(collectionComponent.id);

    if (!app.categoryManager.componentIds.length) {
      app.windowManager.remove(categoryManagerWindowId);
      app.navbarManager.remove(categoryManagerWindowId);
      categoryManagerAction.hasUpdate = false;
    }
  }

  const addedListener = app.categoryManager.added.addEventListener(handleAdded);
  const removedListener =
    app.categoryManager.removed.addEventListener(handleRemoved);

  // setup existing collectionComponents
  app.categoryManager.componentIds.forEach((componentId) => {
    const component = app.categoryManager.get(componentId);
    if (component) {
      handleAdded(component);
    }
  });

  const windowListener = app.windowManager.added.addEventListener(
    (windowComponent) => {
      if (windowComponent.id === categoryManagerWindowId) {
        categoryManagerAction.hasUpdate = false;
      }
    },
  );

  return (): void => {
    app.windowManager.remove(categoryManagerWindowId);
    app.navbarManager.remove(categoryManagerWindowId);
    destroy();
    addedListener();
    removedListener();
    collectionListeners.forEach((value) => {
      value();
    });
    windowListener();
  };
}

/**
 * This helper function will add a map action button based on the default icons
 * to the apps NavbarManager. Furthermore, all maps on the app are synced for adding and removing.
 * The buttons can be removed with the uiConfig hideMapButtons
 */
export function setupMapNavbar(app: VcsUiApp): () => void {
  const iconMap: Record<string, string> = {
    OpenlayersMap: '$vcs2d',
    CesiumMap: '$vcs3d',
    ObliqueMap: '$vcsObliqueView',
    PanoramaMap: 'mdi-panorama-variant-outline',
  };

  const mapBtnWeight: Record<string, number> = {
    OpenlayersMap: 3,
    CesiumMap: 2,
    ObliqueMap: 1,
    PanoramaMap: 0,
  };

  const mapButtonActionDestroy: Record<string, () => void> = {};
  const setupMap = ({
    className,
    name,
  }: {
    className: string;
    name: string;
  }): void => {
    if (mapButtonActionDestroy[name]) {
      mapButtonActionDestroy[name]();
    }
    const { action, destroy } = createMapButtonAction(
      {
        name,
        icon: iconMap[className],
        title: `navbar.maps.${className}`,
      },
      name,
      app.maps,
    );
    app.navbarManager.add(
      {
        id: `mapButton-${name}`,
        action,
        weight: mapBtnWeight[className],
      },
      vcsAppSymbol,
      ButtonLocation.MAP,
      { mobile: true, tablet: true, desktop: true },
    );
    mapButtonActionDestroy[name] = (): void => {
      app.navbarManager.remove(`mapButton-${name}`);
      destroy();
    };
  };
  [...app.maps].forEach(setupMap);
  const mapAddedListener = app.maps.added.addEventListener(setupMap);

  const mapRemovedListener = app.maps.removed.addEventListener(({ name }) => {
    if (mapButtonActionDestroy[name]) {
      mapButtonActionDestroy[name]();
      delete mapButtonActionDestroy[name];
    }
  });

  return (): void => {
    mapAddedListener();
    mapRemovedListener();
    Object.values(mapButtonActionDestroy).forEach((cb) => {
      cb();
    });
  };
}

/**
 * You should call this function in the component providing the vcsUiApp to your
 * application in the components mounted hook. This will call VcsAppMounted on all plugins in the app
 * and add a listener to call. Returns a destroy hook to stop listening to the added event. If you use the VcsApp
 * component, do not call this function, since the component will do this for you.
 */
export function setupPluginMountedListeners(app: VcsUiApp): () => void {
  /**
   * wrapped execution of onVcsAppMounted hook
   */
  function onVcsAppMounted(plugin: VcsPlugin): void {
    if (plugin.onVcsAppMounted) {
      try {
        plugin.onVcsAppMounted(app);
      } catch (e) {
        getLogger('VcsUiApp').error(
          `Error in plugin ${plugin.name} onVcsAppMounted hook`,
          e,
        );
      }
    }
  }

  [...app.plugins].forEach(onVcsAppMounted);

  return app.plugins.added.addEventListener(onVcsAppMounted);
}
