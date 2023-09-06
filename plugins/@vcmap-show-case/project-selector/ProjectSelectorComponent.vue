<template>
  <v-container>
    <h1>{{ $t('project-selector.project.title') }}</h1>
    <v-list v-for="(project, index) in state.projects" :key="index">
      <v-card
        class="ma-1"
        :color="project.active ? 'base lighten-3' : undefined"
        @click="selectProject(project)"
        hover
        outlined
        :loading="loading === project.name"
      >
        <v-list-item>
          <v-list-item-content>
            <v-list-item-title class="font-weight-bold">
              {{ project.name }}
            </v-list-item-title>
            <v-list-item-subtitle>{{
              project.description
            }}</v-list-item-subtitle>
            <ModulesListComponent
              :modules="project.modules"
              @toggle-module="toggleModule"
              :toggleable="false"
            />
          </v-list-item-content>
          <v-list-item-action>
            <v-avatar color="success" size="30" v-if="project.active">
              <v-icon>mdi-check</v-icon>
            </v-avatar>
          </v-list-item-action>
        </v-list-item>
      </v-card>
    </v-list>
    <v-divider />
    <h1>{{ $t('project-selector.module.title') }}</h1>
    <ModulesListComponent
      :modules="state.modules"
      @toggle-module="toggleModule"
    />
  </v-container>
</template>
<script>
  import { inject } from 'vue';
  import {
    VList,
    VContainer,
    VCard,
    VIcon,
    VListItem,
    VListItemContent,
    VListItemTitle,
    VListItemSubtitle,
    VListItemAction,
    VAvatar,
    VDivider,
  } from 'vuetify/lib';
  import ModulesListComponent from './ModulesListComponent.vue';

  export default {
    name: 'ProjectSelector',
    components: {
      ModulesListComponent,
      VList,
      VContainer,
      VCard,
      VIcon,
      VListItem,
      VListItemContent,
      VListItemTitle,
      VListItemSubtitle,
      VListItemAction,
      VAvatar,
      VDivider,
    },
    setup() {
      const app = inject('vcsApp');
      const plugin = app.plugins.getByKey('@vcmap-show-case/project-selector');
      async function selectProject(project) {
        this.loading = project.name;
        await plugin.selectProject(app, project);
        this.loading = undefined;
      }

      async function toggleModule(module) {
        if (module.active) {
          await plugin.unloadModule(app, module);
        } else {
          await plugin.loadModule(app, module);
        }
      }

      return {
        loading: undefined,
        state: plugin.state,
        config: plugin.config,
        selectProject,
        toggleModule,
      };
    },
  };
</script>
