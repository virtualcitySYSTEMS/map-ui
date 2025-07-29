import { AbstractInteraction, EventType, VcsEvent } from '@vcmap/core';

export default class ShowClickInteraction extends AbstractInteraction {
  constructor() {
    super(EventType.CLICK);

    this.clicked = new VcsEvent();
  }

  pipe(event) {
    if (
      event.map.className === 'PanoramaMap' &&
      !event.map.getCesiumWidget().scene.screenSpaceCameraController
        .enableInputs
    ) {
      this.clicked.raiseEvent(event);
    }
    return Promise.resolve(event);
  }
}
