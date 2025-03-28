<template>
  <div class="notifier-component">
    <v-snackbar
      v-for="notification in notifications"
      :key="notification.id"
      :data-notification-id="notification.id"
      v-model="notification.open"
      :timeout="notification.timeout"
      class="vcs-notifier"
    >
      <v-icon :color="notification.type">
        {{ icon[notification.type] }}
      </v-icon>
      <span class="snack-title">{{
        $st(notification.title || defaultTitle[notification.type])
      }}</span>
      <template #actions="{ props }">
        <VcsButton
          icon="mdi-close"
          v-bind="props"
          @click="notification.open = false"
        />
      </template>
      <span>{{ $st(notification.message) }}</span>
    </v-snackbar>
  </div>
</template>

<script>
  import { VSnackbar, VIcon } from 'vuetify/components';
  import { inject } from 'vue';
  import VcsButton from '../components/buttons/VcsButton.vue';
  import { NotificationType } from './notifier.js';

  /**
   * @description Renders notifications of different types
   */
  export default {
    name: 'NotifierComponent',
    components: {
      VSnackbar,
      VcsButton,
      VIcon,
    },
    setup() {
      const app = inject('vcsApp');

      return {
        notifications: app.notifier.notifications,
        icon: {
          [NotificationType.ERROR]: 'mdi-alert-box',
          [NotificationType.WARNING]: 'mdi-alert',
          [NotificationType.INFO]: 'mdi-information',
          [NotificationType.SUCCESS]: 'mdi-check-circle',
        },
        defaultTitle: {
          [NotificationType.ERROR]: 'notification.error',
          [NotificationType.WARNING]: 'notification.warning',
          [NotificationType.INFO]: 'notification.information',
          [NotificationType.SUCCESS]: 'notification.success',
        },
      };
    },
  };
</script>

<style lang="scss" scoped>
  .vcs-notifier {
    opacity: 0.95;
  }
  :deep(.v-snackbar__content) {
    display: grid;
    padding: 8px 8px;
    gap: 8px 4px;
    grid-template-columns: 20px auto;
    .v-icon {
      grid-row-start: 1;
      grid-row-end: 3;
      align-self: start;
      font-size: var(--v-vcs-font-size);
    }
  }
  :deep(.v-snackbar__actions) {
    align-self: flex-start;
    margin-top: 4px;
  }
</style>
