<template>
  <BalloonComponent v-bind="{ ...$attrs }">
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
<script>
  import {
    VIcon,
    VListItem,
    VListItemSubtitle,
    VListItemTitle,
  } from 'vuetify/components';
  import BalloonComponent from './BalloonComponent.vue';

  /**
   * @description A balloon viewing address information
   */
  export default {
    name: 'AddressBalloonComponent',
    components: {
      BalloonComponent,
      VListItem,
      VIcon,
      VListItemTitle,
      VListItemSubtitle,
    },
  };
</script>

<style></style>
