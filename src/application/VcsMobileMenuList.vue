<script setup>
  import { computed, inject } from 'vue';
  import { VDivider, VList, VListItem } from 'vuetify/components';
  import {
    ButtonLocation,
    deviceSymbol,
    getActionsByLocation,
  } from '../manager/navbarManager.js';
  import VcsTextPageFooter from './VcsTextPageFooter.vue';
  import { getDataProtection, getImprint } from './uiConfigHelper.js';
  import { toolboxComponentId } from '../manager/toolbox/ToolboxManagerComponent.vue';
  import { defaultContentTreeComponentId } from '../contentTree/contentTreeCollection.js';
  import { legendComponentId } from './VcsApp.vue';

  const app = inject('vcsApp');

  const mobileButtonComponents = computed(() =>
    app.navbarManager.componentIds
      .map((id) => app.navbarManager.get(id))
      .filter((buttonComponent) => {
        return buttonComponent[deviceSymbol].mobile;
      }),
  );

  const getActions = (location) =>
    computed(() =>
      getActionsByLocation(
        mobileButtonComponents.value,
        location,
        [...app.plugins].map((p) => p.name),
      ),
    );

  // Actions from the content overflow are put in Menu
  const defaultContentTreeComponentIdAction = app.navbarManager.get(
    defaultContentTreeComponentId,
  ).action;
  const legendComponentIdAction =
    app.navbarManager.get(legendComponentId).action;
  const contentOverflowActions = computed(() => {
    return getActions(ButtonLocation.CONTENT).value.filter(
      (action) =>
        action.name !== defaultContentTreeComponentIdAction.name &&
        action.name !== legendComponentIdAction.name,
    );
  });

  const toolboxToggleAction = app.navbarManager.get(toolboxComponentId).action;

  const toolboxOverflowActions = computed(() =>
    getActions(ButtonLocation.TOOL).value.filter(
      (action) => action.name !== toolboxToggleAction.name,
    ),
  );

  const mobileMenuActions = [
    ...getActions(ButtonLocation.MENU).value,
    ...getActions(ButtonLocation.SHARE).value,
    ...getActions(ButtonLocation.PROJECT).value,
    ...toolboxOverflowActions.value,
    ...contentOverflowActions.value,
  ];

  const dataProtection = getDataProtection(app.uiConfig?.config);
  const imprint = getImprint(app.uiConfig?.config);
</script>

<template>
  <v-list>
    <div v-for="action in mobileMenuActions" :key="action.name">
      <v-list-item
        @click="action.callback()"
        :title="$t(action.name)"
        :prepend-icon="action.icon"
      >
      </v-list-item>
      <v-divider></v-divider>
    </div>
    <template v-if="imprint">
      <v-list-item v-if="imprint">
        <VcsTextPageFooter
          class="plainStyle"
          :text-page="imprint"
          :window-id="'imprintWindow'"
        />
      </v-list-item>
      <v-divider></v-divider>
    </template>
    <template v-if="dataProtection">
      <v-list-item v-if="dataProtection">
        <VcsTextPageFooter
          class="plainStyle"
          :text-page="dataProtection"
          :window-id="'dataProtectionWindow'"
        />
      </v-list-item>
    </template>
  </v-list>
</template>

<style scoped lang="scss">
  .plainStyle {
    font-family: var(--v-vcs-font-family), sans-serif !important;
    font-size: var(--v-vcs-font-size) !important;
  }
  ::v-deep(.text-page-footer) {
    font-size: var(--v-vcs-font-size) !important;
    text-decoration: none !important;

    a {
      color: var(--v-text-color);
      text-decoration: none !important;
    }
  }
  ::v-deep(.v-list-item__prepend) {
    display: block !important;
  }
</style>
