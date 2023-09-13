# @vcmap/hello-world

> Part of the [VC Map Project](https://github.com/virtualcitySYSTEMS/map-ui)

This is the `@vcmap/ui` **Hello World** plugin!

## Content

The plugin provides a minimal show-case working example including:

- implementing the VcsPlugin interface [index.js](./src/index.js)
  - plugin config
  - plugin state (set and getState)
  - plugin hooks
    - initialize
    - onVcsAppMounted
    - destroy
  - serializing (toJSON)
  - getDefaultOptions
  - internationalization (i18n)
- sample ui-component [helloWorld.vue](./src/helloWorld.vue)
  - using vcs and vuetify components
  - plugin assets (getPluginAssetUrl)
- plugin API testing [spec](./tests/helloWorld.spec.js)

## Notes

The plugin is loaded by [config/dev.config.json](../../../config/dev.config.json) with `showComponent` set to false.
You can change the configuration to see the component.

To run the test spec, call `npm run test plugins/@vcmap-show-case/hello-world/tests/helloWorld.spec.js` from the ui root directory.
