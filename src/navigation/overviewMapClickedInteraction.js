import {
  VcsEvent,
  EventType,
  ModificationKeyType,
  AbstractInteraction,
} from '@vcmap/core';

/**
 * @class
 * @extends {import("@vcmap/core").AbstractInteraction}
 */
class OverviewMapClickedInteraction extends AbstractInteraction {
  constructor() {
    super(EventType.CLICK, ModificationKeyType.ALL);

    /**
     * @type {import("@vcmap/core").VcsEvent<import("@vcmap/core").InteractionEvent>}
     */
    this.mapClicked = new VcsEvent();
    this.setActive();
  }

  /**
   * @inheritDoc
   * @param {import("@vcmap/core").InteractionEvent} event
   * @returns {Promise<import("@vcmap/core").InteractionEvent>}
   */
  async pipe(event) {
    this.mapClicked.raiseEvent(event);
    event.stopPropagation = true;
    return event;
  }

  /**
   * @inheritDoc
   */
  destroy() {
    this.mapClicked.destroy();
    super.destroy();
  }
}

export default OverviewMapClickedInteraction;
