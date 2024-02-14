<template>
  <span
    class="d-flex gap-1 px-1"
    :class="{ 'vcs-position-display': positionDisplayAction.active }"
  >
    <VcsButton
      :tooltip="positionDisplayAction.title"
      :icon="positionDisplayAction.icon"
      @click.stop="positionDisplayAction.callback($event)"
      :custom-classes="customClasses"
    >
    </VcsButton>
    <template
      v-if="positionDisplayAction.active && transformedPosition.length > 0"
    >
      <VcsFormattedNumber
        prefix="x:"
        :value="transformedPosition[0]"
        :fraction-digits="fractionDigits"
      />
      <VcsFormattedNumber
        no-padding
        prefix="y:"
        :value="transformedPosition[1]"
        :fraction-digits="fractionDigits"
      />
      <VcsFormattedNumber
        v-if="transformedPosition[2]"
        prefix="z:"
        :value="transformedPosition[2]"
      />
    </template>
    <v-menu
      :nudge-top="46"
      :nudge-left="80"
      v-if="positionDisplayAction.active"
    >
      <template #activator="{ on, attrs }">
        <VcsButton
          v-bind="attrs"
          v-on="on"
          tooltip="footer.positionDisplay.projection"
          icon="mdi-chevron-down"
          :custom-classes="customClasses"
        />
      </template>
      <v-list dense>
        <v-list-item-group v-model="selectedEPSG" color="primary" mandatory>
          <v-list-item v-for="(item, i) in items" :key="i" :value="item.value">
            <v-list-item-content>
              <v-list-item-title>{{ $t(item.text) }}</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list-item-group>
      </v-list>
    </v-menu>
  </span>
</template>

<style lang="scss" scoped>
  @import '../styles/shades.scss';

  .vcs-position-display {
    height: 22px;
    background-color: var(--v-primary-base);
    span {
      color: map-get($shades, 'white');
    }

    ::v-deep {
      .vcs-formatted-number,
      .vcs-formatted-number span {
        font-size: unset;
        line-height: unset;
      }
      .vcs-formatted-number-dense {
        line-height: unset;
      }
    }
  }
</style>
<script>
  import { computed, inject, onUnmounted, reactive, ref } from 'vue';
  import {
    getDefaultProjection,
    mercatorProjection,
    wgs84Projection,
  } from '@vcmap/core';
  import {
    VMenu,
    VList,
    VListItemGroup,
    VListItem,
    VListItemContent,
    VListItemTitle,
  } from 'vuetify/lib';
  import VcsButton from '../components/buttons/VcsButton.vue';
  import VcsFormattedNumber from '../components/form-output/VcsFormattedNumber.vue';
  import PositionDisplayInteraction from './positionDisplayInteraction.js';

  /**
   * @description Activates an interaction to display the mouse click or mouse move position, depending on the uiConfig property 'positionDisplayEventType'
   * @vue-computed {string[]} customClasses - changes button color depending on state
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
      VListItemGroup,
      VListItem,
      VListItemContent,
      VListItemTitle,
    },
    setup() {
      const app = inject('vcsApp');
      const move =
        app.uiConfig.getByKey('positionDisplayEventType')?.value === 'move';

      const position = ref([]);

      const interaction = new PositionDisplayInteraction({ position, move });
      app.maps.eventHandler.addPersistentInteraction(interaction);

      const defaultProjection = getDefaultProjection();

      const projections = {
        [defaultProjection.epsg]: defaultProjection,
        [wgs84Projection.epsg]: wgs84Projection,
      };
      const selectedEPSG = ref(defaultProjection.epsg);

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
          selectedEPSG.value = newDefaultProjection.epsg;
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

      const customClasses = computed(() => {
        return positionDisplayAction.active ? ['primary'] : [];
      });

      const transformedPosition = computed(() => {
        if (position.value.length > 0) {
          return mercatorProjection.transformTo(
            projections[selectedEPSG.value],
            position.value,
          );
        }
        return [];
      });

      const fractionDigits = computed(() => {
        return selectedEPSG.value === wgs84Projection.epsg ? 6 : 2;
      });

      return {
        positionDisplayAction,
        transformedPosition,
        fractionDigits,
        selectedEPSG,
        items,
        customClasses,
      };
    },
  };
</script>
