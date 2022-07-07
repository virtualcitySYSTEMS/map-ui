# UI Config
The UI configuration is meant to provide means to configure certain aspects of
the UI, for instance the primary theme color or the logo used. UI configuration
is context sensitive and may be overridden in later contexts. Within a contexts 
configuration, the UI configuration is provided by an Array of configuration items,
which in turn is mapped to an `OverrideCollection` on the `VcsUiApp` called `uiConfig`. 
Each entry provides a `name` (aka key) and `value` for the configuration. To override a
previously defined configuration parameter, simple use the `override` API on the collection
with the same `name`.

For convenience, the `UiConfig` `OverrideCollection` provides you with a reactive
`Ref<Object<string, *>>`, named `config`, which provides you with direct access to the keys
in a reactive fashion for easier use in `Vue` components (see the example below).
You can also `watch` this `Ref` to react to changes in the configuration programmatically
(instead of reacting to the `OverrideCollection` events directly).

The default configuration keys are typed, see the `UiConfigObject` interface for a complete list.
You can easily be extended the config for custom use (see example).

The following outlines how to use the `UiConfig` in your `Vue` component and add
your own custom property.
```vue
<template>
  <VcsButton 
    :color="uiConfig.myColor ?? 'primary'" 
    icon="$vcsTouch" 
    @click="toggle"
  />
</template>
<script>
  import { VcsButton } from '@vcmap/ui';
  import { inject } from 'vue';

  export default {
    components: {
      VcsButton,
    },
    setup() {
      const app = inject('vcsApp');
      let item;
      
      return {
        uiConfig: app.uiConfig.config,
        toggle() {
          if (item) {
            app.uiConfig.remove(item);
            item = null;
          } else {
            item = { name: 'myColor', value: '#FF00FF' };
            app.uiConfig.override(item);
          }
        },
      };
    }
  }
</script>
```
