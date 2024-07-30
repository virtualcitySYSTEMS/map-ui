# Help Concept

The concept foresees a context based help in the VC Map.
Each plugin should provide own context specific help texts in their implementation.

Help can either be provided

- window based, referencing a help document explaining the overall tool or
- section based, explaining one specific function of a tool.

Help texts shall focus on the current task, a currently open window or plugin.
In general help sections shall not contain screenshots.

## Window Info

To provide a documentation of the overall plugin explaining all features, a help page should be referenced.
All [WindowComponent](./WINDOWS.md#windowcomponent)s provide an `infoUrl` option on the [WindowState](./WINDOWS.md#windowstate).
Providing an url will render a help icon (?) on the [WindowHeader](./WINDOWS.md#header).

> If you use the `hideHeader` option or use a custom `HeaderComponent`, make sure to implement your own help mechanism.

## VcsFormSection

VC Map UI provides an ui component with an option to display context based help.
[VcsFormSection](../src/components/section/VcsFormSection.vue) is meant to be used to structure form fields.
To provide a help for a section, use the `helpText` prop to pass plain text or an [i18n](INTERNATIONALIZATION.md) string:

```js
<VcsFormSection
  heading="pluginExample.formSectionTitle"
  help-text="pluginExample.helpText"
></VcsFormSection>
```

To provide a html based help, you may use the `help` slot of VcsFormSection:

```js
<VcsFormSection
  heading="pluginExample.formSectionTitle"
>
  <template #help>
    <ol>
      <li>{{ $t('pluginExample.help1') }}:</li>
      <li>{{ $t('pluginExample.help2') }}:</li>
      <li>{{ $t('pluginExample.help3') }}:</li>
    </ol>
  </template>
</VcsFormSection>
```

Whenever either a `helpText` prop is provided or the `#help` slot is implemented, a help icon (?) appears in the header of VcsFormSection.
If you make use of the `headerActions` prop, the help action will always be the first action displayed.

> Notice, that `#help` slot takes precedence over the `helpText` prop!
