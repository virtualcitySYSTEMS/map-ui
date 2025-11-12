# Custom icons

Besides the mdi icons and the vcs icons, it is possible to use custom icons for actions, buttons and everywhere a Vuetify `<VIcon>` element is used.
These custom icons can either be rendered as an img or svg element.
In order to determine how the icon should be rendered, a prefix is necessary.
The syntax for any custom icon is `prefix:image` where image can be a string representing a path or the icon data itself, depending on the prefix.
The following three prefixes are supported:

- [imageUrl](#imageurl)
- [svgString](#svgstring)
- [svgPathData](#svgpathdata)

## imageUrl

The **imageUrl** prefix allows to render an html `<img>` tag as an icon.
Therefore it supports everything the img tag supports.

Here are some examples:

```js
const urlIcon = 'imageUrl:path/to/icon.png';
const base64Icon = 'imageUrl:data:image/png...';

const vcsAction = {
  name: 'customImageExample',
  icon: urlIcon,
  callback() {},
};
```

> Please note that images can not react to theme (dark/light) changes.
> Use custom svg icons if this is a requirement.

## svgString

The **svgString** prefix allows to render the content of a SVG file.
The file needs to be imported first or hardcoded to a variable in the code as string.
When using svg icons, make sure you assign `currentColor` to the `fill` or `stroke`
attributes of the svg elements you want to be colored according to the current text color.

Here are some examples:

```js
const svgFileIcon =
  'svgString:<svg width="200px" height="200px" viewBox="0 0 480 480" [...] </svg>';
let importedIcon;

try {
  const response = fetch('path/to/file.svg');
  importedIcon = `svgString:${response.text()}`;
} catch (e) {
  // handle error
}

const vcsAction = {
  name: 'customSvgExample',
  icon: importedIcon ?? svgFileIcon,
  callback() {},
};
```

## svgPathData

The **svgPathData** prefix allows to render the content of a `d` attribute which is part of a SVG `<path>` element.
Compared to the svgString prefix, it is a bit more lightweight, especially if you want to have the icon hardcoded in the code.

Here is an example:

```js
const pathIcon =
  'svgPathData:M2.4 7.2a4.8 4.8 0 0 1 9.6 0 4.8 4.8 0 0 1 9.6 0q0 7.2 -9.6 14.4 -9.6 -7.2 -9.6 -14.4z';

const vcsAction = {
  name: 'customSvgPathData',
  icon: pathIcon,
  callback() {},
};
```

> Please note that the path is placed in an SVG Element with a `viewBox="0 0 24 24"`.
> Therefore the path coordinates might need to be adjusted accordingly.
