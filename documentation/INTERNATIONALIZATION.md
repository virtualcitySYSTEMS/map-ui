# Internationalization I18n

For internationalization the @vcmap/ui uses VueI18n, see https://kazupon.github.io/vue-i18n/.

- delivers English and German I18n files.
- provides an api for plugins to inject plugin specific I18n mappings.
- extends the VcsModule with a section `i18n`, to inject I18n on VcsModule loading.
- allows to overwrite I18n keys with a VcsModule (configuration file).

## I18n keys

The default I18n keys are defined in the files `src/i18n/de.js` and `src/i18n/en.js`.

There is a `general` section for reusable general keys.
Further sections like `navigation`, eg. should not overlap with sections for dynamic content.
// TODO define how to name stuff.

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

## Translating Dynamic Content

Dynamic content is defined as content not known when starting the app, e.g. the title of a layer defined in the layer properties.
On rendering all dynamic content will be processed by VueI18n, so in the default case,
the key will not be found and the key(layerTitle) will be shown. If the layer title should be translated,
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

To make a text in a component translatable use:

```html
<h1>{{ $t('form.project.title') }}</h1>
```

## VcsApp

The VueI18n instance is part of the [VcsUiApp](../src/vcsUiApp.js). To translate a text in a JavaScript file use:

```js
const translated = vcsUiApp.vueI18n.t('form.project.title');
```

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

## Setup Vue/VueI18n/VcsUiApp

There is a 1:1 relationship between a VcsUiApp, a VueI18n instance and a Vue instance.

This relationship between the VcsUiApp and a VueI18n instance is set on VcsUiApp initialization.
Within the constructor of VcsUiApp, the VueI18n instance is created and using the `setupI18n` function
listeners on the `i18n` Collection and the `localeChanged` event are set up to synchronize the messages and currentLocale
with the VueI18n instance.
The last step is binding the VueI18n instance of the VcsUiApp to the Vue instance.

Example setup to init a VcsApp, setup Vue and VueI18n (see [initApp](../src/init.js) and [i18n](../src/vuePlugins/i18n.js)):

```javascript
import {
  VcsAppComponentWrapper,
  createVueI18n,
  setupI18n,
  VcsUiApp,
} from '@vcmap/ui';
const app = new VcsUiApp(); // executes createI18n() and setupI18n()
new Vue({
  i18n: app.vueI18n,
  render: (h) =>
    h(VcsAppComponentWrapper, {
      props: {
        appId: app.id,
      },
    }),
}).$mount('mountPoint');
```
