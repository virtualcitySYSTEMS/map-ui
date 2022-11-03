# Help Concept

The concept foresees a context based help in the VC Map.
This means help is only shown for the current task, a currently open window or plugin.
Each plugin should provide own context specific help texts in their implementation.
In general help sections should not contain screenshots.

## VcsFormSection

VC Map UI provides an ui component with an option to display help.
[VcsFormSection](../src/components/form-inputs-controls/VcsFormSection.vue) is meant to be used to structure form fields.
To provide a help for a section, use the `helpText` prop to pass plain text or an [i18n](INTERNATIONALIZATION.md) string:

```js
<VcsFormSection
  heading="pluginExample.formSectionTitle"
  help-text="pluginExample.helpText"
>
</VcsFormSection>
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

