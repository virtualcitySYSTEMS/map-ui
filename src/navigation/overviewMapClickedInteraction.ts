import type { InteractionEvent } from '@vcmap/core';
import {
  VcsEvent,
  EventType,
  ModificationKeyType,
  AbstractInteraction,
} from '@vcmap/core';

class OverviewMapClickedInteraction extends AbstractInteraction {
  mapClicked = new VcsEvent<InteractionEvent>();
  constructor() {
    super(EventType.CLICK, ModificationKeyType.ALL);
    this.setActive();
  }

  pipe(event: InteractionEvent): Promise<InteractionEvent> {
    this.mapClicked.raiseEvent(event);
    event.stopPropagation = true;
    return Promise.resolve(event);
  }

  destroy(): void {
    this.mapClicked.destroy();
    super.destroy();
  }
}

export default OverviewMapClickedInteraction;
