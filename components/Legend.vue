<template>
  <v-sheet elevation="2" class="vcs-legend rounded">
    <div class="d-flex flex-row justify-space-between align-center pa-2">
      <h1 class="text--primary">
        Texturierung
      </h1>

      <v-icon @click="close()" size="16" v-text="'mdi-close-thick'" />
    </div>

    <hr>
    <div class="pa-2">
      <i>Texturierungstyp wählen</i>
      <v-select
        hide-details
        class="tiny"
        name=""
        id=""
        :items="['foo']"
        v-model="value"
        outlined
        dense
      />

      <span>Höhe in Metern</span>
      <div v-for="height of heights" :key="height.name">
        <span />
        <span>{{ height.name }}</span>
      </div>
    </div>
  </v-sheet>
</template>


<style lang="scss">
  .vcs-legend {
    max-width: 240px;
    min-width: 240px;
    width: 240px;
  }
</style>

<script>
  import { defineComponent, ref } from '@vue/composition-api';

  export default defineComponent({
    setup(props, vueContext) {
      const value = ref();
      const close = (val) => {
        vueContext.emit('input', val);
      };
      return {
        heights: [
          { name: '< 5m', value: undefined },
          { name: '< 15m', value: undefined },
          { name: '< 30m', value: undefined },
          { name: '< 65m', value: undefined },
          { name: '> 65m', value: undefined },
        ],
        close,
        value,
      };
    },
  });
</script>
