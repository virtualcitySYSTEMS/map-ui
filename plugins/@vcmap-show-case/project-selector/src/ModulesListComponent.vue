<template>
  <v-container class="pa-0">
    <v-list color="rgba(0,0,0,0)">
      <v-chip
        v-for="(module, index) in modules"
        :key="index"
        class="mx-1"
        :color="module.active ? 'primary' : undefined"
        :disabled="!toggleable"
        @click="toggle(module)"
      >
        {{ module.name || module.configUrl }}
        <v-icon
          v-if="module.description && toggleable"
          right
          v-bind="{ ...$attrs, ...$props }"
        >
          mdi-help-circle
        </v-icon>
        <v-tooltip
          v-if="module.description && toggleable"
          :text="module.description"
          activator="parent"
        />
      </v-chip>
    </v-list>
  </v-container>
</template>

<script>
  import {
    VChip,
    VContainer,
    VIcon,
    VList,
    VTooltip,
  } from 'vuetify/components';

  export default {
    name: 'ModulesListComponent',
    components: {
      VTooltip,
      VContainer,
      VList,
      VChip,
      VIcon,
    },
    props: {
      modules: {
        type: Array,
        required: true,
      },
      toggleable: {
        type: Boolean,
        default: true,
      },
    },
    methods: {
      toggle(module) {
        if (this.toggleable) {
          this.$emit('toggle-module', module);
        }
      },
    },
  };
</script>

<style scoped></style>
