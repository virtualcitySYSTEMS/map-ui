<template>
  <span
    class="d-flex gc-2 px-1 h-100 align-center vcs-position-display"
    :class="{ active: positionDisplayAction.active }"
  >
    <VcsButton
      :data-action-name="positionDisplayAction.name"
      :tooltip="positionDisplayAction.title"
      :icon="positionDisplayAction.icon"
      @click.stop="positionDisplayAction.callback($event)"
      :class="{ 'bg-primary': positionDisplayAction.active }"
    >
    </VcsButton>
    <template
      v-if="positionDisplayAction.active && transformedPosition.length > 0"
    >
      <VcsFormattedNumber
        prefix="x:"
        :model-value="transformedPosition[0]"
        :fraction-digits="fractionDigits"
        :number-format-options="{ useGrouping: false }"
        class="pa-0"
      />
      <VcsFormattedNumber
        no-padding
        prefix="y:"
        :model-value="transformedPosition[1]"
        :fraction-digits="fractionDigits"
        :number-format-options="{ useGrouping: false }"
        class="pa-0"
      />
      <VcsFormattedNumber
        v-if="transformedPosition[2]"
        prefix="z:"
        :model-value="transformedPosition[2]"
        :number-format-options="{ useGrouping: false }"
        class="pa-0"
      />
    </template>
    <v-menu v-if="positionDisplayAction.active">
      <template #activator="{ props }">
        <VcsButton
          v-bind="props"
          tooltip="footer.positionDisplay.projection"
          icon="mdi-chevron-down"
          class="bg-primary"
        />
      </template>
      <v-list selectable v-model:selected="selectedEPSG" mandatory>
        <v-list-item
          v-for="(item, i) in items"
          :key="i"
          :value="item.value"
          color="primary"
        >
          <v-list-item-title>{{ $st(item.text) }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </span>
</template>

<script lang="ts">
  import {
    computed,
    defineComponent,
    inject,
    onUnmounted,
    reactive,
    ref,
    shallowRef,
  } from 'vue';
  import type { Projection } from '@vcmap/core';
  import {
    getDefaultProjection,
    mercatorProjection,
    wgs84Projection,
  } from '@vcmap/core';
  import { VMenu, VList, VListItem, VListItemTitle } from 'vuetify/components';
  import type { Coordinate } from 'ol/coordinate.js';
  import type { UiConfigurationItem } from '../uiConfig.js';
  import { isUiConfigurationItem } from '../uiConfig.js';
  import type VcsUiApp from '../vcsUiApp.js';
  import VcsButton from '../components/buttons/VcsButton.ts.vue';
  import VcsFormattedNumber from '../components/form-output/VcsFormattedNumber.ts.vue';
  import PositionDisplayInteraction from './positionDisplayInteraction.js';
  import type { VcsAction } from '../actions/actionHelper.js';

  /**
   * @description Activates an interaction to display the mouse click or mouse move position, depending on the uiConfig property 'positionDisplayEventType'
   * @vue-computed {import("ol").Coordinate} transformedPosition - position in selected projection
   * @vue-computed {number} fractionDigits - number of digits depending on selected projection
   */
  export default defineComponent({
    name: 'VcsPositionDisplay',
    components: {
      VcsFormattedNumber,
      VcsButton,
      VMenu,
      VList,
      VListItem,
      VListItemTitle,
    },
    setup() {
      const app = inject('vcsApp') as VcsUiApp;
      const move =
        app.uiConfig.getByKey('positionDisplayEventType')?.value === 'move';

      const position = shallowRef<Coordinate>([]);

      const interaction = new PositionDisplayInteraction({ position, move });
      app.maps.eventHandler.addPersistentInteraction(interaction);

      const defaultProjection = getDefaultProjection();

      const projections: Record<string, Projection> = {
        [defaultProjection.epsg]: defaultProjection,
        [wgs84Projection.epsg]: wgs84Projection,
      };
      const selectedEPSG = ref([defaultProjection.epsg]);

      function getProjectionItems(): { text: string; value: string }[] {
        return Object.keys(projections).map((epsg) => {
          const options = projections[epsg].toJSON();
          return {
            text: options.alias?.toString() || epsg,
            value: epsg,
          };
        });
      }

      const items = ref(getProjectionItems());

      function setMove(): void {
        interaction.setMove(
          app.uiConfig.getByKey('positionDisplayEventType')?.value === 'move',
        );
      }
      const uiConfigPositionDiplayUpdated = (
        item: UiConfigurationItem<unknown>,
      ): void => {
        if (isUiConfigurationItem(item, 'positionDisplayEventType')) {
          setMove();
        }
      };

      const listener = [
        app.uiConfig.added.addEventListener(uiConfigPositionDiplayUpdated),
        app.uiConfig.removed.addEventListener(uiConfigPositionDiplayUpdated),
        app.moduleAdded.addEventListener(() => {
          const newDefaultProjection = getDefaultProjection();
          projections[newDefaultProjection.epsg] = newDefaultProjection;
          selectedEPSG.value.splice(0, Infinity, newDefaultProjection.epsg);
          items.value = getProjectionItems();
          setMove();
        }),
        app.moduleRemoved.addEventListener(setMove),
      ];

      onUnmounted(() => {
        listener.forEach((cb) => {
          cb();
        });
      });

      const positionDisplayAction = reactive<VcsAction>({
        name: 'position',
        title: 'footer.positionDisplay.title',
        icon: '$vcsAxis',
        active: false,
        callback(): void {
          this.active = !this.active;
          interaction.setActive(this.active);
        },
      });

      const transformedPosition = computed(() => {
        if (position.value.length > 0) {
          return mercatorProjection.transformTo(
            projections[selectedEPSG.value[0]],
            position.value,
          );
        }
        return [];
      });

      const fractionDigits = computed(() => {
        return selectedEPSG.value[0] === wgs84Projection.epsg ? 6 : 2;
      });

      return {
        positionDisplayAction,
        transformedPosition,
        fractionDigits,
        selectedEPSG,
        items,
      };
    },
  });
</script>
<style lang="scss" scoped>
  .active {
    background-color: rgb(var(--v-theme-primary));
    span {
      color: rgb(var(--v-theme-on-primary));
    }
  }
</style>
