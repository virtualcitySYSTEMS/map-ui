# Features & Breaking Changes

See [changelog](./CHANGELOG.md) for a detailed list of changes.

# Typical Migrations

- call `createFlightVisualizationAction` synchronously
- replace `rectangleToExtent` by `rectangleToMercatorExtent`
- replace `setupDraggableList` by new logic `setupDraggableListOrTree`
- replace `targetIndex` property from ItemMovedEvent by `targetItem`
- update generic `ToolboxComponentOptions` / `ToolboxComponent` usages to the new `ToolboxType`-based signatures
- pass a required `url` instance to getStateFromURL
- ensure ToolboxComponentOptions have an `id`
- remove references to `draggable` property setter of CollectionComponentClass

## Slot Props in VcsSelect.ts.vue (item → internalItem)

Vuetify 4 changed the slot param on v-select's `#selection` from `item` to `internalItem`.
In `VcsSelect.ts.vue`, the forwarded slot was changed to `#selection="{ internalItem, index }"`.

## Deprecated enums

- replace `WindowSlot` by literal string keys (`static`, `dynamicLeft`, `dynamicRight`, `dynamicChild` or `detached`)
- replace `LegendType` by literal string keys (`ImageLegendItem`, `IframeLegendItem` or `StyleLegendItem`)
- replace `PlayerDirection` by literal string keys (`forward` or `backward`)
- replace `StyleRowType` by literal string keys (`StrokeLegendRow`, `FillLegendRow`, `CircleLegendRow`, `IconLegendRow`, `RegularShapeLegendRow` or `TextLegendRow`)

## Casing changes

- `VcsUiAppConfigPattern` to `vcsUiAppConfigPattern`
- `EditorTransformationIcons` to `editorTransformationIcons`
