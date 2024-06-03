<template>
  <div>
    <v-snackbar
      v-for="notification in notifications"
      :key="notification.id"
      v-model="notification.open"
      :timeout="notification.timeout"
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
    components: {
      VSnackbar,
      VcsButton,
      VIcon,
    },
    name: 'NotifierComponent',
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
  .v-snack {
    :deep(.v-snack__content) {
      display: grid;
      gap: 8px 4px;
      grid-template-columns: 20px auto;
      .v-icon {
        grid-row-start: 1;
        grid-row-end: 3;
        align-self: start;
        font-size: 17px;
      }
    }
    :deep(.v-snack__action) {
      align-self: flex-start;
      margin-top: 4px;
    }
  }
</style>
