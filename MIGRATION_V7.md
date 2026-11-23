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

## I18n

`vue-i18n` was replaced by an own implementation with a compatible API, see [documentation](./documentation/INTERNATIONALIZATION.md).
`$t`, `$st` and the i18n instance of the app, now `app.vcsI18n` (`t`, `te`, `tm`, `locale`, `availableLocales`,
`getLocaleMessage`, `setLocaleMessage`), work as before, except for the changes listed below, as do messages with named, list and literal placeholders.
Pluralization is no longer supported.

- replace `useI18n()` from `vue-i18n` by `useVcsI18n()` from `@vcmap/ui`: `const { t, locale } = useVcsI18n();`.
  `vue-i18n` is no longer installed in the app, `useI18n` fails at runtime.
- remove `vue-i18n` from the plugin dependencies, if it was only used for `useI18n` or its types.
- replace the types `Composer` and `I18n` from `vue-i18n` by `VcsI18n` from `@vcmap/ui`.
- replace `app.vueI18n` and `app.vueI18nPlugin.global` by `app.vcsI18n`. `app.vueI18n` and `app.vueI18nPlugin` are
  deprecated and return the same instance as `app.vcsI18n`.
- replace `createVueI18n` by `createDefaultI18n`, `createVueI18n` was removed.
- replace the template helpers `$te`, `$tm`, `$rt`, `$d` and `$n` by `app.vcsI18n.te`, `app.vcsI18n.tm`
  or `Intl.DateTimeFormat` / `Intl.NumberFormat` with `app.vcsI18n.locale.value`.
- set the locale with `app.locale` instead of `app.vueI18n.locale.value` or vuetify's `useLocale().current.value`.
  `app.vcsI18n.locale` is read-only: writes are ignored (and do not compile in TypeScript). Writes to vuetify's
  `current` locale are ignored and log a warning.
- do not mutate messages returned by `app.vcsI18n.getLocaleMessage` or `app.vcsI18n.tm`: mutations are not rendered
  (vue-i18n re-rendered on such mutations) and are lost, when messages are set. Pass a changed copy to `setLocaleMessage` instead:
  `app.vcsI18n.setLocaleMessage('en', { ...app.vcsI18n.getLocaleMessage('en'), foo: 'bar' })`.
  Use `structuredClone` to change nested messages.
- replace `$i18n.locale` in templates by the locale ref of the app. `$i18n.locale` is deprecated and read-only,
  it will be removed in next major release. Other members of `$i18n` are no longer available:

  ```vue
  <script setup>
    import { useVcsI18n } from '@vcmap/ui';

    const { locale } = useVcsI18n();
  </script>

  <template>
    <!-- before: formatDate(item.createdAt, $i18n.locale) -->
    {{ formatDate(item.createdAt, locale) }}
  </template>
  ```

- replace messages with plural forms (`one item | {count} items`) by separate keys and select the key in your code,
  e.g. `t(count === 1 ? 'items.one' : 'items.many', { count })`. Pluralization is no longer supported:
  the `|` character is rendered as is and no longer needs to be escaped.
- only pass the key and the named or list values to `t`, `$t` and `$st`: `t('key', { name })` or `t('key', [value])`.
  Further arguments are ignored: the plural number (`t('key', 2)`), the default message (`t('key', 'default')`)
  and the options (`{ plural, default, locale }`). Use `te` to check for a key, if a default message is required.
- `t` and `$t` behave like `$st`: keys which are not strings are not translated (`t(3)` renders `3`, `t(null)` renders
  an empty string). Pass message keys as strings.
- remove `<v-locale-provider>`, scoped locales are not supported. All vuetify components use the locale of the app.

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
