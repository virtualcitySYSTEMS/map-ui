<template>
  <v-container class="pa-0">
    <v-list
      color="rgba(0,0,0,0)"
    >
      <v-chip
        v-for="(context, index) in contexts"
        :key="index"
        class="mx-1"
        :color="context.active ? 'primary' : undefined"
        :disabled="!toggleable"
        @click="toggle(context)"
      >
        {{ context.name || context.configUrl }}
        <VcsTooltip
          v-if="context.description"
          :tooltip="context.description"
        >
          <template #activator="{ on, attrs }">
            <v-icon
              right
              v-bind="{...$attrs, ...attrs}"
              v-on="{...$listeners, ...on}"
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
  import { VcsTooltip } from '@vcsuite/ui-components';

  export default {
    name: 'ContextsListComponent',
    components: { VcsTooltip },
    props: {
      contexts: {
        type: Array,
        required: true,
      },
      toggleable: {
        type: Boolean,
        default: true,
      },
    },
    methods: {
      toggle(context) {
        if (this.toggleable) {
          this.$emit('toggle-context', context);
        }
      },
    },
  };
</script>

<style scoped>

</style>
