<template>
  <BalloonComponent
    v-bind="{ ...$props, ...$attrs }"
    class="address-balloon-component"
  >
    <template #default="{ attrs }">
      <v-list-item
        lines="two"
        v-if="Object.values(attrs.attributes).length > 0"
      >
        <template #prepend>
          <v-icon size="20"> $vcsHomePoint </v-icon>
        </template>

        <v-list-item-title v-if="attrs.attributes.addressName">
          {{ attrs.attributes.addressName }}
        </v-list-item-title>
        <v-list-item-title v-else>
          {{ attrs.attributes.street }} {{ attrs.attributes.number }}
        </v-list-item-title>
        <v-list-item-subtitle v-if="attrs.attributes.name">
          {{ attrs.attributes.street }} {{ attrs.attributes.number }}
        </v-list-item-subtitle>
        <v-list-item-subtitle
          >{{ attrs.attributes.zip }}
          {{ attrs.attributes.city }}</v-list-item-subtitle
        >
        <v-list-item-subtitle>{{
          attrs.attributes.country
        }}</v-list-item-subtitle>
      </v-list-item>
    </template>
  </BalloonComponent>
</template>

<script lang="ts">
  import {
    VIcon,
    VListItem,
    VListItemSubtitle,
    VListItemTitle,
  } from 'vuetify/components';
  import type { Coordinate } from 'ol/coordinate.js';
  import { defineComponent, type PropType } from 'vue';
  import BalloonComponent from './BalloonComponent.ts.vue';
  import type { HTMLTagOptions } from './abstractFeatureInfoView.js';

  /**
   * @description A balloon viewing address information
   */
  export default defineComponent({
    name: 'AddressBalloonComponent',
    components: {
      BalloonComponent,
      VListItem,
      VIcon,
      VListItemTitle,
      VListItemSubtitle,
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
        type: Object as PropType<Record<string, unknown>>,
        required: true,
      },
      tags: {
        type: Object as PropType<HTMLTagOptions>,
        default: undefined,
      },
      position: {
        type: Array as PropType<Coordinate>,
        default: null,
      },
    },
  });
</script>

<style></style>
