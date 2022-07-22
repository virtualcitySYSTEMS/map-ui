<template>
  <div v-if="actions.length > 0">
    <VcsButton
      v-if="singleActionButton"
      :key="singleActionButton.name"
      :tooltip="singleActionButton.title"
      :icon="singleActionButton.icon"
      :active="singleActionButton.active"
      @click.stop="singleActionButton.callback($event)"
      v-bind="{...$attrs}"
      large
    />
    <VcsButton
      v-else-if="groupButtons.length > 0"
      v-bind="{...$attrs}"
      width="48"
      :icon="groupIcon"
      :tooltip="groupTitle"
      :active="active"
      @click="$emit('click')"
      large
    >
      <v-icon v-text="active ? 'mdi-chevron-up' : 'mdi-chevron-down'" color="accent" class="text--darken-3" />
    </VcsButton>
    <v-toolbar
      v-if="active"
      dense
      absolute
      class="toolbar__secondary rounded-b mx-auto v-sheet mt-12 px-4 second-toolbar"
      :style="{left: `${nudgeLeft}px` }"
    >
      <v-toolbar-items class="w-full">
        <div class="d-flex align-center justify-space-between w-full action-btn-wrap">
          <VcsButton
            v-for="(button, index) in groupButtons"
            :key="`${button.name}-${index}`"
            :tooltip="button.title"
            :icon="button.icon"
            :active="button.active"
            @click.stop="button.callback($event)"
            :width="buttonSize"
            v-bind="{...$attrs}"
            large
          />
        </div>
      </v-toolbar-items>
    </v-toolbar>
  </div>
</template>
<style lang="scss" scoped>
.action-btn-wrap{
  gap: 8px;
}
.v-toolbar.v-sheet {
  background-color: #ffffffda;
}
.second-toolbar{
  display: table;
}
</style>
<script>

  import VcsButton from '../../components/buttons/VcsButton.vue';
  import { validateActions } from '../../components/lists/VcsActionList.vue';

  /**
   * @description
   * A component rendering a single action or a group of actions in a dropdown toolbox using {@link VcsButton} and {@link ToolboxButton}.
   * @vue-prop {Array<VcsAction>} actions - Array of actions
   * @vue-prop {string} [groupIcon=''] - optional icon for group dropdown button
   * @vue-prop {string} [groupTitle=''] - optional title for group dropdown button
   * @vue-prop {boolean} active - boolean flag, whether group is active
   * @vue-prop {boolean} position - relative x-position of the button within the toolbar
   * @vue-computed {Array<VcsAction>} singleActionButton - single button without dropdown
   * @vue-computed {Array<VcsAction>} groupButtons - buttons rendered below group dropdown button
   * @vue-computed {number} nudgeLeft - offset depending on buttonSize and buttonPadding to render toolbox centered below dropdown button
   */
  export default {
    name: 'ToolboxGroupComponent',
    components: { VcsButton },
    props: {
      actions: {
        type: Array,
        required: true,
        validator: validateActions,
      },
      groupIcon: {
        type: String,
        required: true,
      },
      groupTitle: {
        type: String,
        default: '',
      },
      active: {
        type: Boolean,
        required: true,
      },
      position: {
        type: Number,
        required: true,
      },
    },
    data() {
      return {
        buttonSize: 34,
        buttonPadding: 8,
      };
    },
    computed: {
      singleActionButton() {
        if (this.actions.length === 1) {
          return this.actions[0];
        }
        return undefined;
      },
      groupButtons() {
        if (this.singleActionButton) {
          return [];
        }
        return this.actions;
      },
      width() {
        // XXX can this be solved by CSS to get rid of hardcoded size and padding?
        return this.groupButtons.length * (this.buttonSize + 2 * this.buttonPadding);
      },
      nudgeLeft() {
        return this.position - this.width / 2;
      },
    },
  };
</script>
