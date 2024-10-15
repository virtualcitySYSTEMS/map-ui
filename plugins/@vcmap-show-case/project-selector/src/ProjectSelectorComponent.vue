<template>
  <v-container>
    <h1>{{ $t('project-selector.project.title') }}</h1>
    <v-list v-for="(project, index) in state.projects" :key="index">
      <v-card
        class="ma-1"
        :title="project.name"
        :subtitle="project.description"
        :color="project.active ? 'base-lighten-3' : undefined"
        @click="selectProject(project)"
        hover
        outlined
        :loading="loading === project.name"
      >
        <template #actions>
          <ModulesListComponent
            :modules="project.modules"
            @toggle-module="toggleModule"
            :toggleable="false"
          />
        </template>
        <template #append>
          <v-avatar color="success" size="30" v-if="project.active">
            <v-icon>mdi-check</v-icon>
          </v-avatar>
        </template>
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
  import { inject, ref } from 'vue';
  import {
    VList,
    VContainer,
    VCard,
    VIcon,
    VAvatar,
    VDivider,
  } from 'vuetify/components';
  import ModulesListComponent from './ModulesListComponent.vue';

  export default {
    name: 'ProjectSelector',
    components: {
      ModulesListComponent,
      VList,
      VContainer,
      VCard,
      VIcon,
      VAvatar,
      VDivider,
    },
    setup() {
      const app = inject('vcsApp');
      const plugin = app.plugins.getByKey('@vcmap-show-case/project-selector');
      const loading = ref(undefined);

      async function selectProject(project) {
        loading.value = project.name;
        await plugin.selectProject(app, project);
        loading.value = undefined;
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
