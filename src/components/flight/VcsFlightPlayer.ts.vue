<template>
  <v-container class="py-0 px-1 vcs-flight-player">
    <v-row no-gutters class="d-flex align-center">
      <VcsLabel html-for="player">{{ $st('flight.player') }}</VcsLabel>
      <v-row class="d-flex justify-end px-1 gc-2" no-gutters>
        <VcsActionButtonList
          overflow-icon="$vcsShare"
          :actions="recordingActions"
          :disabled="!isCurrentPlayer || disabled"
        />
      </v-row>
    </v-row>
    <VcsSlider
      v-if="clock"
      type="number"
      :model-value="clock.currentTime"
      @update:model-value="setTime"
      :step="0"
      :min="clock.startTime"
      :max="clock.endTime"
      track-fill-color="primary"
      :disabled="!isCurrentPlayer || disabled"
    />
    <div class="d-flex px-1 align-center justify-space-between">
      <span>{{ clockTime(clock.currentTime) }}</span>
      <VcsButton
        class="d-flex"
        v-for="(btn, index) in actions"
        :key="`${btn.name}-${index}`"
        :tooltip="btn.title"
        :icon="btn.icon"
        :active="btn.active"
        :disabled="btn.disabled || disabled"
        :has-update="btn.hasUpdate"
        :background="btn.background"
        @click.stop="btn.callback($event)"
        v-bind="{ ...$attrs }"
        v-on="btn.listeners ? btn.listeners : {}"
      />
      <span>{{ clockTime(clock.endTime) }}</span>
    </div>
  </v-container>
</template>

<script lang="ts">
  import type { Ref } from 'vue';
  import { defineComponent, inject, onMounted, onUnmounted, ref } from 'vue';
  import { VContainer, VRow } from 'vuetify/components';
  import type { FlightPlayer, FlightPlayerClock } from '@vcmap/core';
  import VcsSlider from '../form-inputs-controls/VcsSlider.ts.vue';
  import VcsLabel from '../form-inputs-controls/VcsLabel.ts.vue';
  import VcsButton from '../buttons/VcsButton.ts.vue';
  import VcsActionButtonList from '../buttons/VcsActionButtonList.ts.vue';
  import {
    createFlightMovieActions,
    createFlightPlayerActions,
  } from '../../actions/flightActions.js';
  import { getProvidedFlightInstance } from './composables.js';
  import type VcsUiApp from '../../vcsUiApp.js';

  type Writable<T> = { -readonly [K in keyof T]: T[K] };
  type FlightClockState = Writable<
    Pick<FlightPlayerClock, 'startTime' | 'endTime' | 'currentTime'>
  >;
  function getDefaultClock(): FlightClockState {
    return { startTime: 0, endTime: 0, currentTime: 0 };
  }

  function syncClocks(
    clock: Ref<FlightClockState>,
    changed: FlightClockState,
  ): void {
    (Object.keys(getDefaultClock()) as Array<keyof FlightClockState>).forEach(
      (key) => {
        if (clock.value[key] !== changed[key]) {
          clock.value[key] = changed[key];
        }
      },
    );
  }

  /**
   * @description A component for editing flight anchors.
   * Requires a flightInstance to be provided via vue-provide.
   */
  export default defineComponent({
    name: 'VcsFlightPlayer',
    components: {
      VContainer,
      VRow,
      VcsActionButtonList,
      VcsButton,
      VcsLabel,
      VcsSlider,
    },
    props: { disabled: { type: Boolean, default: false } },
    setup() {
      const app = inject('vcsApp') as VcsUiApp;
      const flightInstance = getProvidedFlightInstance();
      const clock = ref<FlightClockState>(getDefaultClock());
      const isCurrentPlayer = ref(true);
      let flightInstancePlayer: FlightPlayer | undefined;

      const { actions, destroy } = createFlightPlayerActions(
        app,
        flightInstance,
      );

      let clockChangedListener = (): void => {};
      let playerChangedListener = (): void => {};

      function syncPlayer(player: FlightPlayer | undefined): void {
        if (player?.flightInstanceName === flightInstance.name) {
          isCurrentPlayer.value = true;
          flightInstancePlayer = player;
          syncClocks(clock, player.clock);
          clockChangedListener = player.clock.changed.addEventListener(
            (changed) => {
              syncClocks(clock, changed);
            },
          );
        } else {
          isCurrentPlayer.value = false;
          flightInstancePlayer = undefined;
          clock.value = getDefaultClock();
        }
      }

      const { actions: recordingActions, destroy: destroyRecordingActions } =
        createFlightMovieActions(app, flightInstance);

      onMounted(async () => {
        flightInstancePlayer =
          await app.flights.setPlayerForFlight(flightInstance);
        syncPlayer(flightInstancePlayer);
        syncClocks(clock, flightInstancePlayer!.clock);
        playerChangedListener = app.flights.playerChanged.addEventListener(
          (player) => {
            clockChangedListener();
            syncPlayer(player);
          },
        );
      });

      onUnmounted(() => {
        destroy();
        playerChangedListener();
        destroyRecordingActions();
      });

      return {
        clock,
        actions,
        isCurrentPlayer,
        recordingActions,
        clockTime(seconds: number): string {
          const mins = Math.floor(seconds / 60);
          const secs = Math.floor(seconds % 60);
          return `${mins}:${secs < 10 ? 0 : ''}${secs}`;
        },
        setTime(seconds: number): void {
          clock.value.currentTime = seconds;
          flightInstancePlayer?.goToTime(seconds);
        },
      };
    },
  });
</script>

<style scoped lang="scss"></style>
