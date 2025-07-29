<script setup>
  import { inject, shallowRef, onUnmounted } from 'vue';
  import {
    VcsCheckbox,
    VcsFormSection,
    VcsTextField,
    VcsLabel,
  } from '@vcmap/ui';
  import { VContainer, VRow, VCol } from 'vuetify/components';

  const app = inject('vcsApp');
  /** @type {import("@vcmap/core").PanoramaMap} */
  const map = app.maps.activeMap; // better be a panorama map;

  const image = shallowRef(map.currentPanoramaImage);
  const listener = map.currentImageChanged.addEventListener((newImage) => {
    image.value = newImage;
  });

  onUnmounted(() => {
    listener();
  });
</script>

<template>
  <vcs-form-section heading="Information">
    <v-container class="py-0 px-1">
      <v-row no-gutters>
        <v-col>
          <vcs-label>Image Name</vcs-label>
        </v-col>
        <v-col>
          <vcs-text-field
            readonly
            :disabled="true"
            :model-value="image?.name ?? 'No Image'"
          />
        </v-col>
      </v-row>
      <v-row no-gutters>
        <v-col>
          <vcs-label>Levels</vcs-label>
        </v-col>
        <v-col>
          <vcs-text-field
            readonly
            :disabled="true"
            :model-value="`${image?.minLevel ?? '0'} - ${image?.maxLevel ?? '0'}`"
          />
        </v-col>
      </v-row>
      <v-row no-gutters>
        <v-col>
          <vcs-label>Tile Size</vcs-label>
        </v-col>
        <v-col>
          <vcs-text-field
            readonly
            :disabled="true"
            :model-value="image.tileSize.join(' x ') ?? 'No Tile Size'"
          />
        </v-col>
      </v-row>
      <v-row no-gutters>
        <v-col> <vcs-label>Has Intensity</vcs-label> </v-col>
        <v-col>
          <vcs-checkbox
            :disabled="true"
            :model-value="image?.hasIntensity ?? false"
          />
        </v-col>
      </v-row>
      <v-row no-gutters v-if="image">
        <v-col> <vcs-label>Has Depth</vcs-label> </v-col>
        <v-col>
          <vcs-checkbox
            :disabled="true"
            :model-value="image?.hasDepth ?? false"
          />
        </v-col>
      </v-row>
    </v-container>
  </vcs-form-section>
</template>

<style scoped lang="scss"></style>
