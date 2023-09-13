# Collections

A collection is an array based list of items.
Several items of the VcsApp are managed in collections, e.g. map collection, layer collection, ... or the items of a category.

The ui provides concepts to list items of different collections.
For a list view items can be filtered or mapped using functions.

For one collection this is handled by the [CollectionComponent](#collectioncomponent).
Multiple collections can be handled by a [CollectionManager](#collectionmanager).
For categories exists a specialised [CategoryManager](#categorymanager).

For rendering the list views, the ui provides several components, which can be reused:

- [CollectionComponent](../src/manager/collectionManager/CollectionComponent.vue): A list rendering of a specific collection restricted to ten items
- [CollectionComponentList](../src/manager/collectionManager/CollectionComponentList.vue): A scrollable list rendering all items
- [CollectionComponentProvider](../src/manager/collectionManager/CollectionComponentProvider.vue): A wrapper component providing a specific CollectionComponent of a CollectionManager
- [CollectionManager](../src/manager/collectionManager/CollectionManager.vue): A set of CollectionComponents belonging to a CollectionManager rendered in Expansion Panels

## CollectionComponent

An instance of CollectionComponent class manages one provided collection and creates a mirrored items array with `VcsListItem`s.
It listens to all collection events and synchronizes changes to the items array.
The Collection Items will be transformed and filtered with the given itemMappings and itemFilter functions.

To create a new instance, you must at least provide a collection. All other ui related options are optional:

```js
/**
 * @typedef {Object} CollectionComponentUiOptions
 * @property {string} [id]
 * @property {string} [title]
 * @property {boolean} [draggable] - only supported for IndexedCollections
 * @property {boolean} [selectable]
 * @property {boolean} [singleSelect]
 */

/**
 * @typedef {CollectionComponentUiOptions} CollectionComponentOptions
 * @property {import("@vcmap/core").Collection<T>} collection
 * @template {Object} T
 */
```

All ui relevant properties are stored as ref values on the instance.

### List Items

The transformed list items are accessible via its getter:

```js
/**
 * @type {import("vue").Ref<Array<import("@vcmap/ui").VcsListItem & { destroy: (function():void)|undefined }>>}
 */
const listItems = collectionComponent.items;
```

> Do not manipulate this list items array directly! To add or remove items manipulate the collection or make use of itemMappings and itemFilters.

### Item Mapping

You can provide mapping functions to influence the transformation of a collection item to a list item.
An item mapping is defined as:

```js
/**
 * @typedef {Object} ItemMapping
 * @property {PredicateFunction<T>|undefined} predicate
 * @property {MappingFunction<T>} mappingFunction
 * @property {string | symbol} owner
 * @template T
 */
```

A `PredicateFunction` can be used to restrict the `MappingFunction` to specific Items.

```js
const predicateFunction = (item, category) => {
  return item instanceof Object;
};
const mappingFunction = (item, category, listItem) => {
  listItem.selectionChanged = (selected) => {
    console.log(item);
  };
  listItem.actions.push({
    name: 'myRemoveAction',
    icon: 'mdi-minus',
    callback: () => {
      category.collection.remove(item);
    },
  });
  listItem.destroy = () => {
    console.log('custom tear down');
  };
};
const itemMapping = {
  predicateFunction,
  mappingFunction,
  owner: 'pluginName',
};
collectionComponent.addItemMapping(itemMapping);
```

> All item mappings are applied in the order they were added.

A mapping function can be removed, by calling `collectionComponent.removeItemMapping(itemMapping)`.

### Item Filter

Filter functions can be applied to view and transform only specific items of the collection.
An item filter is defined as:

```js
/**
 * @typedef {Object} ItemFilter
 * @property {PredicateFunction<T>} filterFunction
 * @property {string | symbol} owner
 * @template T
 */
```

The category manager, for example, uses a filter function to only include items of the dynamic module id.
Another example filters all items having an 'a' charater in its title or name

```js
const itemFilter = {
  filterFunction: (item) =>
    item?.properties?.title?.includes('a') || item.name.includes('a'),
  owner: 'pluginName',
};

collectionComponent.addItemFilter(itemFilter);
```

> All item filters are applied in the order they were added.

### Actions

CollectionComponents can have actions, which are typically rendered in the lists panel header.
Since the collectionComponent supports the owners concept, you have to provide an action with a owner:

```js
/**
 * @typedef {Object} OwnedAction
 * @property {VcsAction} action
 * @property {number} [weight=0] Optional weight affecting the displaying order
 * @property {string | symbol} owner
 */
```

One example could be a action to add an item:

```js
const addItem = () => collectionComponent.collection.add({ name: 'newItem' });

const ownedAction = {
  action: {
    name: 'addItem',
    title: 'add an item to the collection',
    icon: 'mdi-plus',
    callback: () => addItem(),
  },
  owner: 'pluginName',
};

collectionCompnent.addActions([ownedAction]);
```

> Actions are rendered in the order they were added or by provided weight.

## CollectionManager

A CollectionManager manages a list of collections as CollectionComponents.
It sets the correct mapping/filter functions and actions on the managed collection components.
It provides an API to add and remove CollectionsComponents, MappingFunctions, FilterFunctions and actions.
For mappings, filters and actions the collection manager has a cache concept.

> For usage examples also see [collection-manager-example](../plugins/@vcmap-show-case/collection-manager-example/src/CollectionManagerExample.vue).

To add a collectionComponent, provide `CollectionComponentOptions`, plus the owner.

```js
collectionManager.add({ collection: new IndexedCollection() }, 'pluginName');
```

All added collectionComponents are stored in a key value store. To access a collectionComponent call:

```js
const collectionComponent = collectionManager.get('collectionComponentId');
```

If you need to track state changes, you can listen to `added` and `removed` events emitted, whenever a collectionComponent is added or removed.

To remove a collectionComponent use the collectionComponent's id.

```js
collectionManager.remove('collectionComponentId');
```

You can also remove all components of a specific owner. This will also remove all mappings, filters and actions added by this owner:

```js
collectionManager.removeOwner('myPlugin');
```

To clear all components, mappings, filters and actions from the manager call:

```js
collectionManager.clear();
```

### Mapping Functions

Mapping functions influence the transformation of a collection item to a `VcsListItem`.
The collection manager applies mapping functions to all or specific collection components.
If no `collectionComponentIds` are provided, the mapping function is applied on all managed collection components.
All added mapping functions are cached. Whenever a collectionComponent is added, corresponding mapping functions are applied.

```js
/**
 * a sample mapping function adding a console log to all list items
 * @param {T} i
 * @param {CollectionComponent} c
 * @param {VcsListItem} l
 */
const mappingFunction = (i, c, l) => {
  l.actions = [
    ...l.actions,
    {
      name: 'console.log',
      title: 'log item, collectionComponent and listItem',
      icon: 'mdi-printer',
      callback: () => console.log(i, c, l),
    },
  ];
};

collectionManager.addMappingFunction(
  () => true,
  mappingFunction,
  'pluginName',
  ['myCollectionComponentId'],
);
```

To remove a mapping function:

```js
collectionManager.removeMappingFunction(mappingFunction, 'pluginName');
```

### Filter Functions

Filter functions influence which collection items are transformed and viewed as `VcsListItem`s.
The API is similar to mapping functions.
Filter functions are cached and applied, whenever a corresponding collection component is added.

```js
/**
 * Filters all items having an 'a' within title or name
 * @param {T} item
 * @returns {boolean}
 */
const filterFunction = (item) =>
  item?.properties?.title?.includes('a') || item.name.includes('a');
collectionManager.addFilterFunction(filterFunction, 'pluginName', [
  'myCollectionComponentId',
]);
```

To remove a filter function call:

```js
collectionManager.removeFilterFunction(filterFunction, 'pluginName');
```

### Actions

Actions of a collection component are typically rendered in the lists panel header.
The collection manager can add and remove actions to all or specific collection components.
The API is again similar to mapping and filter functions.
Actions are cached and applied, whenever a corresponding collection component is added.

```js
const actions = [
  {
    name: 'addFilter',
    title: 'show only items including an "a" in title or name',
    icon: 'mdi-filter-plus',
    callback: () => {
      collectionManager.addFilterFunction(filterFunction, owner, [id]);
    },
  },
  {
    name: 'removeFilter',
    title: 'remove filtering',
    icon: 'mdi-filter-remove',
    callback: () => {
      collectionManager.removeFilterFunction(filterFunction, owner);
    },
  },
];

collectionManager.addActions(actions, 'pluginName', [
  'myCollectionComponentId',
]);
```

To remove actions call:

```js
collectionManager.removeActions(actions, 'pluginName');
```

## CategoryManager

The CategoryManager is a specialisation of the CollectionManager to handle collections of categories.
It is part of the VcsUiApp and can be accessed via `app.categoryManager`.
The category items are shown in the "My Workspace" window of the map.

It sets a filter function applied to all managed collection components, to only show items belonging to the dynamic module.
Whenever the dynamic module is changed, the category manager updates its list view.

It provides a convenience method to request a category and its corresponding collection component:

```js
const { category, collectionComponent } =
  await app.categoryManager.requestCategory(
    { name: categoryName.value }, // CategoryOptions
    'pluginName', // owner
    { draggable: true }, // optional CollectionComponentOptions
  );
```
