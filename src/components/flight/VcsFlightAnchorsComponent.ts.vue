<template>
  <VcsFormSection
    class="vcs-flight-anchors-component"
    :heading="title"
    :expandable="expandable"
    start-open
    :header-actions="actions"
  >
    <v-container class="py-0 px-0">
      <v-sheet v-if="items.length < 1" class="ma-2 pl-2">
        <p>{{ $st('components.flight.noAnchor') }}</p>
        <div class="d-flex justify-center">
          <VcsButton
            :icon="addAnchorAction.icon"
            :tooltip="addAnchorAction.title"
            @click.stop="addAnchorAt()"
          />
        </div>
      </v-sheet>
      <VcsList
        v-else
        :items="items"
        :draggable="draggable"
        :show-title="false"
        @item-moved="move"
      >
        <template #item.title="{ item, index }">
          <div class="d-flex align-center">
            <span class="anchorTitle">{{ $st(item.title) }}</span>
            <v-spacer />
            <div class="duration-input">
              <VcsTextField
                v-if="showDuration(index)"
                v-model="(item as FlightDurationListItem).duration as number"
                :hide-spin-buttons="true"
                type="number"
                unit="s"
                step="1"
                :decimals="2"
                :rules="[durationRule]"
                no-padding
                class="ml-auto"
              />
            </div>
          </div>
        </template>
        <template #item.intermediate="{ index }">
          <div class="d-flex justify-center h-0">
            <VcsButton
              :icon="addAnchorAction.icon"
              :tooltip="addAnchorAction.title"
              @click.stop="addAnchorAt(index + 1)"
              class="z-index-99 mx-auto add-in-button"
            />
          </div>
        </template>
      </VcsList>
    </v-container>
  </VcsFormSection>
</template>

