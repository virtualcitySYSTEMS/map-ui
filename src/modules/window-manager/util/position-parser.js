const parsePosition = position => Object.keys(position).forEach((key) => {
  if (typeof position[key] === 'number') {
    position[key] = `${position[key]}px`;
  }
});
/**
 * @typedef Position
 * @property {string | 0} left Must be pixel-value string (e.g. '320px')
 * @property {string | 0} top Must be pixel-value string (e.g. '320px')
 * @property {string | 0} right Must be pixel-value string (e.g. '320px')
 * @property {string | 0} bottom Must be pixel-value string (e.g. '320px')
 */


/**
 * @class
 * @description
 * Class which parses css-friendly position values
 */
export default class PositionParser {
  /** @param {Position} position */
  constructor(position) {
    parsePosition(position);
    Object.assign(this, position);
  }

  left = 'unset';

  top = 'unset';

  right = 'unset';

  bottom = 'unset';

  get asNumber() {
    return {
      left: Number.isNaN(parseInt(this.left, 10)) ? 'unset' : parseInt(this.left, 10),
      top: Number.isNaN(parseInt(this.top, 10)) ? 'unset' : parseInt(this.top, 10),
      right: Number.isNaN(parseInt(this.right, 10)) ? 'unset' : parseInt(this.right, 10),
      bottom: Number.isNaN(parseInt(this.bottom, 10)) ? 'unset' : parseInt(this.bottom, 10),
    };
  }
}

