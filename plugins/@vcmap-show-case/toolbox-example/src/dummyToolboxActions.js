import { reactive } from 'vue';
import TriStateExampleWindow from './TriStateExampleWindow.vue';

export const dummyToolboxAction = {
  active: false,
  currentIndex: 0,
  _stop() {
    console.log('stopping session', this._session);
    this._session = null;
    this.active = false;
  },
  _start() {
    const startSession = (tool) => ({ type: tool });
    this._session = startSession(this.tools[this.currentIndex].name);
    this.active = true;
    console.log('starting session', this._session);
  },
  callback() {
    if (this.active) {
      this._stop();
    } else {
      this._start();
    }
  },
  selected(index) {
    this.currentIndex = index;
    if (this.active) {
      this._session.type = this.tools[this.currentIndex].name;
      console.log('updating active session', this._session);
    } else {
      this._start();
    }
  },
};

/**
 *
 * @param {import("@vcmap/ui").VcsUiApp} app
 * @returns {{action:import("vue").Reactive<import("@vcmap/ui").VcsAction>, destroy: ()=>void}}
 */
export function createDummyTriStateAction(app) {
  const windowComponent = {
    id: 'tri-state-example',
    state: {
      headerTitle: 'Example Session Toggle',
    },
    component: TriStateExampleWindow,
  };

  const action = reactive({
    name: 'tri-state-action',
    title: 'tristate',
    icon: 'mdi-state-machine',
    active: false,
    background: false,
    callback() {
      if (this.active) {
        if (this.background) {
          return app.windowManager.add(windowComponent, '@vcmap/test');
        } else {
          app.windowManager.remove(windowComponent.id);
          this.active = false;
        }
      } else {
        this.active = true;
        return app.windowManager.add(windowComponent, '@vcmap/test');
      }
      return null;
    },
  });

  const listeners = [
    app.windowManager.added.addEventListener(({ id }) => {
      if (id === windowComponent.id) {
        action.active = true;
        action.background = false;
      }
    }),
    app.windowManager.removed.addEventListener(({ id }) => {
      if (id === windowComponent.id) {
        action.background = true;
      }
    }),
  ];

  const destroy = () => {
    if (app.windowManager.has(windowComponent.id)) {
      app.windowManager.remove(windowComponent.id);
    }
    listeners.forEach((cb) => cb());
  };

  return { action, destroy };
}
