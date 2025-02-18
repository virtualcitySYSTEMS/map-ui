# Content Tree

The content tree maintains items like layers or viewpoints and creates a hierarchical, structured tree view.

## Configuration

The content tree is configured within its own section of the map config.
It is defined as a flat array of objects containing item options, which are deserialized to [ContentTreeItem](../src/contentTree/contentTreeItem.js)s.

Example content tree config:

```json
{
  "contentTree": [
    {
      "name": "baseMap",
      "type": "SubContentTreeItem",
      "icon": "$vcsPoi",
      "title": "Base Maps"
    },
    {
      "name": "baseMap.openStreetMap",
      "type": "LayerContentTreeItem",
      "layerName": "Openstreetmap OSM Cache"
    },
    {
      "name": "baseMap.aerialImage2015",
      "type": "LayerContentTreeItem",
      "layerName": "fisbroker-dop-2015"
    },
    {
      "name": "baseMap.places",
      "type": "NodeContentTreeItem",
      "title": "Places",
      "weight": 2
    },
    {
      "name": "baseMap.places.alexanderplatz",
      "viewpointName": "alexanderplatz",
      "type": "ViewpointContentTreeItem"
    }
  ]
}
```

The options are defined by `ContentTreeItemOptions`:

```js
/**
 * @typedef {Object} ContentTreeItemOptions
 * @property {string} name - name of the item defining the structure within the tree using dot notation.
 * @property {string} [title] - may be unset, if set from object properties later on. required otherwise
 * @property {string} [tooltip] - may be unset or set from object properties later on.
 * @property {string|HTMLCanvasElement|HTMLImageElement|undefined} icon - an icon URL or element to display.
 * @property {number} [weight] - optional weighting of the item. higher weights come first.
 * @property {string} [infoUrl] - optional info url providing link with additional information.
 * @property {boolean} [initOpen=false] - groups being initially open or not.
 * @property {import("@vcmap/ui/src/callback/vcsCallback.js").VcsCallbackOptions} [onClick] - optional callback actions executed on click
 * @property {import("@vcmap/ui/src/callback/vcsCallback.js").VcsCallbackOptions} [onActivate] - optional callback actions executed on activation of the item
 * @property {import("@vcmap/ui/src/callback/vcsCallback.js").VcsCallbackOptions} [onDeactivate] - optional callback actions executed on deactivation of the item
 */
```

The `name` option of an item specifies the structure of the content tree. Using dot notation different levels can be defined.
The `type` option defines the item type. Following types with specific behaviour and further options are available:

### Groups

- [GroupContentTreeItem](../src/contentTree/groupContentTreeItem.js): A clickable group item. When clicked, every child with a state not NONE will also be clicked. The group will only forward click events to visible and not disabled children.
- [NodeContentTreeItem](../src/contentTree/nodeContentTreeItem.js): A group item which has _no click handler_ and does not show the state of the children.

```js
/**
 * @typedef {ContentTreeItemOptions} GroupContentTreeItemOptions
 * @property {boolean} [disableIfChildrenDisabled=false] - optional flag to enable the behaviour that the group is disabled if all children are disabled, otherwise the Group is still clickable.
 */
```

- [LayerGroupContentTreeItem](../src/contentTree/layerGroupContentTreeItem.js): A layer group. When clicked will try to activate all layers in the group or deactivate all layer in the group if all are active.

```js
/**
 * @typedef {ContentTreeItemOptions} LayerGroupContentTreeItemOptions
 * @property {Array<string>} layerNames list of LayerNames which should be activated on click
 * @property {boolean} [showWhenNotSupported=false] - optional flag to show the item even if it is not supported by the activeMap.
 * @property {string} [defaultViewpoint] - the name of an optional default viewpoint
 */
```

### VcsObject

[VcsObjectContentTreeItem](../src/contentTree/vcsObjectContentTreeItem.js): An abstract class for VcsObject based items. It handles the overriding/setting of its own values based on the VcsObjects properties bag.

- [LayerContentTreeItem](../src/contentTree/layerContentTreeItem.js): A layer item. Activates/deactivates the layer when clicked.

