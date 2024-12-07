# Features & Breaking Changes

See [Changelog](./CHANGELOG.md) for a detailed list of changes.

# Typical Migrations

- update all `@input` `:value` and custom `emit('input')` in `v-model` components update to the [new syntax](https://v3-migration.vuejs.org/breaking-changes/v-model.html).
- replace `::v-deep` with `:deep()` in `scss`.
- replace old vcs utility css classes `border-1--primary`, `border-2--primary`, `user-select-none`, `d-contents`, `fade-in-100...`, `pos-...`, `w-full` --> `w-100`, `w-half` --> `w-50`,
  `h-...`, `w-...`, `slide-from...`, `-m...`, `z-index...`, `transition...`, `flip-vertical`, `rotate`, `gap...` --> `gc-`, `text--disabled` --> `text-disabled`
- check css, use provided css variables to calculate values for fonts and heights.
- Write new story for the component.
- replace `VcsTooltip` with `v-tooltip`, see [VcsCheckbox](./src/components/form-inputs-controls/VcsCheckbox.vue) for an example how to implement tooltip and error tooltips.
- Make sure you set `:hide-details=false` when implementing an error tooltip inside your component. This will ensure that the message slot is available and can be used for displaying the error tooltip.
- Check order of `v-bind="{ ...$attrs }"`, see https://v3-migration.vuejs.org/breaking-changes/v-bind.html#_3-x-syntax the behaviour to Vue2 has changed.
- A new `VcsExtentEditor.vue` component is exported.
- use new helper for components:
  - `useProxiedAtomicModel` when creating a component with an atomic model value
  - `useProxiedComplexModel` when creating a component with an array or object model value
  - `removeListenersFromAttrs` when binding attrs without listener
- Update Wizard steps beginning from 0 instead of 1
- `@vcsuite/check` should be updated to v2 if used

# Troubleshooting & Solutions

| Problem                                                                                                                                         | Solution                                                                                                                                                                                                                          |
| ----------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I have weird issues where something is trying to bind `modelValue` to a tooltip or other undefined property validation failing                  | this is auto bind, add `inheritAttrs: false` to the component you are using                                                                                                                                                       |
| where did ::v-deep go?                                                                                                                          | it has been replaced with :deep() pseudo element                                                                                                                                                                                  |
| my custom v-model no longer updates                                                                                                             | be sure to update to the [new syntax](https://v3-migration.vuejs.org/breaking-changes/v-model.html)                                                                                                                               |
| my array refs no longer work properly                                                                                                           | arrays can now be `reactive`. refactor to that                                                                                                                                                                                    |
| my actions of list items do not work properly                                                                                                   | use an `reactive` array of list items: `const items = reactive([{ name: 'example', actions: [{ ... }] }]);`                                                                                                                       |
| my list entries look weird                                                                                                                      | the list apis have changed. use slots `prepend` and `append` for most things                                                                                                                                                      |
| my action is not reactive anymore                                                                                                               | actions need to be reactive, for changes to the action object to be tracked reactive(action) before                                                                                                                               |
| ...                                                                                                                                             | changing the state, action.active = true                                                                                                                                                                                          |
| my component options are no longer part of lists                                                                                                | with the change to Proxy objects, adding stuff to reactive arrays will add a _proxy_. You must use `toRaw` when checking if a value is included (typically with actions or other places where we dont check using `name`)         |
| my component used VcsTooltip to display error messages                                                                                          | See [VcsCheckbox](./src/components/form-inputs-controls/VcsCheckbox.vue) for an example how to implement tooltip and error tooltips.                                                                                              |
| what happened to `var(--v-base-xxx)`                                                                                                            | you must use `rgb(var(--v-theme-base-lighten-2))` or similar. prefix with theme                                                                                                                                                   |
| my VcsTextField component doesn't work any more for input type file                                                                             | use new component [VcsFileInput](./src/components/form-inputs-controls/VcsFileInput.vue) instead.                                                                                                                                 |
| my `PluginEditorComponent` has type errors now                                                                                                  | you must ensure you actually adhere to the interface and use `PropType` for the functions so it conforms with the interface                                                                                                       |
| my VcsWizard actions are not shown for the active step                                                                                          | Check the step counting. It has to start with 0, not with 1!                                                                                                                                                                      |
| rename no longer works on list items                                                                                                            | make sure your list item _is reactive_ before passing it to the create rename helper                                                                                                                                              |
| I get an console error "DOMException: Failed to execute 'structuredClone' on 'Window': #<Object> could not be cloned."                          | This is due to vue3 reactivity changes. You cannot apply a structuredClone on a proxy object. Use toRaw before cloning the object.                                                                                                |
| ...                                                                                                                                             | Note: in Vue 3 toRaw unwraps the outermost reactive proxy and returns the original non-reactive object. Nested reactive properties within this object remain reactive unless toRaw is explicitly applied to each nested property. |
| My VcsTextField with v-model.number behaves strange, e.g. cursor jumps to end on input                                                          | You may parse the input yourself to workaround this issue and omit ".number"                                                                                                                                                      |
| When using `<script setup>` component name will be derived fom file name. This could lead to "Component name "test" should always be multi-word | Rename vue file to TestTool.vue                                                                                                                                                                                                   |
| I used `$shades` variable in my CSS                                                                                                             | Use newly introduced color `surface-light`, e.g. `background: rgb(var(--v-theme-surface-light));`                                                                                                                                 |
| ...                                                                                                                                             | There is no need to differ between dark and light theme any more. The color variable is defined accordingly for both themes. Do not forget to remove the `shadess.scss` import from your style definition.                        |
| `getColorByKey(app, 'primary', 'lighten1)` returns undefined                                                                                    | Variant names have changed to `lighten-1`.                                                                                                                                                                                        |
| My VcsSelect does not work anymore with disabled items.                                                                                         | Vuetify API has changed. It expects the disabled now to be wrapped inside a props object: `const myItems = ref([{ title: "Item 1", value: 1, props: { disabled: true }}];`                                                        |

## Vue 3 Reactivity

- reactive()
  - accessing properties on the original Object will not be reactive, this changed to vue2.
  - Vue3 is using Proxy Objects now, so the reactive Object is not the same as the original Object

```
  const o = {
    test: '1'
  };

  const reactiveO = reactive(o);

  // not reactive in vue3, but did work in vue2
  o.test = '2';

  // reactive
  reactiveO.test = '2';
```

- using `props` Object for a component, used by the windowManager

```
  const atomicRef = ref(string);
  const complexRef = ref(['test']);

  const reactiveObject = reactive({ test: 'test' });

  windowManager.add({
    component: MyComponent,
    props: {
      atomicRef,
      complexRef,
      reactiveObject,
    },
  });

  `MyComponent.vue`
  <template>
     {{ atomicRef }} // works atomicRefs get Unwrapped in the Template
     {{ complexRef[0] }} // does not work, complex Refs do not get unwrapped in the Template
     {{ complexRefSetup[0] }} // does work, complex Refs will get unwrapped in the Setup
     {{ reactiveObject.test }} // works
  </template>
  <script>
    export default {
      name: 'MyComponent',
      props: {
        atomicRef:Object,
        complexRef:Object,
        reactiveObject:Object,
      },
      setup(props) {
          const complexRefSetup = props.complexRefSetup;
          return {
             complexRefSetup,
          }
      }
    }
  </script>
```

- If you want to provide reactivity through the props Object in the WindowManager, use reactive, and try to avoid
- passing refs through the `props` Object. If necessary refs can be injected using `provide/inject`
- using `ref` on an Array will cause _every_ entry added to the array
  to be reactive, thus `const foo = ref([]); const bar = {}; foo.value = [bar];` will
  lead to `foo.value.filter(a => a === bar);` will be empty, because it contains _the proxy of bar_.
  If you actually require deep reactivity on the array, use `toRaw` for comparisons
  otherwise, as in most cases use `shallowRef` and have the providing interface allow
  the adding of reactive objects, thus moving proxy creation to where it is
  actually required.
  > using `ref` or `reactive` in an underlying API will always
  > have side effects unless
  > you only allow `UnwrapRef`or`UnwrapNestedRef` as the input type.
  >
  > ```typescript
  > class ActionList {
  >   _actions = ref<VcsAction[]>([]);
  >
  >   add(action: VcsAction): void {
  >     this._actions.value = [...this._actions.value, action];
  >   }
  >
  >   has(action: VcsAction): boolean {
  >     return this._actions.value.findIndex((a) => a === action) > -1;
  >   }
  > }
  >
  > const action: VcsAction = { name: 'bar', callback(): void {} };
  > const list = new ActionList();
  > list.add(action);
  > // throws list actually does not inlcude action, but a Proxy.
  > assert(list.has(action));
  >
  > const reactiveAction = reactive(action);
  > list.add(reactiveAction);
  > // true since the proxy is added as is
  > assert(list.has(reactiveAction));
  > ```
