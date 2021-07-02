<template>
  <v-sheet elevation="2" class="vcs-legend rounded">
    <div class="d-flex flex-row justify-space-between align-center pa-2">
      <h1 class="text--primary user-select-none">
        Texturierung
      </h1>

      <v-icon @click="close()" size="16" v-text="'mdi-close-thick'" />
    </div>

    <hr>
    <div class="pa-2">
      <i>Texturierungstyp wählen</i>
      <v-select
        hide-details
        class="tiny my-2"
        name=""
        id=""
        :items="['foo']"
        v-model="value"
        outlined
        dense
      />

      <span>Höhe in Metern</span>
      <div class="d-flex flex-row align-center my-2" v-for="height of heights" :key="height.name">
        <span
          :style="{
            backgroundColor: height.color
          }"
          class="rounded d-inline-block h-6 w-12 mr-4"
        />
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
  import { getRootCssValue } from './util';

  export default defineComponent({
    setup(props, vueContext) {
      const value = ref();
      const close = (val) => {
        vueContext.emit('input', val);
      };
      return {
        heights: [
          { name: '< 5m', color: getRootCssValue('--v-primary-lighten4'), value: undefined },
          { name: '< 15m', color: getRootCssValue('--v-primary-lighten3'), value: undefined },
          { name: '< 30m', color: getRootCssValue('--v-primary-lighten2'), value: undefined },
          { name: '< 65m', color: getRootCssValue('--v-primary-lighten1'), value: undefined },
          { name: '> 65m', color: getRootCssValue('--v-primary-base'), value: undefined },
        ],
        close,
        value,
      };
    },
  });
</script>
