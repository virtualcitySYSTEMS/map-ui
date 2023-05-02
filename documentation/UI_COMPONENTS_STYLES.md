# UI Components and Styles

To ensure a consistent user interface a set of standard ui components with a default style are provided.
Most components are stylized wrappers around [vuetify](https://vuetifyjs.com) components.
Plugins should use the provided components or vuetify components whenever possible.

## Components

The repository provides a set of generic UI components based on Vuetify:

- [buttons](../src/components/buttons)
- [form-inputs-controls](../src/components/form-inputs-controls)
- [form](../src/components/form-output)
- [lists](../src/components/lists)
- [notification](../src/components/notification)
- [tables](../src/components/tables)

### Buttons

The ui provides two kinds of buttons:

#### [VcsButton](../src/components/buttons/VcsButton.vue)

A button to be used as Tool (`large` variant) or Action Button (`small` variant).
Its main usage is with a [VcsAction](./ACTIONS.md):

- Tool button (Navbar, Toolbox)

```html
<VcsButton
  large
  :id="action.name"
  :tooltip="action.title"
  :icon="action.icon"
  :active="action.active"
  @click.stop="action.callback($event)"
/>
```

- Action button (form sections, content tree, ...)

```html
<VcsButton
  small
  :id="action.name"
  :tooltip="action.title"
  :icon="action.icon"
  :active="action.active"
  @click.stop="action.callback($event)"
/>
```

#### [VcsFormButton](../src/components/buttons/VcsFormButton.vue)

A button to be used within windows or form fields.
The VcsFormButton has two variants to differentiate the importance of buttons used in a row and put emphasis on primary actions:

- outlined (default)
- filled (emphasised variant for primary actions)

All properties and attributes of a VcsButton are passed to the v-btn, which the VcsButton is based on.
The following example shows a row of buttons with secondary and primary actions:

```html
<div class="d-flex gap-2 px-2 pt-2 pb-1">
  <div class="d-flex gap-2">
    <VcsFormButton icon="$vcsPlus" @click="newDialog = true" />
    <VcsFormButton icon="$vcsExport" @click="uploadDialog = true" />
  </div>
  <div class="d-flex gap-2 w-full justify-end">
    <VcsFormButton @click="addManagedCategories" variant="filled">
      Save
    </VcsFormButton>
  </div>
</div>
```

## Styles

This ui components library follow an individual style on top of [vuetify](https://vuetifyjs.com), customized by overwriting styles and extended by own style definitions.
The style is defined on three levels following this order:

1. [vuetify API](https://vuetifyjs.com/en/api/vuetify/), e.g. make use of properties like `dense, outlined`
2. [sass](https://sass-lang.com/) variables
   - overwriting vuetify in [variables.scss](/src/styles/variables.scss)
   - defining own variables (e.g. [vcsFont.scss](/src/styles/vcsFont.scss)
3. scoped [css](https://developer.mozilla.org/en-US/docs/Learn/CSS/First_steps/What_is_CSS) within single components

New components should follow this order of style definitions.

## Best practises

When using input components:

- Wrap input components always in a container (v-containter, div, etc.) with the following classes:
  - px-1 (4px left and right)
  - py-0
- When using v-rows, they should have the following classes:
  - no-gutters
- If adding non input components, like a p-tag, make sure to add 4px padding at left and right side. If there are no input components at all, use px-2 for the container.

Example:

```html
<template>
  <v-container class="px-1 py-0">
    <v-row no-gutters>
      <v-col>
        <VcsLabel html-for="textInput">Label</VcsLabel>
      </v-col>
      <v-col>
        <VcsTextField id="textInput" />
      </v-col>
    </v-row>
    <v-row no-gutters>
      <v-col>
        <div class="px-1">
          <p>This is not an input element</p>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>
```
