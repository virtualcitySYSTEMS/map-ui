<template>
  <div>
    <v-textarea
      v-model="configString"
      v-if="!loading"
    />
    <v-progress-circular
      v-else
    />

    <VcsButton @click="replaceContext">
      Apply
    </VcsButton>
    <VcsButton @click="removeContext">
      Remove
    </VcsButton>
  </div>
</template>

<script>
  import { ref, inject } from 'vue';
  import { VcsButton } from '@vcmap/ui';
  import { Context } from '@vcmap/core';
  import { VProgressCircular, VTextarea } from 'vuetify/lib';

  const contextId = 'foo';

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
      const context = app.getContextById(contextId);
      const configString = ref(JSON.stringify(context ? context.config : {}, null, 2));
      const loading = ref(false);

      return {
        configString,
        loading,
        async replaceContext() {
          loading.value = true;
          const config = JSON.parse(configString.value);
          config.id = contextId;
          const newContext = new Context(config);
          await this.removeContext();
          await app.addContext(newContext);
          loading.value = false;
        },
        async removeContext() {
          if (app.getContextById(contextId)) {
            await app.removeContext(contextId);
          }
        },
      };
    },
  };
</script>

<style scoped>

</style>
