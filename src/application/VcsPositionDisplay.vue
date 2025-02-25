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

<style lang="scss" scoped>
  .active {
    background-color: rgb(var(--v-theme-primary));
    span {
      color: rgb(var(--v-theme-on-primary));
    }
  }
</style>
<script>
  import {
    computed,
    inject,
    onUnmounted,
    reactive,
    ref,
    shallowRef,
  } from 'vue';
  import {
    getDefaultProjection,
    mercatorProjection,
    wgs84Projection,
  } from '@vcmap/core';
  import { VMenu, VList, VListItem, VListItemTitle } from 'vuetify/components';
  import VcsButton from '../components/buttons/VcsButton.vue';
  import VcsFormattedNumber from '../components/form-output/VcsFormattedNumber.vue';
  import PositionDisplayInteraction from './positionDisplayInteraction.js';

  /**
   * @description Activates an interaction to display the mouse click or mouse move position, depending on the uiConfig property 'positionDisplayEventType'
   * @vue-computed {import("ol").Coordinate} transformedPosition - position in selected projection
   * @vue-computed {number} fractionDigits - number of digits depending on selected projection
   */
  export default {
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
      const app = inject('vcsApp');
      const move =
        app.uiConfig.getByKey('positionDisplayEventType')?.value === 'move';

      const position = shallowRef([]);

      const interaction = new PositionDisplayInteraction({ position, move });
      app.maps.eventHandler.addPersistentInteraction(interaction);

      const defaultProjection = getDefaultProjection();

      const projections = {
        [defaultProjection.epsg]: defaultProjection,
        [wgs84Projection.epsg]: wgs84Projection,
      };
      const selectedEPSG = ref([defaultProjection.epsg]);

      function getProjectionItems() {
        return Object.keys(projections).map((epsg) => {
          return {
            text: projections[epsg].alias || epsg,
            value: epsg,
          };
        });
      }

      const items = ref(getProjectionItems());

      function setMove() {
        interaction.setMove(
          app.uiConfig.getByKey('positionDisplayEventType')?.value === 'move',
        );
      }

      const listener = [
        app.uiConfig.added.addEventListener((added) => {
          if (added.name === 'positionDisplayEventType') {
            setMove();
          }
        }),
        app.uiConfig.removed.addEventListener((added) => {
          if (added.name === 'positionDisplayEventType') {
            setMove();
          }
        }),
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
        listener.forEach((cb) => cb());
      });

      const positionDisplayAction = reactive({
        name: 'position',
        title: 'footer.positionDisplay.title',
        icon: '$vcsAxis',
        active: false,
        callback() {
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
  };
</script>
