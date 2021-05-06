<template>
  <v-toolbar class="z-index-100" dense elevation="0">
    <v-container fluid class="pa-0">
      <v-row no-gutters>
        <v-col>
          <v-toolbar-items>
            <div class="d-flex align-center">
              <Button
                :toggleable="true"
                :icon="'$vcs2d'"
                @click.native="viewMode = '2d'"
                :value="viewMode === '2d'"
              />
              <Button
                :toggleable="true"
                :icon="'$vcs3d'"
                @click.native="viewMode = '3d'"
                :value="viewMode === '3d'"
              />
              <Button
                :toggleable="true"
                :value="viewMode === 'oblique'"
                @click.native="viewMode = 'oblique'"
                :tooltip="'oblique.title' | translate"
                :icon="'$vcsObliqueView'"
              />
              <NavbarDivider class="ma-3" />
              <Button
                :toggleable="true"
                :tooltip="'layer-view.title' | translate"
                :icon="'$vcsLayers'"
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
  </v-toolbar>
</template>

<script>

  import Vue from 'vue';

  import Button from '@vcsuite/uicomponents/Button.vue';
  import NavbarDivider from '@vcsuite/uicomponents/NavbarDivider.vue';


  export default Vue.extend({
    name: 'VcsNavbar',
    components: { NavbarDivider, Button },
    computed: {
    },
    methods: {
    },
    data() {
      return {
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