```js
/**
 * @typedef {ContentTreeItemOptions} LayerContentTreeItemOptions
 * @property {string} layerName
 * @property {boolean} [showWhenNotSupported=false] - optional flag to show the item even if it is not supported by the activeMap.
 */
```

- [ObliqueCollectionContentTreeItem](../src/contentTree/obliqueCollectionContentTreeItem.js): An oblique collection item. Sets/unsets the oblique collection when clicked.

```js
/**
 * @typedef {ContentTreeItemOptions} ObliqueCollectionContentTreeItemOptions
 * @property {string} collectionName
 * @property {boolean} [showWhenNotSupported=false] - optional flag to show the item even if it is not supported by the activeMap.
 */
```

- [ViewpointContentTreeItem](../src/contentTree/viewpointContentTreeItem.js): A viewpoint item. Sets the viewpoint on the currently active map when clicked.

```js
/**
 * @typedef {VcsObjectContentTreeItem.Options} ViewpointContentTreeItemOptions
 * @property {string} viewpointName
 */
```

- [FlightContentTreeItem](../src/contentTree/flightContentTreeItem.js): A flight item. Allows for playing a flight from the content tree. Callbacks for onActivate are called on play, when playing from a paused state and onDeactivate are called on stop. Pausing and continueing a flight does not trigger any callbacks.

```js
/**
 * @typedef {VcsObjectContentTreeItem.Options} FlightContentTreeItemOptions
 * @property {string} flightName
 * @property {boolean} [showWhenNotSupported=false] - optional flag to show the item even if it is not supported by the activeMap.
 */
```

### Subtree

- [SubContentTreeItem](../src/contentTree/subContentTreeItem.js): A subtree item. Subtrees are rendered in their own (not the main content tree).
  They will receive their own toggle button in the nav bar.
  Only toplevel items can be content tree items (with a name which does not have a .)

## ContentTreeCollection

The [ContentTreeCollection](../src/contentTree/contentTreeCollection.js) is an overridable indexed collection of [ContentTreeItem](../src/contentTree/contentTreeItem.js)s.

The ContentTreeCollection maintains its items and creates a sorted, hierarchical tree view.
The tree gets updated, if an item is added or removed or if weight of an item changes.
For each subtree an action button is added to the navbar.

## ContentTreeItem

Each [ContentTreeItem](../src/contentTree/contentTreeItem.js) in the [ContentTreeCollection](../src/contentTree/contentTreeCollection.js) must implement the `TreeViewItem` interface:

```js
/**
 * A readonly rendering interface of a ContentTreeItem.
 * @typedef {Object} TreeViewItem
 * @property {string} name
 * @property {boolean} visible - Whether to display this item or not.
 * @property {boolean} clickable - Whether this item reacts to click events, e.g. with visual feedback
 * @property {boolean} disabled - Whether this item should be displayed as disabled.
 * @property {StateActionState} state - The state of this item. NONE if this item cannot have a state.
 * @property {string} title - The title to be displayed
 * @property {string} [tooltip]
 * @property {string|HTMLCanvasElement|HTMLImageElement|undefined} icon - An optional icon to display with this item. Can be an URL or HTMLElement.
 * @property {Array<VcsAction>} actions
 * @property {Array<TreeViewItem>} children
 * @property {Array<TreeViewItem>} visibleChildren - computed property
 * @property {function():Promise<void>} clicked - A callback called once the item is clicked.
 */
```

Items must have a name, a state and a title.
Items can be displayed as visible or not, clickable or not and disabled or not.
It may have a tooltip, an icon, actions and children.

### Actions

To manage actions ContentTreeItem class provides an API:

- `addAction` adds an action to the item with an optional weight. The predefined actions have the following weights:
  - StateAction: 0
  - GoToViewpoint: 2
  - StyleSelector: 4
  - InfoUrl: 6
  - GoToExtent: 8
    The default weight is set to always push new actions past these.

> Action names must be unique within a ContentTreeItem!

- `removeAction` removes an action of provided name from the item.

### State

Per default a state action is added to all items, except if they were configured with state `NONE`.
The state action contains the clicked callback function of an item.
It visualizes the states `INACTIVE`, `LOADING`, `ACTIVE` and `INDETERMINATE` on the tree view item.
