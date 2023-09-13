<template>
  <v-container class="py-0 px-1">
    <VcsTextArea v-model="configString" v-if="!loading" />
    <v-progress-circular v-else />

    <div class="d-flex gap-2 px-1 pt-2 pb-1 justify-end">
      <VcsFormButton variant="filled" @click="replaceModule">
        Apply
      </VcsFormButton>
      <VcsFormButton @click="removeModule"> Remove </VcsFormButton>
    </div>
  </v-container>
</template>

<script>
  import { ref, inject } from 'vue';
  import { VcsTextArea, VcsFormButton } from '@vcmap/ui';
  import { VcsModule } from '@vcmap/core';
  import { VContainer, VProgressCircular } from 'vuetify/lib';

  const moduleId = 'foo';

  export default {
    name: 'ConfigEditor',
    components: {
      VcsFormButton,
      VcsTextArea,
      VContainer,
      VProgressCircular,
    },
    setup() {
      /** @type {VcsUiApp} */
      const app = inject('vcsApp');
      const module = app.getModuleById(moduleId);
      const configString = ref(
        JSON.stringify(module ? module.config : {}, null, 2),
      );
      const loading = ref(false);

      return {
        configString,
        loading,
        async replaceModule() {
          loading.value = true;
          const config = JSON.parse(configString.value);
          config.id = moduleId;
          const newModule = new VcsModule(config);
          await this.removeModule();
          await app.addModule(newModule);
          loading.value = false;
        },
        async removeModule() {
          if (app.getModuleById(moduleId)) {
            await app.removeModule(moduleId);
          }
        },
      };
    },
  };
</script>

<style scoped></style>
