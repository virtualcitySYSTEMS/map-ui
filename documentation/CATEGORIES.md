# Components Concept
Components is a central control element to show Items of Categories from the VcsApp.dynamicContext.
For content to be shown in the Components window a Category has to be added to the VcsApp and a Plugin or the VcsApp has
to add the Category to the `categoryManager`. 

The Components window provides a view on the synchronized tree of TreeViewItem corresponding to the underlying Category and 
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
  app.categoryManager.addCategory(myCategory.name, 'pluginName', actions);
```

This will request a Category and will add the Category to be managed by the `categoryManager`. One `VcsAction` is defined to 
add a new Item `{ name: 'newItem' }` to the Category. The Components window will now show an entry for `myCategory` with 
the `plus` action to add new Items. The newly added Items will also be directly shown.

The managed Category will automatically be removed from the manager if the plugin is unloaded. There is also an API `removeCategory` to 
remove the Category from management. This will not remove the requested Category from the VcsApp.

## Managing MappingFunctions. 
Items associated with the "dynamicContext" in a managed Category will be shown in the Components window. Plugins can add `MappingFunctions` to
the `categoryManager` to define the corresponding TreeViewItem for each Item. The `PredicateFunction` can be used to restrict the
`MappingFunction` to specific Items, for example only GeoJSON Layer.

```javascript
  const predicateFunction = (item, category) => {
    return item instanceof Object;   
  }
  const mappingFunction = (item, category, treeViewItem) => {
    treeViewItem.clickable = true;
    treeViewItem.clicked = () => { console.log(item); }
    treeViewItem.actions.push({
      name: 'myRemoveAction',
      icon: 'mdi-minus',
      callback: () => {
        category.collection.remove(item);
      },
    });
  }
  app.categoryManager.addMappingFunction(predicateFunction, mappingFunction, ['myCategory'], 'pluginName');
```
The above example will add a click handler and an action to remove the item, on all items from the Category `myCategory` where
the condition `item instanceof Object` is satisfied.

Removing a MappingFunction with `removeMappingFunction` will reset all TreeViewItems this function touched. The MappingFunctions for 
a specific Owner will also be removed on Plugin added/removed.

The TreeViewItem corresponds to the VcsTreeView and every MappingFunction can manipulate the same TreeViewItem.
This could mean that a second mappingFunction will override the first `clicked` Handler. The mappingFunctions are ordered
by the order of the Plugins in the VcsApp. 
