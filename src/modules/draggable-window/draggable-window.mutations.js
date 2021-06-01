import { draggableWindowHighestIndex } from './constants';

export const checkIfViewRegistered = (view, viewId) => {
  if (!view) {
    throw new Error(
      `DraggableWindow with id '${viewId}' has not been registered!`,
    );
  }
};

export const toggleViewVisible = (state, viewId) => {
  const view = state.draggableWindows[viewId];

  checkIfViewRegistered(view, viewId);

  state.draggableWindows[viewId].visible = !state.draggableWindows[viewId]
    .visible;
  // When it is visible, bring it to top, otherwise send it to back.
  if (state.draggableWindows[viewId].visible) {
    state.draggableWindows[viewId] = {
      ...state.draggableWindows[viewId],
      zIndex: draggableWindowHighestIndex,
    };
  } else {
    state.draggableWindows[viewId] = {
      ...state.draggableWindows[viewId],
      zIndex:
        draggableWindowHighestIndex -
        Object.keys(state.draggableWindows).length + 1,
    };
  }
};

export const bringViewToTop = (state, viewId) => {
  const { draggableWindows } = state;
  const view = draggableWindows[viewId];

  checkIfViewRegistered(view, viewId);

  if (view.zIndex === draggableWindowHighestIndex) {
    return;
  }

  // Bring to top.
  draggableWindows[viewId] = {
    ...view,
    zIndex: draggableWindowHighestIndex,
  };

  // Set other windows to back by one each.
  Object.keys(draggableWindows)
    .sort((keyA, keyB) => draggableWindows[keyB].zIndex - draggableWindows[keyA].zIndex)
    .filter((id) => { return id !== viewId; })
    .forEach((id, i) => {
      const zIndex = draggableWindowHighestIndex - (i + 1);
      draggableWindows[id] = {
        ...draggableWindows[id],
        zIndex,
      };
    });
};

export const addWindow = (state, draggableWindow) => {
  const { id, ...props } = draggableWindow;

  if (!id) {
    throw new Error(`A draggable window must have an id, got: ${id}`);
  }

  if (state.draggableWindows[id]) {
    throw new Error(`A draggable window with id ${id} already exists`);
  }

  state.draggableWindows[id] = {
    id,
    ...props,
    zIndex:
      props.zIndex ||
      draggableWindowHighestIndex -
        Object.keys(state.draggableWindows).length,
  };
};
