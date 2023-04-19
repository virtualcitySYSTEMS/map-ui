# VC Map Plugin Theme Changer

This is a plugin to manage themes of the VC Map.
This plugin provides 4 themes:

- VCS Theme (defined by `@vcmap/ui`)
- Theme 1
- Theme 2
- Theme 3

Per config custom themes can be added.

## configuration

You can override the themes array by defining your own themes. A theme must provide:

### VcMapTheme

| Property | Type         | Description            |
| -------- | ------------ | ---------------------- |
| name     | string       | name of the theme      |
| dark     | VuetifyTheme | dark theme definition  |
| light    | VuetifyTheme | light theme definition |
