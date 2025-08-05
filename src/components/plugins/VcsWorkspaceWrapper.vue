<template>
  <v-container class="pa-0 abstract-workspace-item-creator">
    <slot />
    <div v-if="showFooter">
      <v-divider class="mt-3" />
      <div class="d-flex w-full justify-space-between px-2 pt-2 pb-1">
        <VcsFormButton
          v-if="showAdd && !workspaceHidden"
          icon="$vcsComponentsPlus"
          :disabled="disableAdd"
          :tooltip="tooltipAdd"
          @click="$emit('addClicked', $event)"
        />
        <div class="d-flex gc-2 w-100 justify-end">
          <slot name="secondaryButton" />
          <VcsFormButton
            variant="filled"
            :disabled="disableNew"
            :tooltip="tooltipNew"
            @click="$emit('newClicked', $event)"
          >
            {{ $st(newButtonTitle) }}
          </VcsFormButton>
          <VcsActionButtonList :actions="actions" button="VcsFormButton" />
        </div>
      </div>
    </div>
  </v-container>
</template>

<script>
  import { VContainer, VDivider } from 'vuetify/components';
  import { computed, inject } from 'vue';
  import VcsFormButton from '../buttons/VcsFormButton.vue';
  import VcsActionButtonList from '../buttons/VcsActionButtonList.vue';

  /**
   * @description Basic wrapper for all plugins interacting with MyWorkspace.
   * Providing a footer with add and new buttons.
   * @vue-prop {boolean} [showFooter=true] - Flag to hide the footer.
   * @vue-prop {boolean} [showAdd=true] - Flag to show an add button in the footer. You need to handle @addClicked in a child component.
   * @vue-prop {boolean} [disableAdd=false] - Flag to render add button disabled.
   * @vue-prop {boolean} [tooltipAdd='components.addToMyWorkspace'] - Option to change the add button tooltip.
   * @vue-prop {boolean} [disableNew=false] - Flag to render new button disabled.
   * @vue-prop {boolean} [tooltipNew''] - Option to change the add a tooltip to the new button.
   * @vue-prop {Array<VcsAction>} [actions] - Optional actions rendered as ActionButtonList in the footer.
   * @vue-prop {string} [newButtonTitle='components.new'] - Option to change the new button title, e.g. to 'components.apply'.
   * @vue-event {Event} addClicked - Event fired on clicking the reset button.
   * @vue-event {Event} newClicked - Event fired on clicking the cancel button.
   * @vue-slot secondaryButton An optionnal named slot to add a secondary button to the footer, rendered filled on the left of the new button.
   */
  export default {
    name: 'VcsWorkspaceWrapper',
    components: {
      VContainer,
      VDivider,
      VcsFormButton,
      VcsActionButtonList,
    },
    props: {
      showFooter: {
        type: Boolean,
        default: true,
      },
      showAdd: {
        type: Boolean,
        default: true,
      },
      disableAdd: {
        type: Boolean,
        default: false,
      },
      tooltipAdd: {
        type: String,
        default: 'components.addToMyWorkspace',
      },
      newButtonTitle: {
        type: String,
        default: 'components.new',
      },
      disableNew: {
        type: Boolean,
        default: false,
      },
      tooltipNew: {
        type: String,
        default: '',
      },
      actions: {
        type: Array,
        default: () => [],
      },
    },
    emits: ['addClicked', 'newClicked'],
    setup() {
      const app = inject('vcsApp');
      return {
        workspaceHidden: computed(() => !!app.uiConfig.config.workspaceHidden),
      };
    },
  };
</script>

<style scoped></style>
