<template>
  <vcs-list
    class="icons-window"
    :items="icons"
    searchable
    sticky-searchbar
    :show-title="false"
  />
</template>

<script>
  import { Icons, VcsList } from '@vcmap/ui';
  import { computed } from 'vue';

  export default {
    name: 'AllIconsComponent',
    components: {
      VcsList,
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
