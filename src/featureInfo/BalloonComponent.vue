<template>
  <v-card class="mx-auto elevation-0" v-if="position">
    <slot name="balloon-header" :attrs="{ ...$props, ...$attrs }">
      <v-list-item class="px-2 align-center">
        <v-list-item-avatar tile size="16" class="mr-2">
          <v-icon color="primary"> $vcsInfo </v-icon>
        </v-list-item-avatar>
        <v-list-item-content class="pr-1">
          <v-list-item-title>
            <h3 class="font-weight-bold">
              {{ $t(balloonTitle) }}
            </h3>
          </v-list-item-title>
          <v-list-item-subtitle v-if="balloonSubtitle">
            {{ $t(balloonSubtitle) }}
          </v-list-item-subtitle>
        </v-list-item-content>
        <VcsButton
          @click.stop="close"
          icon="mdi-close-thick"
          tooltip="components.close"
          class="d-flex"
        />
      </v-list-item>
    </slot>

    <v-divider />

    <v-card
      class="overflow-y-auto py-2 elevation-0"
      :max-height="maxHeight"
      color="transparent"
    >
      <slot :attrs="{ ...$props, ...$attrs }">
        <v-list
          v-for="(value, key, index) in attributes"
          :key="`attribute-${index}`"
          color="transparent"
        >
          <v-list-item class="px-2">
            <v-list-item-content>
              <v-list-item-title>
                {{ $t(key) }}
              </v-list-item-title>
              <v-list-item-subtitle
                :tag="getTag(tags, key)"
                v-bind="getTagOptions(tags, key)"
              >
                {{ typeof value === 'string' ? $t(value) : value }}
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </slot>
    </v-card>
  </v-card>
</template>
<script>
  import { inject, onMounted, onUnmounted, ref, watch } from 'vue';
  import {
    VCard,
    VDivider,
    VIcon,
    VList,
    VListItem,
    VListItemAvatar,
    VListItemContent,
    VListItemSubtitle,
    VListItemTitle,
  } from 'vuetify/lib';
  import {
    getTargetSize,
    posToNumber,
  } from '../manager/window/windowHelper.js';
  import { setupBalloonPositionListener } from './balloonHelper.js';
  import VcsButton from '../components/buttons/VcsButton.vue';
  import { getTag, getTagOptions } from '../components/tables/VcsTable.vue';

  /**
   * @description A balloon viewing feature attributes. Size dynamic dependent on number of attributes.
   * Scrollable, if more than 6 attributes are provided.
   * @vue-prop {string} featureId - feature's id
   * @vue-prop {string} balloonTitle - balloon title
   * @vue-prop {string} balloonSubtitle - balloon subtitle
   * @vue-prop {Object} attributes - feature's attributes
   * @vue-prop {Object} tags - optional object containing keys rendered as tags
   * @vue-prop {Array<import("ol/coordinate").Coordinate>} position - clicked position balloon is rendered at
   * @vue-data {slot} [#balloon-header] - slot to override balloon header, $props and $attrs are passed to `attrs`
   * @vue-data {slot} [#default] - slot to override balloon content, $props and $attrs are passed to `attrs`
   */
  export default {
    name: 'BalloonComponent',
    components: {
      VcsButton,
      VCard,
      VList,
      VListItem,
      VListItemAvatar,
      VIcon,
      VListItemContent,
      VListItemTitle,
      VListItemSubtitle,
      VDivider,
    },
    props: {
      featureId: {
        type: String,
        required: true,
      },
      balloonTitle: {
        type: String,
        required: true,
      },
      balloonSubtitle: {
        type: String,
        required: true,
      },
      attributes: {
        type: Object,
        required: true,
      },
      tags: {
        type: Object,
        default: undefined,
      },
      position: {
        type: Array,
        default: null,
      },
    },
    setup(props, { attrs }) {
      const app = inject('vcsApp');
      const windowId = attrs['window-state'].id;
      function getMaxHeight() {
        if (app.windowManager.get(windowId)?.position?.maxHeight) {
          return (
            posToNumber(
              app.windowManager.get(windowId).position.maxHeight,
              'maxHeight',
              getTargetSize(app.maps.target),
            ) - 49 // 44px header offset with padding 5px
          );
        }
        if (app.windowManager.get(windowId)?.position?.height) {
          return (
            posToNumber(
              app.windowManager.get(windowId).position.height,
              'height',
              getTargetSize(app.maps.target),
            ) - 49 // 44px header offset with padding 5px
          );
        }
        return 250;
      }
      const maxHeight = ref(getMaxHeight());

      let balloonPositionListener = null;
      const destroyListener = () => {
        if (balloonPositionListener) {
          balloonPositionListener();
        }
      };

      onMounted(async () => {
        balloonPositionListener = await setupBalloonPositionListener(
          app,
          windowId,
          props.position,
        );
      });

      watch(
        () => props.featureId,
        async () => {
          destroyListener();
          balloonPositionListener = await setupBalloonPositionListener(
            app,
            windowId,
            props.position,
          );
          maxHeight.value = getMaxHeight();
        },
      );

      onUnmounted(() => {
        destroyListener();
      });

      const close = () => {
        app.windowManager.remove(attrs['window-state'].id);
        destroyListener();
      };

      return {
        close,
        getTag,
        getTagOptions,
        maxHeight,
      };
    },
  };
</script>

<style lang="scss">
  @import '../styles/shades.scss';

  .balloon {
    z-index: 0 !important;
  }
  .balloon hr:first-child {
    display: none;
  }
  .balloon:after {
    content: '';
    position: absolute;
    bottom: -12px;
    left: 40px;
    border-width: 12px 10px 0;
    border-style: solid;
    display: block;
    width: 0;
    filter: drop-shadow(1px 2px 1px rgba(0, 0, 0, 0.3));
  }
  .theme--light .balloon:after {
    border-color: map-get($shades, 'white') transparent;
  }
  .theme--dark .balloon:after {
    border-color: map-get($shades, 'black') transparent;
  }
  .balloon .v-list-item .v-list-item__title,
  .balloon .v-list-item .v-list-item__subtitle {
    line-height: 18px;
  }
</style>
