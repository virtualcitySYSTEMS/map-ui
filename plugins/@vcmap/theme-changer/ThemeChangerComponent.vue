<template>
  <v-card>
    <v-list-item>
      <v-list-item-content>
        <v-list-item-title class="font-weight-bold">
          Dark Mode
        </v-list-item-title>
      </v-list-item-content>
      <v-list-item-action>
        <v-switch v-model="$vuetify.theme.dark" />
      </v-list-item-action>
    </v-list-item>
    <v-divider />
    <v-card-text>
      <v-card
        class="my-2"
        :disabled="state.selected.value === theme.name"
        @click="setTheme(theme)"
        hover
        outlined
        v-for="(theme, index) in config.themes.value"
        :key="index"
      >
        <v-list-item>
          <v-list-item-content>
            <v-list-item-title class="font-weight-bold">
              {{ theme.name }}
            </v-list-item-title>
          </v-list-item-content>
          <v-list-item-action>
            <v-avatar
              color="success"
              size="30"
              v-if="state.selected.value === theme.name"
            >
              <v-icon>mdi-check</v-icon>
            </v-avatar>
          </v-list-item-action>
        </v-list-item>
        <v-card class="my-1 ma-1 py-1 white">
          <v-chip
            class="mx-1"
            label
            :color="theme.dark[key]"
            v-for="(key, index) in Object.keys(theme.dark)"
            :key="index"
          >
            {{ key }}
          </v-chip>
        </v-card>
        <v-card class="my-1 ma-1 py-1 black">
          <v-chip
            class="mx-1"
            label
            :color="theme.light[key]"
            v-for="(key, index) in Object.keys(theme.light)"
            :key="index"
          >
            {{ key }}
          </v-chip>
        </v-card>
      </v-card>
    </v-card-text>
  </v-card>
</template>
<script>
  import { inject } from 'vue';
  import {
    VCard,
    VCardText,
    VChip,
    VListItem,
    VListItemContent,
    VListItemTitle,
    VListItemAction,
    VAvatar,
    VIcon,
    VDivider,
    VSwitch,
  } from 'vuetify/lib';

  export default {
    name: 'ThemeChanger',
    components: {
      VCard,
      VCardText,
      VChip,
      VListItem,
      VListItemContent,
      VListItemTitle,
      VListItemAction,
      VAvatar,
      VIcon,
      VDivider,
      VSwitch,
    },
    setup() {
      const app = inject('vcsApp');
      const plugin = app.plugins.getByKey('@vcmap/theme-changer');

      function setTheme(theme) {
        const { name, dark, light } = theme;
        Object.keys(dark).forEach((i) => {
          this.$vuetify.theme.themes.dark[i] = dark[i];
        });
        Object.keys(light).forEach((i) => {
          this.$vuetify.theme.themes.light[i] = light[i];
        });
        plugin.state.selected.value = name;
      }
      return {
        state: plugin.state,
        config: plugin.config,
        setTheme,
      };
    },
  };
</script>
