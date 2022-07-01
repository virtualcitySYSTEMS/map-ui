import { AbstractInteraction, EventType, ModificationKeyType, PointerKeyType } from '@vcmap/core';

/**
 * Class to call a callback on right click and a callback on any other click
 * @class
 * @extends {AbstractInteraction}
 */
class ContextMenuInteraction extends AbstractInteraction {
  /**
   * @param {function(import("@vcmap/core").InteractionEvent):Promise<void>} rightClick - the right click callback, called on right click only
   * @param {function(import("@vcmap/core").InteractionEvent):Promise<void>} clear - the clear callback
   */
  constructor(rightClick, clear) {
    super(EventType.CLICK, ModificationKeyType.ALL, PointerKeyType.ALL);
    /**
     * @type {function(import("@vcmap/core").InteractionEvent): Promise<void>}
     * @private
     */
    this._clear = clear;
    /**
     * @type {function(import("@vcmap/core").InteractionEvent): Promise<void>}
     * @private
     */
    this._rightClick = rightClick;
  }

  /**
   * @inheritDoc
   * @param {import("@vcmap/core").InteractionEvent} event
   * @returns {Promise<import("@vcmap/core").InteractionEvent>}
   */
  async pipe(event) {
    if (event.pointer & PointerKeyType.RIGHT) {
      await this._rightClick(event);
    } else {
      await this._clear(event);
    }
    return event;
  }
}

export default ContextMenuInteraction;
