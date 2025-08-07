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
        <p>{{ $t('components.flight.noAnchor') }}</p>
        <div class="d-flex justify-center">
          <VcsButton
            :icon="addAnchorAction.icon"
            :tooltip="addAnchorAction.title"
            @click.stop="addAnchorAction.callback()"
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
                v-model.number="item.duration"
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
              @click.stop="addAnchorAction.callback(index + 1)"
              class="z-index-99 mx-auto add-in-button"
            />
          </div>
        </template>
      </VcsList>
    </v-container>
  </VcsFormSection>
</template>

<script>
  import { computed, inject, onMounted, onUnmounted, ref } from 'vue';
  import { VContainer, VSheet, VSpacer } from 'vuetify/components';
  import {
    anchorFromViewpoint,
    anchorToViewpoint,
    Viewpoint,
  } from '@vcmap/core';
  import { Cartesian3 } from '@vcmap-cesium/engine';
  import { createToggleAction } from '../../actions/actionHelper.js';
  import VcsFormSection from '../section/VcsFormSection.vue';
  import VcsList from '../lists/VcsList.vue';
  import VcsTextField from '../form-inputs-controls/VcsTextField.vue';
  import VcsButton from '../buttons/VcsButton.vue';
  import { moveItem } from '../../manager/collectionManager/CollectionComponentList.vue';
  import CollectionComponentClass from '../../manager/collectionManager/collectionComponentClass.js';
  import { WindowSlot } from '../../manager/window/windowManager.js';
  import VcsViewpointEditor from '../viewpoint/VcsViewpointEditor.vue';
  import { vcsAppSymbol } from '../../pluginHelper.js';
  import { createFlightVisualizationAction } from '../../actions/flightActions.js';
  import { getProvidedFlightInstance } from './composables.js';

  /**
   * calculate duration between two anchor based on speed and distance
   * @param {import("@vcmap/core").FlightAnchor} anchor1
   * @param {import("@vcmap/core").FlightAnchor} anchor2
   * @param {number} [speed=300] velocity in m/s
   * @returns {number}
   */
  function calculateDuration(anchor1, anchor2, speed = 300) {
    return (
      Cartesian3.distance(
        Cartesian3.fromDegrees(...anchor1.coordinate),
        Cartesian3.fromDegrees(...anchor2.coordinate),
      ) / speed || 1
    );
  }

  /**
   * @param {import("@src/vcsUiApp.js").default} app
   * @param {import("@vcmap/core").IndexedCollection<import("@vcmap/core").FlightAnchor>} collection
   * @returns {import("../../actions/actionHelper.js").VcsAction}
   */
  function createAddAnchorAction(app, collection) {
    return {
      name: 'components.flight.addAnchor',
      title: 'components.flight.addAnchor',
      icon: '$vcsPlus',
      callback(index = 0) {
        const viewpoint = app.maps.activeMap.getViewpointSync();
        const anchor = anchorFromViewpoint(viewpoint);
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
      },
    };
  }

  /**
   * @param {import("@src/vcsUiApp.js").default} app
   * @param {import("@vcmap/core").FlightAnchor} item
   * @param {import("@vcmap/core").IndexedCollection<import("@vcmap/core").FlightAnchor>} collection
   * @param {string} parentId
   * @param {string} owner
   * @returns {{action:import("../../actions/actionHelper.js").VcsAction, destroy: ()=>void}}
   */
  function createEditAnchorAction(app, item, collection, parentId, owner) {
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
          setConfig(config) {
            if (config) {
              const idx = collection.indexOf(item);
              // avoid shadows by remove
              collection.remove(item);
              collection.add(anchorFromViewpoint(new Viewpoint(config)), idx);
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

  /**
   * @param {import("@src/vcsUiApp.js").default} app
   * @param {import("@vcmap/core").FlightAnchor} item
   * @returns {import("../../actions/actionHelper.js").VcsAction}
   */
  function createZoomToAnchorAction(app, item) {
    return {
      name: 'components.flight.zoomToAnchor',
      title: 'components.flight.zoomToAnchor',
      callback() {
        const viewpoint = anchorToViewpoint(item);
        app.maps.activeMap?.gotoViewpoint(viewpoint);
      },
    };
  }

  /**
   * @param {import("@vcmap/core").FlightAnchor} item
   * @param {import("@vcmap/core").IndexedCollection<import("@vcmap/core").FlightAnchor>} collection
   * @returns {import("../../actions/actionHelper.js").VcsAction}
   */
  function creatRemoveAnchorAction(item, collection) {
    return {
      name: 'components.flight.removeAnchor',
      title: 'components.flight.removeAnchor',
      callback() {
        collection.remove(item);
      },
    };
  }

  export function durationRule(value) {
    const v = Number.parseFloat(value);
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
  export default {
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
      const app = inject('vcsApp');
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

      let flightVis;

      const collectionComponent = new CollectionComponentClass(
        {
          title: 'components.flight.anchors',
          draggable: true,
          collection: flightInstance.anchors,
        },
        owner,
      );

      collectionComponent.addItemMapping({
        mappingFunction: (item, c, listItem) => {
          const { action: editAction, destroy: editDestroy } =
            createEditAnchorAction(app, item, c.collection, parentId, owner);
          listItem.actions = [
            editAction,
            createZoomToAnchorAction(app, item),
            creatRemoveAnchorAction(item, c.collection),
          ];
          const localDuration = ref(item.duration);
          listItem.duration = computed({
            get() {
              return localDuration.value;
            },
            set(value) {
              if (Number.isFinite(value) && value > 0) {
                item.duration = value;
                localDuration.value = value;
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
        collectionComponent.addActions([
          {
            action: flightVis.action,
            owner,
          },
        ]);
      });

      onUnmounted(() => {
        loopChangedListener();
        flightVis?.destroy();
        collectionComponent.destroy();
      });

      const addAnchorAction = createAddAnchorAction(
        app,
        collectionComponent.collection,
      );

      return {
        addAnchorAction,
        title: collectionComponent.title,
        items: collectionComponent.items,
        draggable: collectionComponent.draggable,
        actions: collectionComponent.getActions(),
        move(event) {
          moveItem(collectionComponent, event);
        },
        durationRule,
        showDuration(index) {
          if (collectionComponent.items.value.length - 1 === index) {
            return loop.value;
          }
          return true;
        },
      };
    },
  };
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
