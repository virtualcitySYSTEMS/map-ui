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
        <VcsTooltip
          v-if="module.description && toggleable"
          :tooltip="module.description"
        >
          <template #activator="{ on, attrs }">
            <v-icon
              right
              v-bind="{ ...$attrs, ...attrs }"
              v-on="{ ...$listeners, ...on }"
            >
              mdi-help-circle
            </v-icon>
          </template>
        </VcsTooltip>
      </v-chip>
    </v-list>
  </v-container>
</template>

<script>
  import { VcsTooltip } from '@vcmap/ui';
  import { VChip, VContainer, VIcon, VList } from 'vuetify/lib';

  export default {
    name: 'ModulesListComponent',
    components: {
      VcsTooltip,
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
