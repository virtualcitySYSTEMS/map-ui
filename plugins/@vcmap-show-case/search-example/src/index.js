import { name, version, mapVersion } from '../package.json';
import SearchImpl from './searchImpl.js';

const defaultLines = [
  'Dragonfruit',
  'Cherry',
  'Peach',
  'Banana',
  'Grape',
  'Fig',
  'Kiwi',
  'Watermelon',
  'Mango',
  'Strawberry',
  'Apple',
  'Raspberry',
  'Honeydew',
  'Lemon',
  'Cantaloupe',
  'Orange',
  'Papaya',
  'Date',
  'Blackberry',
  'Grapefruit',
  'Nectarine',
  'Apricot',
  'Blueberry',
  'Clementine',
  'Elderberry',
  'Gooseberry',
  'Pineapple',
  'Plum',
  'Lime',
  'Pomegranate',
  'Quince',
  'Tangerine',
  'Mulberry',
  'Lychee',
  'Passionfruit',
  'Kumquat',
  'Cranberry',
  'Jackfruit',
  'Olive',
  'Ugli fruit',
];

export default function searchExample(config) {
  let impl;

  return {
    get name() {
      return name;
    },
    get version() {
      return version;
    },
    get mapVersion() {
      return mapVersion;
    },
    /**
     * @param {import("@vcmap/ui").VcsUiApp} app
     */
    initialize(app) {
      impl = new SearchImpl(
        config.lines ?? defaultLines,
        config.withIcon ?? true,
        config.withPOI ?? true,
      );
      app.search.add(impl, name);
    },
    destroy() {
      impl?.destroy();
    },
  };
}
