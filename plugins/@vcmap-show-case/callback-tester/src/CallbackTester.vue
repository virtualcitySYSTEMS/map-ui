<template>
  <div class="pa-1">
    <VcsTextArea
      class="pb-1"
      placeholder=" JSON callback"
      v-model="callback"
      :rules="[(v) => isJSONValid(v) || 'Invalid JSON input']"
    />
    <v-row no-gutters class="d-flex justify-end pt-1 pr-1">
      <VcsFormButton variant="filled" @click="call"> Execute </VcsFormButton>
    </v-row>
  </div>
</template>

<script>
  import { inject, ref } from 'vue';
  import { VRow } from 'vuetify/components';
  import { NotificationType, VcsFormButton, VcsTextArea } from '@vcmap/ui';

  export default {
    name: 'CallbackTester',
    components: { VRow, VcsFormButton, VcsTextArea },
    setup() {
      /** @type {import("../../../../src/vcsUiApp.js").default}  */
      const app = inject('vcsApp');
      const callback = ref();

      return {
        callback,
        isJSONValid(str) {
          try {
            JSON.parse(str);
          } catch (e) {
            return false;
          }
          return true;
        },
        call() {
          try {
            const createdCallback =
              app.callbackClassRegistry.createFromTypeOptions(
                { ...JSON.parse(callback.value) },
                app,
              );
            createdCallback.callback();
            app.notifier.add({
              type: NotificationType.SUCCESS,
              message: `Callback succesfully executed!`,
            });
          } catch (error) {
            app.notifier.add({
              type: NotificationType.ERROR,
              message: `An error occured when calling the callback: ${error.message}`,
            });
          }
        },
      };
    },
  };
</script>

<style lang="scss" scoped></style>
