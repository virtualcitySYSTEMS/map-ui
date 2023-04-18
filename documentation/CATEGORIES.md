# Components Concept
Components is a central control element to show Items of Categories from the VcsApp dynamic module.
For content to be shown in the Components window a Category has to be added to the VcsApp and a Plugin or the VcsApp has
to add the Category to the `categoryManager`. 

The Components window provides a view on the synchronized list of VcsListItem corresponding to the underlying Category and 
Category Items. The `categoryManager` allows adding Category level actions and Item level actions.   
The `categoryManager` is owner specific, so on plugin added/overriden/removed the managed Categories will be changed.  

## Managing Categories
To add a Category to the `categoryManager` the Category has to exist first. 

```javascript
  const myCategory = await app.categories.requestCategory({ name: 'myCategory' });
  const actions = [{
    name: 'ActionToAddNewItem',
    icon: 'mdi-plus',
    callback: () => {
      myCategory.collection.add({ name: 'newItem' });
    },
  }];
  app.categoryManager.add({ categoryName: myCategory.name }, 'pluginName', actions);
```

This will request a Category and will add the Category to be managed by the `categoryManager`. One `VcsAction` is defined to 
add a new Item `{ name: 'newItem' }` to the Category. The Components window will now show an entry for `myCategory` with 
the `plus` action to add new Items. The newly added Items will also be directly shown.

The managed Category will automatically be removed from the manager if the plugin is unloaded. There is also an API `remove` to 
remove the Category from management. This will not remove the requested Category from the VcsApp.

Managed categories will be rendered as a `VcsList` with up to 10 entries. Once those 10 Items are rendered,
the user can _pop-out_ an extensive VcsList in its own window, as not to clutter the
components window. 

Furthermore, managed categories can be selectable, proving a `selection` on the category item you
can watch using vue watchers. You can also add a `selectionChanged` handler to the
ListItem itself.

```javascript
/**
 * Illustrates how you can handle selection events on items and how to watch selection;
 */

import { VcsUiApp } from '@vcmap/ui';
import { watch } from 'vue';

const app = new VcsUiApp();
const category = await app.categories.requestCategory({ name: 'foo' });
const managedCategory = app.categoryManager.add({ categoryName: 'foo' }, 'bar');
// adds a selectionChanged handler to all items
const mappingFunction = (item, category, listItem) => {
  listItem.selectionChanged = (selected) => {
    console.log(item);
  };
}
app.categoryManager.addMappingFunction(predicateFunction, mappingFunction, ['foo'], 'bar');

watch(() => managedCategory.selection, () => {
  console.log('the selection has changed');
});

category.collection.added.addEventListener((item) => {
  if (item.select) {
    managedCategory.selection = [managedCategory.items.find(i => i.id === item.name)];
  }
});

```

## Managing MappingFunctions. 
Items associated with the "dynamicModule" in a managed Category will be shown in the Components window. Plugins can add `MappingFunctions` to
the `categoryManager` to define the corresponding VcsListItem for each Item. The `PredicateFunction` can be used to restrict the
`MappingFunction` to specific Items, for example only GeoJSON Layer.

```javascript
  const predicateFunction = (item, category) => {
    return item instanceof Object;   
  }
  const mappingFunction = (item, category, listItem) => {
    listItem.selectionChanged = (selected) => { console.log(item); };
    listItem.actions.push({
      name: 'myRemoveAction',
      icon: 'mdi-minus',
      callback: () => {
        category.collection.remove(item);
      },
    });
    listItem.destroy = () => { console.log('custom tear down'); };
  }
  app.categoryManager.addMappingFunction(predicateFunction, mappingFunction, ['myCategory'], 'pluginName');
```
The above example will add a click handler and an action to remove the item, on all items from the Category `myCategory` where
the condition `item instanceof Object` is satisfied.

Removing a MappingFunction with `removeMappingFunction` will reset all ListItems this function touched. The MappingFunctions for 
a specific Owner will also be removed on plugin added/removed.

The ListItems corresponds to the VcsList and every MappingFunction can manipulate the same ListItem.
This could mean that a second mappingFunction will override the first `selectionChanged` handler. The mappingFunctions are ordered
by the order of the plugins in the VcsApp. 
