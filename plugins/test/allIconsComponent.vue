<template>
  <v-sheet class="overflow-auto icons-window">
    <v-list>
      <v-list-item
        v-for="icon in icons"
        :key="icon"
      >
        <v-list-item-title>{{ icon }}</v-list-item-title>
        <v-list-item-icon>
          <v-icon>{{ icon }}</v-icon>
        </v-list-item-icon>
      </v-list-item>
    </v-list>
  </v-sheet>
</template>

<script>
  import { Icons } from '@vcmap/ui';
  import {
    VSheet,
    VList,
    VListItem,
    VListItemIcon,
    VIcon,
    VListItemTitle,
  } from 'vuetify/lib';

  export default {
    name: 'AllIconsComponent',
    components: {
      VSheet,
      VList,
      VListItem,
      VListItemIcon,
      VIcon,
      VListItemTitle,
    },
    computed: {
      icons() {
        return Object.keys(Icons).map(n => `$${n}`);
      },
    },
  };
</script>

<style scoped>
.icons-window {
  max-height: 600px;
}
</style>
