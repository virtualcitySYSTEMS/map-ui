import type { Ref } from 'vue';
import { isRef, ref, shallowRef } from 'vue';
import { v4 as uuidv4 } from 'uuid';

type NotificationOptions = {
  message: string;
  type: NotificationType;
  title?: string;
  timeout?: number;
};

type Notification = {
  id: string;
  message: string;
  type: NotificationType;
  title?: string;
  timeout: number;
  openRef: Ref<boolean>;
  open: boolean;
  close: () => void;
};

export enum NotificationType {
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
  SUCCESS = 'success',
}

function createNotification(
  options: NotificationOptions,
  notifier: Notifier,
): Notification {
  const { type, title, message, timeout } = options;
  const id = uuidv4();
  const open = ref(true);

  return {
    get id(): string {
      return id;
    },
    get type(): NotificationType {
      return type;
    },
    get title(): string | undefined {
      return title;
    },
    get message(): string {
      return message;
    },
    get timeout(): number {
      return timeout ?? 5000;
    },
    get open(): boolean {
      return open.value;
    },
    set open(value: boolean | Ref<boolean>) {
      open.value = isRef(value) ? value.value : value; // when used as a v-model, this is set as a boolean
      if (!open.value) {
        this.close();
      }
    },
    get openRef(): Ref<boolean> {
      return open;
    },
    close(): void {
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
  private _notifications = shallowRef<Array<Notification>>([]);

  get notifications(): Ref<Array<Notification>> {
    return this._notifications;
  }

  add(notification: NotificationOptions): Notification {
    const note = createNotification(notification, this);
    // use spread since push won't trigger updates
    this._notifications.value = [...this._notifications.value, note];
    return note;
  }

  remove(notification: Notification): void {
    // reassign to trigger update
    this._notifications.value = this._notifications.value.filter(
      (n) => n !== notification,
    );
  }

  has(notification: Notification): boolean {
    return this._notifications.value.includes(notification);
  }
}

export default Notifier;
