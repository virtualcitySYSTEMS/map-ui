<template>
  <v-sheet>
    <v-text-field v-model="message" label="Message" />
    <v-text-field v-model.number="timeout" label="Timeout" />
    <VcsCheckbox v-model="hasTimeout" label="Toggle Timeout" />
    <v-list>
      <v-list-item v-for="type in types" :key="type">
        {{ type }}
        <v-list-item-action @click="notify(type)">
          <v-icon>mdi-plus</v-icon>
        </v-list-item-action>
      </v-list-item>
    </v-list>
    <v-divider />
    <v-card>
      Current number of notifications: {{ notifications.length }}
    </v-card>
  </v-sheet>
</template>

<script>
  import {
    VSheet,
    VList,
    VListItem,
    VListItemAction,
    VTextField,
    VIcon,
    VCard,
    VDivider,
  } from 'vuetify/lib';
  import { NotificationType, VcsCheckbox } from '@vcmap/ui';
  import { computed, inject, ref } from 'vue';

  export default {
    name: 'NotifierTester',
    components: {
      VSheet,
      VList,
      VListItem,
      VListItemAction,
      VTextField,
      VIcon,
      VCard,
      VDivider,
      VcsCheckbox,
    },
    setup() {
      const app = inject('vcsApp');
      const message = ref('Message');
      const timeout = ref(5000);

      return {
        types: NotificationType,
        message,
        notify(type) {
          app.notifier.add({
            type,
            message: message.value,
            timeout: timeout.value,
          });
        },
        notifications: app.notifier.notifications,
        timeout,
        hasTimeout: computed({
          get() {
            return timeout.value === -1;
          },
          set(value) {
            if (value && timeout.value !== -1) {
              timeout.value = -1;
            } else if (timeout.value === -1) {
              timeout.value = 5000;
            }
          },
        }),
      };
    },
  };
</script>

<style scoped></style>
