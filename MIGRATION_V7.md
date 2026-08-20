# Features & Breaking Changes

See [changelog](./CHANGELOG.md) for a detailed list of changes.

# Typical Migrations

- replace `rectangleToExtent` by `rectangleToMercatorExtent`

## Slot Props in VcsSelect.ts.vue (item → internalItem)

Vuetify 4 changed the slot param on v-select's `#selection` from `item` to `internalItem`.
In `VcsSelect.ts.vue`, the forwarded slot was changed to `#selection="{ internalItem, index }"`.
