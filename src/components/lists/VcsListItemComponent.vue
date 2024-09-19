<script setup>
  import {
    VListItem,
    VIcon,
    VListItemTitle,
    VTooltip,
  } from 'vuetify/components';
  import { computed, ref } from 'vue';
  import { is } from '@vcsuite/check';
  import VcsBadge from '../notification/VcsBadge.vue';
  import VcsActionButtonList from '../buttons/VcsActionButtonList.vue';
  import VcsTextField from '../form-inputs-controls/VcsTextField.vue';
  import { createEllipseTooltip } from '../composables.js';

  /**
   * @typedef {Object} VcsListItem
   * @property {string} name
   * @property {boolean} [visible] - Whether to display this item or not.
   * @property {boolean} [disabled] - Whether this item should be displayed as disabled.
   * @property {boolean|import("../../actions/actionHelper.js").ActionOptions} [renamable] - Whether the title of can be edited. will add a rename action to the end of the action list. This action will call titleChanged with the new title, you must provide the callback yourself, otherwise this does not work as expeted.
   * @property {string} title - The title to be displayed
   * @property {string} [tooltip]
   * @property {string|HTMLCanvasElement|HTMLImageElement|undefined} [icon] - An optional icon to display with this item. Can be a URL or HTMLElement.
   * @property {boolean} [hasUpdate] - Shows badge, if item has an update.
   * @property {Array<import("../../actions/actionHelper.js").VcsAction>} [actions]
   * @property {Array<function(PointerEvent):void>|undefined} [clickedCallbacks] - An array of callbacks called on item click. called before selection update
   * @property {function(boolean):void} [selectionChanged] - A callback called if the selection changes with the current selection status. called before value update
   * @property {function(string):void} [titleChanged] - A callback called if the title changes via rename action. only usable with renamble true.
   */

  const props = defineProps({
    /** @type {VcsListItem} */
    item: {
      type: Object,
      required: true,
    },
    actionButtonListOverflowCount: {
      type: Number,
      default: undefined,
    },
    dragging: {
      type: Boolean,
      default: false,
    },
  });

  const rename = ref(false);
  const renameAction = computed(() => {
    if (props.item.renamable) {
      return {
        name: 'list.renameItem',
        ...(is(props.item.renamable, Object) ? props.item.renamable : {}),
        callback() {
          rename.value = true;
        },
      };
    }
    return undefined;
  });

  function renameOff() {
    rename.value = false;
  }

  const actions = computed(() => {
    if (renameAction.value) {
      return [...(props.item?.actions || []), renameAction.value];
    }
    return [...(props.item?.actions || [])];
  });

  const title = ref();
  const tooltip = createEllipseTooltip(
    computed(() => {
      if (rename.value) {
        return undefined;
      }
      return title.value?.$el;
    }),
    computed(() => props.item?.tooltip),
    computed(() => props.item?.title),
  );

  function renameItem(item, newTitle) {
    if (newTitle) {
      item.titleChanged?.(newTitle);
    }
  }
</script>

<template>
  <v-list-item
    :disabled="item.disabled"
    v-bind="$attrs"
    class="vcs-list-item-component"
  >
    <template #prepend="scope">
      <slot name="prepend" v-bind="scope">
        <v-icon v-if="item.icon">
          {{ item.icon }}
        </v-icon>
      </slot>
    </template>
    <template #title="scope">
      <slot name="title" v-bind="{ ...scope, tooltip }">
        <v-list-item-title
          ref="title"
          :class="{ 'vcs-list-item__rename': rename }"
        >
          <vcs-text-field
            v-if="rename"
            :model-value="item.title"
            autofocus
            @update:model-value="(value) => renameItem(item, value)"
            @click.stop
            @keydown.enter="renameOff"
            @blur="renameOff"
            :rules="[(v) => !!v || 'components.validation.required']"
            class="pa-0"
          />
          <template v-else>
            {{ $st(item.title) }}
          </template>
          <v-tooltip v-if="dragging === false && tooltip" activator="parent">
            {{ $st(tooltip) }}
          </v-tooltip>
        </v-list-item-title>
      </slot>
    </template>
    <template #subtitle="scope">
      <slot name="subtitle" v-bind="scope" />
    </template>
    <template #default="scope">
      <slot name="default" v-bind="{ ...scope, tooltip }" />
    </template>
    <template #append="scope">
      <slot
        name="append"
        v-bind="{
          ...scope,
          item,
          actions,
          actionButtonListOverflowCount,
        }"
      >
        <vcs-badge v-if="item.hasUpdate" class="mr-1" />
        <vcs-action-button-list
          v-if="actions.length > 0"
          :actions="actions"
          :disabled="item.disabled"
          :block-overflow="true"
          :overflow-count="actionButtonListOverflowCount"
          class="ml-2"
        />
      </slot>
    </template>
  </v-list-item>
</template>

<style lang="scss" scoped>
  .v-list-item {
    padding: 4px 8px 4px 8px;
    padding-inline-end: 8px !important;
    padding-inline-start: 16px !important;
    &.border-bottom {
      border-bottom: solid;
      border-bottom-color: rgb(var(--v-theme-base-lighten-2));
    }
    &.border-top {
      border-top: solid;
      border-top-color: rgb(var(--v-theme-base-lighten-2));
    }
    &:after {
      display: none;
    }
    &.font-weight-bold {
      .v-list-item__title {
        font-weight: 700;
      }
    }
    :deep(.v-list-item__action) {
      .v-icon {
        font-size: 16px;
      }
      &:last-child {
        min-width: auto;
      }
    }
    :deep(.v-list-item__content) {
      flex-wrap: nowrap;
      column-gap: 4px;
      .v-icon,
      .action-btn-wrap {
        flex: 1 1 auto;
      }
      .v-icon {
        font-size: 16px;
        .v-icon__component {
          width: 16px;
          height: 16px;
        }
      }
    }
    :deep(.v-list-item__prepend > .v-badge ~ .v-list-item__spacer),
    :deep(.v-list-item__prepend > .v-icon ~ .v-list-item__spacer),
    :deep(.v-list-item__prepend > .v-tooltip ~ .v-list-item__spacer) {
      width: 8px;
    }
    :deep(.v-list-item__overlay) {
      background-color: transparent;
    }
    :deep(.vcs-list-item__rename) {
      color: rgb(var(--v-theme-on-surface));
    }
  }
</style>
