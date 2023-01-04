import { ref, shallowRef } from 'vue';
import { v4 as uuidv4 } from 'uuid';

/**
 * @typedef {Object} NotificationOptions
 * @property {string} message
 * @property {NotificationType} type
 * @property {string} [title]
 * @property {number} [timeout=5000]
 */

/**
 * @typedef {Object} Notification
 * @property {string} id
 * @property {string} message
 * @property {NotificationType} type
 * @property {string} [title]
 * @property {number} timeout
 * @property {import("vue").Ref<boolean>} open
 * @property {function():void} close
 */

/**
 * @enum {string}
 */
export const NotificationType = {
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
  SUCCESS: 'success',
};

/**
 * @param {NotificationOptions} options
 * @param {Notifier} notifier
 * @returns {Notification}
 */
function createNotification(options, notifier) {
  const {
    type,
    title,
    message,
    timeout,
  } = options;
  const id = uuidv4();
  const open = ref(true);

  return {
    get id() { return id; },
    get type() { return type; },
    get title() { return title; },
    get message() { return message; },
    get timeout() { return timeout ?? 5000; },
    get open() { return open; },
    set open(value) {
      open.value = value?.value ?? value; // when used as a v-model, this is set as a boolean
      if (!open.value) {
        this.close();
      }
    },
    close() {
      open.value = false;
      setTimeout(() => {
        notifier.remove(this);
      }, 100);
    },
  };
}

/**
 * API for adding snackbar notification to the VcsUiApp. This is simply a container and on its own will not render anything.
 * Typically, you do not need to instantiate this yourself, but use the notifier on the {@see VcsUiApp}.
 * @class
 */
class Notifier {
  constructor() {
    /**
     * @type {import("vue").Ref<Array<Notification>>}
     * @private
     */
    this._notifications = shallowRef([]);
  }

  /**
   * @type {import("vue").Ref<Array<Notification>>}
   * @readonly
   */
  get notifications() {
    return this._notifications;
  }

  /**
   * @param {NotificationOptions} notification
   * @returns {Notification}
   */
  add(notification) {
    const note = createNotification(notification, this);
    // use spread since push won't trigger updates
    this._notifications.value = [...this._notifications.value, note];
    return note;
  }

  /**
   * @param {Notification} notification
   */
  remove(notification) {
    // reassign to trigger update
    this._notifications.value = this._notifications.value.filter(n => n !== notification);
  }

  /**
   * @param {Notification} notification
   * @returns {boolean}
   */
  has(notification) {
    return this._notifications.value.includes(notification);
  }
}

export default Notifier;
