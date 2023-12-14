<template>
  <v-container class="py-0 px-1">
    <VcsLabel>{{ $t('flight.player') }}</VcsLabel>
    <VcsSlider
      v-if="clock"
      type="number"
      v-model="clock.currentTime"
      @change="setTime"
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
        v-on="{ ...$listeners, ...btn.listeners }"
      />
      <span>{{ clockTime(clock.endTime) }}</span>
    </div>
  </v-container>
</template>
<script>
  import { inject, onMounted, onUnmounted, ref } from 'vue';
  import { VContainer } from 'vuetify/lib';
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

      const playerChangedListener = app.flights.playerChanged.addEventListener(
        (player) => {
          if (player?.flightInstanceName === flightInstance.name) {
            isCurrentPlayer.value = true;
            flightInstancePlayer = player;
            clock.value = player.clock;
          } else {
            isCurrentPlayer.value = false;
            flightInstancePlayer = undefined;
            clock.value = getDefaultClock();
          }
        },
      );

      onMounted(async () => {
        flightInstancePlayer =
          await app.flights.setPlayerForFlight(flightInstance);
        clock.value = flightInstancePlayer.clock;
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
          flightInstancePlayer?.goToTime(seconds);
        },
      };
    },
  };
</script>
<style scoped lang="scss"></style>
