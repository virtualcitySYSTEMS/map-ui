<template>
  <v-sheet
    elevation="4"
    class="save-tooltip rounded pa-2"
    :style="{ width: width ? `${width}px` : undefined }"
  >
    <v-text-field v-model="value" class="mt-0 mb-1" hide-details dense>
      <template slot="append-outer">
        <v-icon
          @click="$emit('input', value)"
          v-text="'$vcsReturn'"
          size="16"
        />
      </template>
    </v-text-field>
  </v-sheet>
</template>


<style lang="scss">
  .v-input .v-input__append-outer{
    align-self: flex-end;
  }
</style>

<script>
  import Vue from 'vue';

  export default Vue.extend({
    props: {
      value: {
        type: String,
        default: undefined,
      },
      width: {
        type: Number,
        default: 208,
      },
    },
  });
</script>
