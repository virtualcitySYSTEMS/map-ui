<template>
  <v-sheet class="pa-1">
    <VcsTextField class="py-2" v-model="message" label="Message" />
    <VcsTextField class="py-2" v-model.number="timeout" label="Timeout" />
    <VcsCheckbox v-model="hasTimeout" label="Toggle Timeout" />
    <v-list>
      <v-list-item v-for="type in types" :key="type">
        {{ type }}
        <template #append>
          <v-icon @click="notify(type)">mdi-plus</v-icon>
        </template>
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
    VIcon,
    VCard,
    VDivider,
  } from 'vuetify/components';
  import { NotificationType, VcsCheckbox, VcsTextField } from '@vcmap/ui';
  import { computed, inject, ref } from 'vue';

  export default {
    name: 'NotifierTester',
    components: {
      VSheet,
      VList,
      VListItem,
      VIcon,
      VCard,
      VDivider,
      VcsCheckbox,
      VcsTextField,
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
