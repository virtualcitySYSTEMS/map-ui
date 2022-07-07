<template>
  <v-card
    class="mx-auto"
    max-width="400"
  >
    <slot name="balloon-header" :attrs="{...$props, ...$attrs}">
      <v-list-item two-line>
        <v-list-item-avatar
          tile
          size="40"
        >
          <v-icon color="primary">
            $vcsInfo
          </v-icon>
        </v-list-item-avatar>
        <v-list-item-content>
          <v-list-item-title class="text-h5">
            {{ title }}
          </v-list-item-title>
          <v-list-item-subtitle>{{ subtitle }}</v-list-item-subtitle>
        </v-list-item-content>
        <VcsButton
          @click.stop="close"
          small
          icon="mdi-close-thick"
          class="mb-8"
        />
      </v-list-item>
    </slot>

    <v-divider />

    <v-card class="overflow-y-auto" max-height="250">
      <slot :attrs="{...$props, ...$attrs}">
        <v-list v-for="(value, name, index) in attributes" :key="`attribute-${index}`">
          <v-list-item>
            <v-list-item-content>
              <v-list-item-title>
                {{ name }}
              </v-list-item-title>
              <v-list-item-subtitle>{{ value }}</v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </slot>
    </v-card>
  </v-card>
</template>
<script>

  import { inject, onMounted, onUnmounted, watch } from 'vue';
  import { setupBalloonPositionListener } from './balloonHelper.js';

  /**
   * @description A balloon viewing feature attributes. Size dynamic dependent on number of attributes.
   * Scrollable, if more than 6 attributes are provided.
   * @vue-prop {string} featureId - feature's id
   * @vue-prop {string} title - balloon title
   * @vue-prop {string} subtitle - balloon subtitle
   * @vue-prop {Object} attributes - feature's attributes
   * @vue-prop {Array<import("ol/coordinate").Coordinate>} position - clicked position balloon is rendered at
   * @vue-data {slot} [#balloon-header] - slot to override balloon header, $props and $attrs are passed to `attrs`
   * @vue-data {slot} [#default] - slot to override balloon content, $props and $attrs are passed to `attrs`
   */
  export default {
    name: 'BalloonComponent',
    props: {
      featureId: {
        type: String,
        required: true,
      },
      title: {
        type: String,
        required: true,
      },
      subtitle: {
        type: String,
        required: true,
      },
      attributes: {
        type: Object,
        required: true,
      },
      position: {
        type: Array,
        required: true,
      },
    },
    setup(props, { attrs }) {
      const app = inject('vcsApp');
      const windowId = attrs['window-state'].id;

      let balloonPositionListener = null;
      const destroyListener = () => {
        if (balloonPositionListener) {
          balloonPositionListener();
        }
      };

      onMounted(async () => {
        balloonPositionListener = await setupBalloonPositionListener(app, windowId, props.position);
      });

      watch(() => props.featureId, async () => {
        destroyListener();
        balloonPositionListener = await setupBalloonPositionListener(app, windowId, props.position);
      });

      onUnmounted(() => {
        destroyListener();
      });

      const close = () => {
        app.windowManager.remove(attrs['window-state'].id);
        destroyListener();
      };

      return {
        close,
      };
    },
  };
</script>

<style>
.balloon:before {
  content: "";
  position: absolute;
  bottom: -20px;
  left: 40px;
  border-width: 20px 20px 0;
  border-style: solid;
  border-color: white transparent;
  display: block;
  width: 0;
}
</style>
