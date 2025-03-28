<template>
  <v-container class="py-0 px-1 vcs-flight-player">
    <VcsLabel html-for="player">{{ $t('flight.player') }}</VcsLabel>
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
<script>
  import { inject, onMounted, onUnmounted, ref } from 'vue';
  import { VContainer } from 'vuetify/components';
  import VcsSlider from '../form-inputs-controls/VcsSlider.vue';
  import VcsLabel from '../form-inputs-controls/VcsLabel.vue';
  import VcsButton from '../buttons/VcsButton.vue';
  import { createFlightPlayerActions } from '../../actions/flightActions.js';
  import { getProvidedFlightInstance } from './composables.js';

  function getDefaultClock() {
    return {
      startTime: 0,
      endTime: 0,
      currentTime: 0,
      times: [],
    };
  }

  /**
   *
   * @param {import("vue").Ref<Partial<import("@vcmap/core").FlightPlayerClock>>} clock
   * @param {import("@vcmap/core").FlightPlayerClock} changed
   */
  function syncClocks(clock, changed) {
    Object.keys(getDefaultClock()).forEach((key) => {
      if (clock.value[key] !== changed[key]) {
        clock.value[key] = changed[key];
      }
    });
  }

  /**
   * @description A component for editing flight anchors.
   * Requires a flightInstance to be provided via vue-provide.
   */
  export default {
    name: 'VcsFlightPlayer',
    components: {
      VcsLabel,
      VcsButton,
      VContainer,
      VcsSlider,
    },
    props: {
      disabled: {
        type: Boolean,
        default: false,
      },
    },
    setup() {
      const app = inject('vcsApp');
      const flightInstance = getProvidedFlightInstance();
      const clock = ref(getDefaultClock());
      const isCurrentPlayer = ref(true);
      let flightInstancePlayer;

      const { actions, destroy } = createFlightPlayerActions(
        app,
        flightInstance,
      );

      let clockChangedListener = () => {};
      let playerChangedListener = () => {};

      function syncPlayer(player) {
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

      onMounted(async () => {
        flightInstancePlayer =
          await app.flights.setPlayerForFlight(flightInstance);
        syncPlayer(flightInstancePlayer);
        syncClocks(clock, flightInstancePlayer.clock);
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
      });

      return {
        clock,
        actions,
        isCurrentPlayer,
        clockTime(seconds) {
          const mins = Math.floor(seconds / 60);
          const secs = Math.floor(seconds % 60);
          return `${mins}:${secs < 10 ? 0 : ''}${secs}`;
        },
        setTime(seconds) {
          clock.value.currentTime = seconds;
          flightInstancePlayer?.goToTime(seconds);
        },
      };
    },
  };
</script>
<style scoped lang="scss"></style>
