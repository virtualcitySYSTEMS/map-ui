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

## Styles
This ui components library follow an individual style on top of [vuetify](https://vuetifyjs.com), customized by overwriting styles and extended by own style definitions.
The style is defined on three levels following this order:
1. [vuetify API](https://vuetifyjs.com/en/api/vuetify/), e.g. make use of properties like `dense, outlined`
2. [sass](https://sass-lang.com/) variables
   - overwriting vuetify in [variables.scss](/src/styles/variables.scss)
   - defining own variables (e.g. [vcsFont.scss](/src/styles/vcsFont.scss)
3. scoped [css](https://developer.mozilla.org/en-US/docs/Learn/CSS/First_steps/What_is_CSS) within single components

New components should follow this order of style definitions.