<template>
  <v-sheet class="overflow-auto icons-window">
    <vcs-list :items="icons" :searchable="true" :show-title="false" />
  </v-sheet>
</template>

<script>
  import { Icons, VcsList } from '@vcmap/ui';
  import { VSheet } from 'vuetify/lib';
  import { computed } from 'vue';

  export default {
    name: 'AllIconsComponent',
    components: {
      VcsList,
      VSheet,
    },
    setup() {
      const createListItem = (icon) => {
        const key = `$${icon}`;
        return {
          name: key,
          title: key,
          icon: key,
          actions: [
            {
              name: 'copy-icon-to-clipboard',
              icon: 'mdi-content-copy',
              title: `Copy ${key}`,
              callback: async () => {
                await navigator.clipboard.writeText(key);
              },
            },
          ],
        };
      };

      return {
        icons: computed(() =>
          Object.keys(Icons).map((icon) => createListItem(icon)),
        ),
      };
    },
  };
</script>

<style scoped>
  .icons-window {
    max-height: 600px;
  }
</style>
