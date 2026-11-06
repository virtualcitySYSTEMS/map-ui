# Features & Breaking Changes

See [changelog](./CHANGELOG.md) for a detailed list of changes.

## Compiled npm library (7.0.0-rc.3)

- Requires `@vcmap/plugin-cli` 5 with Vue 3.5 / Vuetify 4 support
  (5.0.0-rc.1 still needs dependency updates).
- Remove the `ensure-types` script and all `vcmplugin ensure-types` calls from
  setup and CI; declarations are included in the package.
- Import types from `@vcmap/ui`, not deep paths under `@vcmap/ui/src/`.

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
