import { AbstractInteraction, EventType } from '@vcmap/core';

export default class EventLogger extends AbstractInteraction {
  constructor() {
    super();

    this.setActive(false);
  }

  pipe(event) {
    console.log(event);
    this.lastEvent = event;
    return Promise.resolve(event);
  }

  off() {
    this.setActive(false);
  }

  click() {
    this.setActive(EventType.CLICK);
  }

  clickMove() {
    this.setActive(EventType.CLICKMOVE);
  }

  drag() {
    this.setActive(EventType.DRAGEVENTS);
  }

  all() {
    this.setActive(EventType.ALL);
  }
}
