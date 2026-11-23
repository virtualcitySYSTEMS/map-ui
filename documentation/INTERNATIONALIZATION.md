# Internationalization I18n

The @vcmap/ui ships its own lightweight i18n implementation (see [vcsI18n](../src/i18n/vcsI18n.ts)).
Its API and message syntax are compatible with the subset of [vue-i18n](https://vue-i18n.intlify.dev/) previously used by the VC Map,
without pluralization. Messages are rendered by the template engine of the @vcmap/core (`compileTemplate` with single brace delimiters,
see the [template documentation](https://github.com/virtualcitySYSTEMS/map-core/blob/main/documentation/vcsTemplate.md)).

- delivers English and German I18n files.
- provides an api for plugins to inject plugin specific I18n mappings.
- extends the VcsModule with a section `i18n`, to inject I18n on VcsModule loading.
- allows to overwrite I18n keys with a VcsModule (configuration file).

## I18n keys

The default I18n keys are defined in the files `src/i18n/de.ts` and `src/i18n/en.ts`.

There is a `general` section for reusable general keys.
Further sections like `navigation`, eg. should not overlap with sections for dynamic content.

I18n keys are managed in the `vcsUiApp.i18n` `Collection`. New keys can be added to the Collection via
the `i18n` section in the VcsModule (configuration file), the `i18n` section in a Plugin or via the API.

```javascript
app.i18n.add({ de: { myMessages: 'test' } });
```

You can optionally provide a name and properties, when adding new messages:

```javascript
app.i18n.add({
  name: 'MyI18nMappings',
  properties: {},
  de: { myMessages: 'test' },
});
```

All added I18n keys will be merged in the order they have been added to the collection.

If a key cannot be found in the current locale, it is looked up in English and then in German.
If it cannot be found at all, the key itself is returned.

## Message syntax

Messages support the following syntax:

| Syntax      | Example                                                        | Usage                                                   |
| ----------- | -------------------------------------------------------------- | ------------------------------------------------------- |
| Named       | `File {fileName} could not be parsed.`                         | `t('key', { fileName: 'a.json' })`                      |
| List        | `{0}-{1} of {2}`                                               | `t('key', [1, 10, 100])`                                |
| Literal     | `Use {'{'} and {'}'}`                                          | renders the reserved characters `{` and `}`             |
| Linked      | `{#t 'general.name'}: {name}`                                  | renders the message `general.name` with the same values |
| Conditional | `{count} {#if [">", ["get", "count"], 1]}items{else}item{/if}` | `t('key', { count: 2 })`                                |

- Any text within braces is a placeholder: `{foo bar}` renders the parameter `foo bar`. Use literals to render braces as text.
- Whitespace within placeholders is allowed: `{ name }`.
- Missing parameters are rendered as empty string. `null` and `undefined` are rendered as empty string,
  arrays and plain objects are JSON stringified, when rendered. Nested keys (`{user.name}`, `{items.length}`),
  conditions and iterations use the values as is.
- Pluralization is not supported, the `|` character is rendered as is. Use a conditional block or separate keys
  and select the key in your code, e.g. `t(count === 1 ? 'items.one' : 'items.many', { count })`.
- Empty (`{}`) and unclosed placeholders (`{ name`) are text: they are rendered as is, without a warning.
  Invalid placeholders (`{[bad}`, `{'unclosed}`), malformed block tags (`{#if}`, `{else if a}`) and block tags
  outside of a block (`{else}`) are rendered as is and a warning is logged. Rendering a message never throws.
- The `@` character is rendered as is, use `{#t 'other.key'}` instead of `@:other.key` for linked messages.
  Circular linked messages, which reference themselves directly or indirectly (`a` → `b` → `a`), are rendered as their key.

## Translating Dynamic Content

Dynamic content is defined as content not known when starting the app, e.g. the title of a layer defined in the layer properties.
On rendering all dynamic content will be translated, so in the default case,
the key will not be found and the key(layerTitle) will be shown as is. If the layer title should be translated,
a `i18n` section can be added to the VcsModule.

Example VcsModule configuration file:

```json
{
  "i18n": [
    {
      "name": "My i18n configuration",
      "de": {
        "layers": {
          "myLayer": {
            "title": "myLayerTitle Deutsch"
          }
        }
      },
      "en": {
        "layers": {
          "myLayer": {
            "title": "myLayerTitle english"
          }
        }
      }
    }
  ],
  "layers": [
    {
      "name": "myLayer1",
      "properties": {
        "title": "myLayerTitle"
      }
    },
    {
      "name": "myLayer",
      "properties": {
        "title": "layers.myLayer.title"
      }
    }
  ]
}
```

This example, with the locale set to `en` will render the title of the layer named `myLayer1` as `myLayerTitle` and the
title of the layer named `myLayer` as `myLayerTitle english`.  
The translations should be in the same section in the I18n as the dynamic module, so for a layer use the `layers.` prefix,
for styles use `styles.` etc.

## Writing Components

To make a text in a component translatable use the template helpers `$t` or `$st`:

```html
<h1>{{ $t('form.project.title') }}</h1>
<p>{{ $st('shadowMap.areaTooLarge', { maxArea }) }}</p>
<p>{{ $st(layer.properties.title) }}</p>
```

`$t` and `$st` (safe translate) are the same function, as are `t` and `st` of the i18n instance (`app.vcsI18n`).
They never throw and handle keys which are not strings: `null` and `undefined` are rendered as empty string,
other keys (e.g. numbers) are converted to strings without being translated. If no message is found, the key is rendered.

Within the `setup` of a component, use `useVcsI18n` (the counterpart of `useI18n` of vue-i18n) to access the i18n instance of the app:

```js
import { useVcsI18n } from '@vcmap/ui';

const { t, locale } = useVcsI18n();
const title = computed(() => t('form.project.title'));
const formatter = computed(() => new Intl.NumberFormat(locale.value));
```

`useVcsI18n` returns the same instance as `app.vcsI18n` (see [VcsApp](#vcsapp)). `locale` is a read-only ref, set the
locale on the app instead. `availableLocales` is evaluated when destructured: use `useVcsI18n().availableLocales` to
get the current locales. `useVcsI18n` throws, if it is not called within the `setup` of a component.
For compatibility with vue-i18n, the deprecated and read-only `$i18n.locale` is available in templates. It will be removed in next major release.

Templates are rerendered, if the locale changes or messages are added or removed.

## VcsApp

The i18n instance is part of the [VcsUiApp](../src/vcsUiApp.ts). To translate a text in a JavaScript file or within the `setup` of a component use:

```js
const translated = vcsUiApp.vcsI18n.t('form.project.title');
```

`vcsUiApp.vcsI18n` provides:

| API                                                              | Description                                                                                              |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `t(key, named \| list)`                                          | translates a key, see [message syntax](#message-syntax)                                                  |
| `te(key, locale?)`                                               | `true`, if a message exists for the key in the given or current locale. Fallback locales are ignored     |
| `tm(key)`                                                        | the raw message (or message object) for the key, without interpolation                                   |
| `locale`                                                         | a read-only `Ref` of the current locale, e.g. to be used with `Intl`. Set `vcsUiApp.locale` to change it |
| `availableLocales`                                               | all locales with messages                                                                                |
| `getLocaleMessage(locale)`, `setLocaleMessage(locale, messages)` | access messages of a locale. Use `vcsUiApp.i18n` to add messages                                         |

Do not import `useI18n` from `vue-i18n` in plugins, use `useVcsI18n` from `@vcmap/ui` (in components) or `vcsUiApp.vcsI18n` instead.

The VcsApp instance has a property `locale` to access and set the current application locale. There is
also a `localeChanged` event.

On initialization the locale will be set depending on the browser locale, if not
possible the default locale is always `en`.

```javascript
const app = new VcsApp({});
app.locale = 'de';

app.localeChanged.addEventListener((locale) => {
  console.log('Locale changed', locale);
});
```

## I18n in Plugins

A Plugin has access to all I18n keys provided by the VcsApp, and can also define its own keys.
Plugin specific keys should be namespaced with the plugin name.

In special cases a Plugin can also override application wide I18n keys.

```javascript
/**
 * @param {PluginExampleConfig} config
 * @returns {VcsPlugin}
 */
export default function defaultExport(config) {
  return {
    get name() {
      return 'examplePlugin';
    },
    i18n: {
      de: {
        examplePlugin: {
          project: 'my german Project',
        },
        form: {
          save: 'Save new',
        },
      },
      en: {
        examplePlugin: {
          project: 'my english project',
        },
      },
    },
  };
}
```

## Adding a new language to the Application

To add a new language to the following approach can be taken.

- configure a new vcMap which should include all plugins to be translated.
- use the api to get the complete JSON Object for all provided keys.

```javascript
const allI18nKeys = app.i18n.getMergedMessages();
const english = allI18nKeys.en;
const stringifiedJSON = JSON.stringify(english, null, 2);
```

- write the stringifiedJSON to a new VcsModule configuration file with the following content. This example uses `pl` as an example.

```JSON
{
  "i18n": [{
    "name": "polish i18n configuration",
    "pl": stringifiedJSON
  }]
}
```

- translate all english keys to the new language.

This new VcsModule configuration file can now be loaded as a VcsModule in the vcMap.

## Setup Vue/I18n/VcsUiApp

There is a 1:1 relationship between a VcsUiApp, an i18n instance and a Vue instance.

The i18n instance is created within the constructor of VcsUiApp (see `createDefaultI18n`). Its locale is the locale of
the app: the instance reads `app.locale` and updates on the `localeChanged` event, so both never differ. The locale of the
i18n instance is read-only, set `app.locale` to change it. Using the `setupI18n` function, a listener on the `i18n`
Collection is set up to synchronize the messages with the i18n instance.
The last step is installing the i18n instance of the VcsUiApp as plugin in the Vue instance. This provides the template helpers `$t` and `$st`.
The vuetify instance of the VcsUiApp translates its messages using the same i18n instance.

Example setup to init a VcsApp and setup Vue (see [initApp](../src/init.ts) and [i18n](../src/vuePlugins/i18n.ts)):

```javascript
import { createApp } from 'vue';
import { VcsAppComponentWrapper, VcsUiApp } from '@vcmap/ui';

const app = new VcsUiApp(); // creates the i18n instance with the app locale and executes setupI18n()
const vueApp = createApp(VcsAppComponentWrapper, { appId: app.id });
vueApp.use(app.vcsI18n);
vueApp.use(app.vuetify);
vueApp.mount('#mountPoint');
```
