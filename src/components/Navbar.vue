<template>
  <v-app-bar dense class="z-index-100">
    <v-container fluid class="pa-0">
      <v-row no-gutters>
        <v-col>
          <v-toolbar-items>
            <div v-if="$store.state[mapId]" class="d-flex align-center">
              <Button
                v-for="map of $store.state[mapId].maps"
                :key="map.name"
                :toggleable="true"
                :icon="iconMap[map.name]"
                @click.native="$store.dispatch(mapId +'/changeMap', map.name)"
                :value="$store.state[mapId] && $store.state[mapId].activeMap === map.name"
              />
            </div>
          </v-toolbar-items>
        </v-col>
        <v-col class="align-center d-flex justify-center">
          <div class="company-logo" />
        </v-col>
        <v-col />
      </v-row>
    </v-container>
  </v-app-bar>
</template>

<script>

  import Vue from 'vue';

  import Button from '@vcsuite/uicomponents/Button.vue';

  export default Vue.extend({
    name: 'VcsNavbar',
    components: { Button },
    props: {
      mapId: {
        type: String,
        default: undefined,
      },
    },
    data() {
      return {
        iconMap: {
          openlayers: '$vcs2d',
          cesium: '$vcs3d',
          oblique: '$vcsObliqueView',
        },
        userMenuItems: [
          {
            title: 'Preferences',
            iconAppend: { name: 'mdi-chevron-right' },
            children: [
              { title: 'Open preferences' },
              { title: 'Language' },
              { title: 'Render settings' },
              { title: 'Controls' },
            ],
          },
          {
            title: 'Display settings',
            iconAppend: { name: 'mdi-chevron-right' },
          },
          { title: 'Presentation mode' },
          {
            title: 'Share / Invite',
            iconPrepend: { name: '$vcsLink' },
          },
          {
            title: 'Create PDF',
            iconPrepend: { name: '$vcsPdf' },
          },
          {
            title: 'Help',
            iconPrepend: { name: '$vcsHelp' },
          },
          { title: 'About' },
        ],
      };
    },
  });
</script>
