import DraggableWindowId from './draggable-window-id';

export const draggableWindowHighestIndex = 50;

export const initialDraggableWindows = {
  [DraggableWindowId.LayerTree]: {
    visible: true,
    zIndex: 50,
    id: DraggableWindowId.LayerTree,
  },
};

// eslint-disable-next-line import/prefer-default-export
export const draggableWindowState = {
  draggableWindows: initialDraggableWindows,
  draggableWindowHighestIndex,
};
