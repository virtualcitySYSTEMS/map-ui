<template>
  <div>
    <v-textarea
      v-model="configString"
      v-if="!loading"
    />
    <v-progress-circular
      v-else
    />

    <VcsButton @click="replaceModule">
      Apply
    </VcsButton>
    <VcsButton @click="removeModule">
      Remove
    </VcsButton>
  </div>
</template>

<script>
  import { ref, inject } from 'vue';
  import { VcsButton } from '@vcmap/ui';
  import { VcsModule } from '@vcmap/core';
  import { VProgressCircular, VTextarea } from 'vuetify/lib';

  const moduleId = 'foo';

  export default {
    name: 'Editor',
    components: {
      VcsButton,
      VTextarea,
      VProgressCircular,
    },
    setup() {
      /** @type {VcsUiApp} */
      const app = inject('vcsApp');
      const module = app.getModuleById(moduleId);
      const configString = ref(JSON.stringify(module ? module.config : {}, null, 2));
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

<style scoped>

</style>
