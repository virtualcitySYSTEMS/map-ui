# Font Settings

The typography styles used in the VC Map UI, like the font-family or font-size, are defined inside the
[vcsFont.scss](/src/styles/vcsFont.scss).

## Font size

The variabel `$vcs-font-size` is used to set the main font size inside all ui components.

The font size variabel `$vcs-font-size` is imported via [vcsFont.scss](/src/styles/vcsFont.scss) into the
[variables.scss](/src/styles/variables.scss)
to configure the global font size inside the `$font-size` and `$font-size-root` variable.

To access the font size setting inside a component individually it needs to be imported and used as shown:

### Example:

```html
<style lang="scss">
  @import '../src/styles/vcsFont.scss';

  label.v-label {
    font-size: $vcs-font-size;
  }
</style>
```