<script lang="ts">
  import type { WritableComputedRef } from 'vue';
  import {
    computed,
    defineComponent,
    inject,
    onMounted,
    onUnmounted,
    reactive,
    ref,
  } from 'vue';
  import { VContainer, VSheet, VSpacer } from 'vuetify/components';
  import {
    anchorFromViewpoint,
    anchorToViewpoint,
    Viewpoint,
  } from '@vcmap/core';
  import type {
    FlightAnchor,
    IndexedCollection,
    ViewpointOptions,
  } from '@vcmap/core';
  import { Cartesian3 } from '@vcmap-cesium/engine';
  import { createToggleAction } from '../../actions/actionHelper.js';
  import type {
    VcsAction,
    DestroyableAction,
  } from '../../actions/actionHelper.js';
  import VcsFormSection from '../section/VcsFormSection.ts.vue';
  import VcsList from '../lists/VcsList.ts.vue';
  import VcsTextField from '../form-inputs-controls/VcsTextField.ts.vue';
  import VcsButton from '../buttons/VcsButton.ts.vue';
  import { moveItem } from '../lists/dragHelper.js';
  import type { ItemMovedEvent } from '../lists/dragHelper.js';
  import type { VcsListItem } from '../lists/VcsListItemComponent.ts.vue';
  import CollectionComponentClass from '../../manager/collectionManager/collectionComponentClass.js';
  import { WindowSlot } from '../../manager/window/windowManager.js';
  import VcsViewpointEditor from '../viewpoint/VcsViewpointEditor.ts.vue';
  import { vcsAppSymbol } from '../../pluginHelper.js';
  import { createFlightVisualizationAction } from '../../actions/flightActions.js';
  import { getProvidedFlightInstance } from './composables.js';
  import type VcsUiApp from '../../vcsUiApp.js';

  type FlightDurationListItem = VcsListItem & {
    duration?: number | WritableComputedRef<number>;
  };

  /**
   * calculate duration between two anchor based on speed and distance
   * @param speed velocity in m/s
   */
  function calculateDuration(
    anchor1: FlightAnchor,
    anchor2: FlightAnchor,
    speed = 300,
  ): number {
    return (
      Cartesian3.distance(
        Cartesian3.fromDegrees(
          anchor1.coordinate[0],
          anchor1.coordinate[1],
          anchor1.coordinate[2],
        ),
        Cartesian3.fromDegrees(
          anchor2.coordinate[0],
          anchor2.coordinate[1],
          anchor2.coordinate[2],
        ),
      ) / speed || 1
    );
  }

  function addAnchorToCollection(
    collection: IndexedCollection<FlightAnchor>,
    app: VcsUiApp,
    index = 0,
  ): void {
    const viewpoint = app.maps.activeMap?.getViewpointSync();
    if (viewpoint) {
      const anchor = anchorFromViewpoint(viewpoint);
      if (anchor) {
        anchor.title = `Viewpoint ${collection.size + 1}`;
        if (index > 0) {
          const prevAnchor = collection.get(index - 1);
          prevAnchor.duration = calculateDuration(prevAnchor, anchor);
          if (index < collection.size) {
            const nextAnchor = collection.get(index);
            anchor.duration = calculateDuration(anchor, nextAnchor);
          }
        }
        collection.add(anchor, index);
      }
    }
  }

  function createAddAnchorAction(
    app: VcsUiApp,
    collection: IndexedCollection<FlightAnchor>,
  ): VcsAction {
    return reactive({
      name: 'components.flight.addAnchor',
      title: 'components.flight.addAnchor',
      icon: '$vcsPlus',
      callback() {
        addAnchorToCollection(collection, app);
      },
    });
  }

  function createEditAnchorAction(
    app: VcsUiApp,
    item: FlightAnchor,
    collection: IndexedCollection<FlightAnchor>,
    parentId: string | undefined,
    owner: string | symbol,
  ): DestroyableAction {
    const { action, destroy } = createToggleAction(
      {
        name: 'edit-anchor',
        icon: '$vcsEdit',
        title: 'components.flight.editAnchor',
      },
      {
        id: `edit-anchor-${item.name}`,
        parentId,
        component: VcsViewpointEditor,
        slot: WindowSlot.DYNAMIC_CHILD,
        state: {
          headerTitle: 'components.flight.editAnchor',
          headerIcon: '$vcsEdit',
        },
        props: {
          getConfig() {
            return anchorToViewpoint(item).toJSON();
          },
          setConfig(config: ViewpointOptions) {
            if (config) {
              const idx = collection.indexOf(item);
              // avoid shadows by remove
              collection.remove(item);

              collection.add(anchorFromViewpoint(new Viewpoint(config))!, idx);
            }
            return Promise.resolve();
          },
          hideAnimate: true,
          hideName: true,
        },
      },
      app.windowManager,
      owner,
    );
    return { action, destroy };
  }

  function createZoomToAnchorAction(
    app: VcsUiApp,
    item: FlightAnchor,
  ): VcsAction {
    return reactive({
      name: 'components.flight.zoomToAnchor',
      title: 'components.flight.zoomToAnchor',
      async callback() {
        const viewpoint = anchorToViewpoint(item);
        await app.maps.activeMap?.gotoViewpoint(viewpoint);
      },
    });
  }

  function createRemoveAnchorAction(
    item: FlightAnchor,
    collection: IndexedCollection<FlightAnchor>,
  ): VcsAction {
    return reactive({
      name: 'components.flight.removeAnchor',
      title: 'components.flight.removeAnchor',
      callback() {
        collection.remove(item);
      },
    });
  }

  export function durationRule(value: number | string): boolean | string {
    const v = Number.parseFloat(String(value));
    if (Number.isFinite(v) && v > 0) {
      return true;
    }
    return 'components.flight.invalidDuration';
  }

  /**
   * @description A component for editing flight anchors.
   * Requires a flightInstance to be provided via vue-provide.
   * @vue-prop {string} [expandable=false] - anchors section expandable
   * @vue-prop {string} [parentId] - id of the window, the VcsFlightComponent is used in
   * @vue-prop {string} [owner] - owner of the window, e.g. a plugin name
   */
  export default defineComponent({
    name: 'VcsFlightAnchorsComponent',
    components: {
      VcsButton,
      VcsTextField,
      VContainer,
      VSheet,
      VSpacer,
      VcsFormSection,
      VcsList,
    },
    props: {
      expandable: {
        type: Boolean,
        default: false,
      },
      parentId: {
        type: String,
        default: undefined,
      },
      owner: {
        type: [String, Symbol],
        default: vcsAppSymbol,
      },
    },
    setup({ parentId, owner }) {
      const app = inject('vcsApp') as VcsUiApp;
      const flightInstance = getProvidedFlightInstance();
      const loop = ref(flightInstance.loop);
      const loopChangedListener =
        flightInstance.propertyChanged.addEventListener((prop) => {
          if (prop === 'loop') {
            loop.value = flightInstance.loop;
            // update last anchor's duration
            const lastAnchor = flightInstance.anchors.get(
              flightInstance.anchors.size - 1,
            );
            lastAnchor.duration = calculateDuration(
              lastAnchor,
              flightInstance.anchors.get(0),
            );
          }
        });

      let flightVis: DestroyableAction | undefined;

      const collectionComponent = new CollectionComponentClass(
        {
          title: 'components.flight.anchors',
          draggable: true,
          collection: flightInstance.anchors,
        },
        owner,
      );

      collectionComponent.addItemMapping({
        mappingFunction: (item, _c, listItem) => {
          const { action: editAction, destroy: editDestroy } =
            createEditAnchorAction(
              app,
              item,
              flightInstance.anchors,
              parentId,
              owner,
            );
          listItem.actions = [
            editAction,
            createZoomToAnchorAction(app, item),
            createRemoveAnchorAction(item, flightInstance.anchors),
          ];
          const localDuration = ref(item.duration);

          (listItem as FlightDurationListItem).duration = computed({
            get: () => localDuration.value,
            set(value: number | string) {
              const v = Number.parseFloat(String(value));
              if (Number.isFinite(v) && v > 0) {
                item.duration = v;
                localDuration.value = v;
              }
            },
          });
          const durationListener = item.changed.addEventListener(() => {
            localDuration.value = item.duration;
          });
          listItem.title = item.title ?? item.name;
          listItem.destroyFunctions.push(editDestroy, durationListener);
        },
        owner,
      });

      onMounted(async () => {
        flightVis = await createFlightVisualizationAction(app, flightInstance);

        collectionComponent.addActions([{ action: flightVis.action, owner }]);
      });

      onUnmounted(() => {
        loopChangedListener();
        flightVis?.destroy();
        collectionComponent.destroy();
      });

      const addAnchorAction = createAddAnchorAction(
        app,
        flightInstance.anchors,
      );
      const addAnchorAt = (index = 0): void => {
        addAnchorToCollection(flightInstance.anchors, app, index);
      };

      return {
        addAnchorAction,
        addAnchorAt,
        title: collectionComponent.title,
        items: collectionComponent.items,
        draggable: collectionComponent.draggable,
        actions: collectionComponent.getActions(),
        move(event: ItemMovedEvent): void {
          moveItem(flightInstance.anchors, event);
        },
        durationRule,
        showDuration(index: number): boolean {
          if (collectionComponent.items.value.length - 1 === index) {
            return loop.value;
          }
          return true;
        },
      };
    },
  });
</script>

<style scoped lang="scss">
  :deep(.v-list-item) {
    padding: 0 8px 0 16px;
  }
  :deep(.v-list) {
    overflow: visible;
  }
  .duration-input {
    min-width: 60px;
    width: 60px;
  }
  .z-index-99 {
    z-index: 99 !important;
  }
  .add-in-button {
    min-height: 0 !important;
    margin-top: -8px;
  }
  .anchorTitle {
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
