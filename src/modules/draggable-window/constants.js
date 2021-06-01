import DraggableWindowId from './draggable-window-id';

export const draggableWindowHighestIndex = 50;

export const initialDraggableWindows = {
  [DraggableWindowId.LayerTree]: {
    visible: true,
    zIndex: draggableWindowHighestIndex,
    id: DraggableWindowId.LayerTree,
  },
};
