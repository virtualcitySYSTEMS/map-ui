<template>
  <div class="vcs-point-input-editor">
    <v-row no-gutters>
      <v-col>
        <VcsLabel html-for="posX">
          {{ $t('components.editor.position.x') }}
        </VcsLabel>
      </v-col>
      <v-col>
        <VcsTextField
          id="posX"
          type="number"
          v-model.number="coordinates[0]"
          @update:model-value="isEdited = true"
        />
      </v-col>
    </v-row>
    <v-row no-gutters>
      <v-col>
        <VcsLabel html-for="posY">
          {{ $t('components.editor.position.y') }}
        </VcsLabel>
      </v-col>
      <v-col>
        <VcsTextField
          id="posY"
          type="number"
          v-model.number="coordinates[1]"
          @update:model-value="isEdited = true"
        />
      </v-col>
    </v-row>
    <v-row no-gutters v-if="is3D">
      <v-col>
        <VcsLabel html-for="posZ">
          {{ $t('components.editor.position.z') }}
        </VcsLabel>
      </v-col>
      <v-col>
        <VcsTextField
          id="posZ"
          type="number"
          v-model.number="coordinates[2]"
          @update:model-value="isEdited = true"
        />
      </v-col>
    </v-row>
    <v-row no-gutters v-if="isEdited" class="d-flex justify-end gc-1">
      <VcsToolButton @click="cancel">
        {{ $t('components.cancel') }}
      </VcsToolButton>
      <VcsToolButton @click="apply">
        {{ $t('components.apply') }}
      </VcsToolButton>
    </v-row>
  </div>
</template>

<script>
  import { VCol, VRow } from 'vuetify/components';
  import { inject, onUnmounted, ref } from 'vue';
  import {
    getDefaultProjection,
    mercatorProjection,
    Projection,
  } from '@vcmap/core';
  import { getLogger } from '@vcsuite/logger';
  import VcsLabel from '../form-inputs-controls/VcsLabel.vue';
  import VcsTextField from '../form-inputs-controls/VcsTextField.vue';
  import VcsToolButton from '../buttons/VcsToolButton.vue';

  /**
   * @description Component to edit the position of a feature in a vector layer. Currently
   * only supports point features, which need to be the currently selected feature in the manager.
   * @vue-prop {boolean} is3D - Whether the feature is in 3D.
   */
  export default {
    name: 'VcsFeatureEditingWindow',
    components: {
      VCol,
      VRow,
      VcsLabel,
      VcsTextField,
      VcsToolButton,
    },
    props: {
      is3D: {
        type: Boolean,
        required: true,
      },
    },
    setup() {
      const { currentFeatures: features } = inject('manager');

      if (
        features.value.length !== 1 ||
        features.value[0]?.getGeometry()?.getType() !== 'Point'
      ) {
        getLogger('VcsFeatureEditingWindow').error(
          'This component only supports editing a single point feature.',
        );
      }

      const isEdited = ref(false);
      /** @type {import("ol").Feature} */
      const feature = features.value[0];
      const defaultProjection = getDefaultProjection();
      const decimalPlaces = defaultProjection.epsg.includes('4326') ? 6 : 2;

      function transform(coordinates) {
        return mercatorProjection
          .transformTo(defaultProjection, coordinates)
          .map((c, i) => +c.toFixed(i === 2 ? 2 : decimalPlaces));
      }
      const coordinates = ref(
        transform(feature.getGeometry().getFlatCoordinates()),
      );

      function updateFromFeature() {
        coordinates.value = transform(
          feature.getGeometry().getFlatCoordinates(),
        );
      }
      feature.on('change', updateFromFeature);
      onUnmounted(() => {
        feature.un('change', updateFromFeature);
      });

      function updateFromInput() {
        let updatedCoordinates;
        try {
          updatedCoordinates = Projection.transform(
            mercatorProjection,
            defaultProjection,
            coordinates.value,
          );
          feature.getGeometry().setCoordinates(updatedCoordinates);
        } catch (error) {
          getLogger('VcsFeatureEditingWindow').error(
            'Invalid coordinates input',
            error,
          );
        }
      }

      return {
        isEdited,
        coordinates,
        apply: () => {
          updateFromInput();
          isEdited.value = false;
        },
        cancel: () => {
          updateFromFeature();
          isEdited.value = false;
        },
      };
    },
  };
</script>

<style scoped>
  :deep(.v-btn__content):hover {
    color: rgb(var(--v-theme-primary));
  }
</style>
