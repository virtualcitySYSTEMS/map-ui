import { wgs84ToMercatorTransformer } from '@vcmap/core';
import {
  Icons,
  MarkdownBalloonFeatureInfoView,
  featureInfoViewSymbol,
} from '@vcmap/ui';
import { Feature } from 'ol';
import { getSize } from 'ol/extent';
import { Point } from 'ol/geom';
import { name } from '../package.json';

const berlinExtend = [13.301518, 52.445959, 13.489982, 52.527032];
const berlinSize = getSize(berlinExtend);

const featureInfo = new MarkdownBalloonFeatureInfoView({
  template: '# Search\n{{properties.title}}',
});

/**
 * @param {string} title
 * @returns {import("ol").Feature}
 */
function randomPOI(title) {
  const feature = new Feature({
    geometry: new Point(
      wgs84ToMercatorTransformer([
        berlinExtend[0] + Math.random() * berlinSize[0],
        berlinExtend[1] + Math.random() * berlinSize[1],
      ]),
    ),
    properties: {
      title,
    },
  });
  feature[featureInfoViewSymbol] = featureInfo;
  return feature;
}

function getRandomIcon() {
  const keys = Object.keys(Icons);
  const index = Math.floor(keys.length * Math.random());
  return `$${keys[index]}`;
}

/**
 * @param {string} line
 * @param {boolean} withIcon
 * @param {boolean} withPOI
 * @param {boolean} withActions
 * @returns {import("@vcmap/ui").ResultItem}
 */
function lineToResultItem(line, withIcon, withPOI, withActions) {
  let icon;
  if (withIcon) {
    icon = getRandomIcon();
  }

  let actions;
  if (withActions) {
    actions = [
      {
        name: 'action-1',
        icon,
        callback() {
          console.log('Action 1');
        },
      },
      {
        name: 'action-2',
        callback() {
          console.log('Action 2');
        },
      },
    ];
  }

  let clicked;
  let feature;
  if (withPOI) {
    feature = randomPOI(line);
  } else {
    clicked = async () => {
      console.log(line);
    };
  }

  return {
    title: line,
    icon,
    clicked,
    feature,
    actions,
  };
}

/**
 * @implements {import("@vcmap/ui").SearchImpl}
 */
export default class SearchImpl {
  /**
   * @param {string[]} lines
   * @param {boolean} withIcon
   * @param {boolean} withPOI
   * @param {boolean} withActions
   */
  constructor(lines, withIcon, withPOI, withActions) {
    this.name = name;
    this.lines = lines;
    this.withIcon = withIcon;
    this.withPOI = withPOI;
    this.withActions = withActions;
  }

  search(query) {
    return Promise.resolve(
      this.lines
        .filter((l) => l.toLowerCase().includes(query.toLowerCase()))
        .map((line) =>
          lineToResultItem(line, this.withIcon, this.withPOI, this.withActions),
        ),
    );
  }

  suggest(query) {
    const lowerQuery = query.toLowerCase();
    return Promise.resolve(
      this.lines.filter((l) => {
        const lowerLine = l.toLowerCase();
        return lowerLine !== lowerQuery && lowerLine.startsWith(lowerQuery);
      }),
    );
  }

  // eslint-disable-next-line class-methods-use-this
  abort() {}

  // eslint-disable-next-line class-methods-use-this
  destroy() {}
}
