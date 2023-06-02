# Categories

Categories is a concept to store and manage arbitrary items with the ability to serialize and deserialize to modules.

In the map ui categories are listed in the "My Workspace" window.
Items of Categories from the VcsApp dynamic module are rendered in list views.

Prerequisite is that a category has to be added to the VcsApp and a plugin or the VcsApp has
to add the Category to the `categoryManager`.

The "My Workspace" window provides a view on the synchronized list of VcsListItem corresponding to the underlying Category and
Category Items. The `categoryManager` allows adding Category level actions and Item level actions.  
The `categoryManager` is owner specific, so on plugin added/overriden/removed the managed Categories will be changed.

For more information on the see the [category manager](./COLLECTIONS.md#categorymanager) section of the collections readme.
