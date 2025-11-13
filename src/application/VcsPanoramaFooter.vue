<script setup>
  import { computed, ref, inject, onUnmounted } from 'vue';
  import { PanoramaMap } from '@vcmap/core';

  const app = inject('vcsApp');
  const name = ref();
  const time = ref();

  const showPanoramaFooter = computed(
    () => !app.uiConfig.config.hidePanoramaFooter,
  );

  let imageChangedListener = () => {};
  const setImage = (image) => {
    if (image) {
      name.value = image.name;
      if (image.time) {
        time.value = new Intl.DateTimeFormat(app.locale, {
          dateStyle: 'short',
          timeStyle: 'short',
        }).format(image.time);
      } else {
        time.value = undefined;
      }
    }
  };
  const setMap = (map) => {
    imageChangedListener();
    if (map instanceof PanoramaMap) {
      setImage(map.currentPanoramaImage);
      imageChangedListener = map.currentImageChanged.addEventListener(setImage);
    } else {
      name.value = undefined;
      time.value = undefined;
      imageChangedListener = () => {};
    }
  };

  const mapChangedListener = app.maps.mapActivated.addEventListener(setMap);
  setMap(app.maps.activeMap);

  onUnmounted(() => {
    imageChangedListener();
    mapChangedListener();
  });
</script>

<template>
  <span
    v-if="showPanoramaFooter && name && time"
    class="d-flex align-center overflow-hidden vcs-panorama-footer"
    >{{ time }} - {{ name }}
  </span>
</template>

<style scoped lang="scss"></style>
