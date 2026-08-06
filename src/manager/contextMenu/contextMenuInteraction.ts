import type { InteractionEvent } from '@vcmap/core';
import {
  AbstractInteraction,
  EventType,
  ModificationKeyType,
  PointerKeyType,
} from '@vcmap/core';

/**
 * Class to call a callback on right click and a callback on any other click
 */
class ContextMenuInteraction extends AbstractInteraction {
  private _rightClick: (event: InteractionEvent) => Promise<void>;
  private _clear: (event: InteractionEvent) => Promise<void>;

  /**
   * @param rightClick - the right click callback, called on right click only
   * @param clear - the clear callback
   */
  constructor(
    rightClick: (event: InteractionEvent) => Promise<void>,
    clear: (event: InteractionEvent) => Promise<void>,
  ) {
    super(EventType.CLICK, ModificationKeyType.ALL, PointerKeyType.ALL);
    this._clear = clear;
    this._rightClick = rightClick;
  }

  async pipe(event: InteractionEvent): Promise<InteractionEvent> {
    if (event.pointer & PointerKeyType.RIGHT) {
      await this._rightClick(event);
    } else {
      await this._clear(event);
    }
    return event;
  }
}

export default ContextMenuInteraction;
