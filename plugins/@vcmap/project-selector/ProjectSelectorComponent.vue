<template>
  <v-container>
    <h1>{{ $t('project-selector.project.title') }}</h1>
    <v-list
      v-for="(project, index) in state.projects.value"
      :key="index"
    >
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
            <v-list-item-subtitle>{{ project.description }}</v-list-item-subtitle>
            <ContextsListComponent
              :contexts="project.contexts"
              @toggle-context="toggleContext"
              :toggleable="false"
            />
          </v-list-item-content>
          <v-list-item-action>
            <v-avatar
              color="success"
              size="30"
              v-if="project.active"
            >
              <v-icon>mdi-check</v-icon>
            </v-avatar>
          </v-list-item-action>
        </v-list-item>
      </v-card>
    </v-list>
    <v-divider />
    <h1>Contexts</h1>
    <ContextsListComponent
      :contexts="state.contexts.value"
      @toggle-context="toggleContext"
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
  import ContextsListComponent from './ContextsListComponent.vue';

  export default {
    name: 'ProjectSelector',
    components: {
      ContextsListComponent,
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
      const plugin = app.plugins.getByKey('@vcmap/project-selector');
      async function selectProject(project) {
        this.loading = project.name;
        await plugin.selectProject(app, project);
        this.loading = undefined;
      }

      async function toggleContext(context) {
        if (context.active) {
          await plugin.unloadContext(app, context);
        } else {
          await plugin.loadContext(app, context);
        }
      }

      return {
        loading: undefined,
        state: plugin.state,
        config: plugin.config,
        selectProject,
        toggleContext,
      };
    },
  };
</script>
