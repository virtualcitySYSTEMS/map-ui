<template>
  <v-sheet>
    <VcsFormSection
      :heading="heading"
      :expandable="expandable"
      start-open
      v-if="
        !(
          hideGeneral ||
          (hideName &&
            hideTitle &&
            hideInterpolation &&
            hideDuration &&
            hideLoop)
        )
      "
    >
      <v-container class="py-0 px-1">
        <v-row no-gutters v-if="!hideName">
          <v-col cols="6">
            <VcsLabel html-for="name" dense required>
              {{ $t('components.flight.name') }}
            </VcsLabel>
          </v-col>
          <v-col>
            <VcsTextField id="name" dense clearable v-model="name" />
          </v-col>
        </v-row>
        <v-row no-gutters v-if="!hideTitle">
          <v-col cols="6">
            <VcsLabel html-for="title" dense>
              {{ $t('components.flight.title') }}
            </VcsLabel>
          </v-col>
          <v-col>
            <VcsTextField
              id="title"
              dense
              clearable
              :placeholder="$t('components.flight.titlePlaceholder')"
              v-model="title"
            />
          </v-col>
        </v-row>
        <v-row no-gutters v-if="!hideInterpolation">
          <v-col cols="6">
            <VcsLabel html-for="interpolation" dense>
              {{ $t('components.flight.interpolation') }}
            </VcsLabel>
          </v-col>
          <v-col>
            <VcsSelect
              id="title"
              dense
              :items="[
                { value: 'spline', text: 'components.flight.spline' },
                { value: 'linear', text: 'components.flight.linear' },
              ]"
              v-model="interpolation"
            />
          </v-col>
        </v-row>
        <v-row no-gutters v-if="!hideDuration">
          <v-col cols="6">
            <VcsLabel html-for="duration" dense>
              {{ $t('components.flight.duration') }}
            </VcsLabel>
          </v-col>
          <v-col>
            <VcsTextField
              id="duration"
              v-model.number="duration"
              type="number"
              unit="s"
              step="1"
              :decimals="2"
              :rules="[durationRule]"
            />
          </v-col>
        </v-row>
        <v-row no-gutters v-if="!hideLoop">
          <v-col cols="6">
            <VcsCheckbox
              id="animate"
              label="components.flight.loop"
              dense
              v-model="loop"
            />
          </v-col>
        </v-row>
      </v-container>
    </VcsFormSection>
    <VcsFlightAnchorsComponent
      :parent-id="parentId"
      :owner="owner"
      :expandable="expandable"
    />
    <v-divider class="mt-4" />
    <VcsFlightPlayer :disabled="disablePlayer" />
  </v-sheet>
</template>

<script>
  import { computed, onUnmounted, ref, inject } from 'vue';
  import { VSheet, VContainer, VRow, VCol, VDivider } from 'vuetify/lib';
  import { getSplineAndTimesForInstance } from '@vcmap/core';
  import VcsFormSection from '../form-inputs-controls/VcsFormSection.vue';
  import VcsLabel from '../form-inputs-controls/VcsLabel.vue';
  import VcsTextField from '../form-inputs-controls/VcsTextField.vue';
  import VcsSelect from '../form-inputs-controls/VcsSelect.vue';
  import VcsCheckbox from '../form-inputs-controls/VcsCheckbox.vue';
  import VcsFlightAnchorsComponent, {
    durationRule,
  } from './VcsFlightAnchorsComponent.vue';
  import VcsFlightPlayer from './VcsFlightPlayer.vue';
  import { vcsAppSymbol } from '../../pluginHelper.js';
  import {
    getProvidedFlightInstance,
    setupFlightAnchorEditingListener,
  } from './composables.js';

  /**
   * @param {import("@vcmap/core").FlightInstance} instance
   * @returns {number}
   */
  function getFlightDuration(instance) {
    if (instance.isValid()) {
      const { times } = getSplineAndTimesForInstance(instance);
      return times.at(-1);
    }
    return 0;
  }

  /**
   * @description A component to model @vcmap/core/FlightInstanceOptions.
   * Requires a flightInstance to be provided via vue-provide.
   * If a reset functionality is required use shallowRef to provide the flightInstance.
   * @vue-prop {string} heading - Title of flight settings.
   * @vue-prop {boolean} [expandable] - Expandable sections.
   * @vue-prop {boolean} hideName - Hide name input.
   * @vue-prop {boolean} hideTitle - Hide title input.
   * @vue-prop {boolean} hideInterpolation - Hide select interpolation input.
   * @vue-prop {boolean} hideLoop - Hide loop input.
   * @vue-prop {boolean} hideGeneral - Hide all general settings (name, title, animate).
   * @vue-prop {string} [parentId] - id of the window, the VcsFlightComponent is used in
   * @vue-prop {string} [owner] - owner of the window, e.g. a plugin name
   */
  export default {
    name: 'VcsFlightComponent',
    components: {
      VcsFlightPlayer,
      VcsFlightAnchorsComponent,
      VSheet,
      VContainer,
      VRow,
      VCol,
      VDivider,
      VcsFormSection,
      VcsLabel,
      VcsTextField,
      VcsSelect,
      VcsCheckbox,
    },
    props: {
      heading: {
        type: String,
        default: 'components.flight.general',
      },
      expandable: {
        type: Boolean,
        default: false,
      },
      hideName: {
        type: Boolean,
        default: false,
      },
      hideTitle: {
        type: Boolean,
        default: false,
      },
      hideInterpolation: {
        type: Boolean,
        default: false,
      },
      hideDuration: {
        type: Boolean,
        default: false,
      },
      hideLoop: {
        type: Boolean,
        default: false,
      },
      hideGeneral: {
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
    setup() {
      const app = inject('vcsApp');
      const flightInstance = getProvidedFlightInstance();
      const flightDuration = ref(getFlightDuration(flightInstance));
      const disablePlayer = ref(!(flightDuration.value > 0));
      const flightDurationListener = [
        flightInstance.anchorsChanged.addEventListener(() => {
          flightDuration.value = getFlightDuration(flightInstance);
          disablePlayer.value = !(flightDuration.value > 0);
        }),
        flightInstance.propertyChanged.addEventListener((prop) => {
          if (prop === 'loop') {
            flightDuration.value = getFlightDuration(flightInstance);
          }
        }),
      ];
      const editingListener = setupFlightAnchorEditingListener(
        app.windowManager,
        disablePlayer,
      );

      onUnmounted(() => {
        flightDurationListener.forEach((cb) => cb());
        editingListener();
      });

      return {
        name: flightInstance.name,
        title: computed({
          get() {
            return flightInstance?.properties?.title;
          },
          set(value) {
            if (flightInstance.properties) {
              flightInstance.properties.title = value;
            } else {
              flightInstance.properties = { title: value };
            }
          },
        }),
        interpolation: computed({
          get() {
            return flightInstance?.interpolation;
          },
          set(value) {
            flightInstance.interpolation = value;
          },
        }),
        duration: computed({
          get() {
            return flightDuration.value;
          },
          set(value) {
            if (
              Number.isFinite(value) &&
              value > 0 &&
              flightDuration.value > 0
            ) {
              const factor = value / flightDuration.value;
              [...flightInstance.anchors].forEach((anchor) => {
                anchor.duration *= factor;
              });
            }
          },
        }),
        durationRule,
        loop: computed({
          get() {
            return flightInstance?.loop;
          },
          set(value) {
            flightInstance.loop = !!value;
          },
        }),
        disablePlayer,
      };
    },
  };
</script>
