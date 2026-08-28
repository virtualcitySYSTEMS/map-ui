import type { InteractionEvent } from '@vcmap/core';
import { AbstractInteraction, EventType } from '@vcmap/core';
import { parseBoolean } from '@vcsuite/parsers';
import { check } from '@vcsuite/check';
import type { Ref } from 'vue';
import type { Coordinate } from 'ol/coordinate.js';

type PositionDisplayInteractionOptions = {
  position: Ref<Coordinate>;
  /** whether to be active on move or not */
  move?: boolean;
};

function getEventType(move: boolean): EventType {
  return move ? EventType.CLICK | EventType.MOVE : EventType.CLICK;
}

class PositionDisplayInteraction extends AbstractInteraction {
  position: Ref<Coordinate>;
  private _move: boolean;
  constructor(options: PositionDisplayInteractionOptions) {
    const move = parseBoolean(options.move, false);
    super(getEventType(move));
    this.position = options.position;
    this._move = move;

    this.setActive();
  }

  get move(): boolean {
    return this._move;
  }

  setMove(move: boolean): void {
    check(move, Boolean);
    this._move = move;
    this.setActive(getEventType(move));
  }

  pipe(event: InteractionEvent): Promise<InteractionEvent> {
    if (event.position && !event.position.every((pos) => pos === 0)) {
      this.position.value = [...event.position];
    }
    return Promise.resolve(event);
  }
}

export default PositionDisplayInteraction;
