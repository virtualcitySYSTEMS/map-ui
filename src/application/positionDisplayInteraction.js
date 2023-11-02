import { AbstractInteraction, EventType } from '@vcmap/core';
import { parseBoolean } from '@vcsuite/parsers';
import { check } from '@vcsuite/check';

/**
 * @typedef {Object} PositionDisplayInteractionOptions
 * @property {import("vue").Ref<import("ol").Coordinate>} position
 * @property {?boolean} move - whether to be active on move or not
 */

/**
 * @class
 * @extends {import("@vcmap/core").AbstractInteraction}
 */
class PositionDisplayInteraction extends AbstractInteraction {
  /**
   * @param {PositionDisplayInteractionOptions} options
   */
  constructor(options) {
    super();
    /**
     * @type {import("vue").Ref<import("ol").Coordinate>}
     */
    this.position = options.position;
    /**
     * @type {boolean}
     */
    this._move = parseBoolean(options.move, false);

    this._defaultActive = this._move
      ? EventType.CLICK | EventType.MOVE
      : EventType.CLICK;
    this.setActive();
  }

  get move() {
    return this._move;
  }

  /**
   * @param {boolean} move
   */
  setMove(move) {
    check(move, Boolean);

    this._move = move;
    this._defaultActive = this._move
      ? EventType.CLICK | EventType.MOVE
      : EventType.CLICK;
    this.setActive();
  }

  pipe(event) {
    if (!event.position.every((pos) => pos === 0)) {
      this.position.value = [...event.position];
    }
    return Promise.resolve(event);
  }
}

export default PositionDisplayInteraction;
