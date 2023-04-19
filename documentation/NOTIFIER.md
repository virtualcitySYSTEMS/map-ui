# Notifier

The `Notifier` is a message conduit on the `VcsUiApp` which allows you to
post messages into the snackbar at the bottom. In general, it is better to attach
messages to a context (input validation failure etc.). But for async or background
processes this may not always be possible. In theses cases, you can use the `Notifier`
to inform the user.

There are four types of `Notifications`:

- ERROR: an unrecoverable error occurred.
- WARNING: a recoverable error occurred (a missing value was assumed to be a
  default or an action was canceled by the user etc.)
- INFO: a status update message (async processing step was increased, for instance
  when submitting a form to the server to start processing).
- SUCCESS: a final status update, concluding the end of an async process (server
  processing has finished successfully).

To submit a `Notification`, you can call `vcsApp.notifier.add`. This will create a
`Notification` from your passed options

```javascript
import { NotificationType } from '@vcmap/ui';

const app = vcs.apps.values().next().value;
app.notifier.add({
  type: NotificationType.SUCCESS,
  message: 'Success!',
});
```

The display notification has a colored icon to indicate the status, as
well as a default title. You can pass your own title instead. Furthermore,
Notification have a default timeout of 5000ms after which they
will disappear. You can pass a custom timeout (or -1 to never timeout)
or even close the notification yourself. You can also _react_ to a closed notification.

```javascript
import { NotificationType } from '@vcmap/ui';
import { watch } from 'vue';

const app = vcs.apps.values().next().value;
const notification = app.notifier.add({
  type: NotificationType.ERROR,
  message: 'SPAM',
  timeout: -1,
});

const watcher = watch(notification, () => {
  watcher();
  app.notifier.add({
    type: NotificationType.ERROR,
    message: 'SPAM AGAIN',
    timeout: -1,
  });
});

setTimeout(() => {
  notification.close();
}, 10000);
```
