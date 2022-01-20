<template>
  <div>
    <v-textarea
      v-model="configString"
      v-if="!loading"
    />
    <v-progress-circular
      v-else
    />

    <Button @click="replaceContext">
      Apply
    </Button>
    <Button @click="removeContext">
      Remove
    </Button>
  </div>
</template>

<script>
  import { ref, inject } from '@vue/composition-api';
  import Context from '../../src/context.js';

  const contextId = 'foo';

  export default {
    name: 'Editor',
    setup() {
      /** @type {VcsApp} */
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
