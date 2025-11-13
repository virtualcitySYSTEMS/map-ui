<script setup>
  import { ref, inject, onUnmounted, computed } from 'vue';
  import { PanoramaMap } from '@vcmap/core';

  /** @type {import('../vcsUiApp').default} */
  const app = inject('vcsApp');
  const name = ref();
  const time = ref();
  const hasLinks = computed(
    () =>
      !!app.uiConfig.config?.dataProtection || !!app.uiConfig.config?.imprint,
  );

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
  <span v-if="showPanoramaFooter && name && time" class="vcs-panorama-footer">
    <span class="overflow-hidden"> {{ time }} - {{ name }} </span>
    <span v-if="hasLinks" class="ml-1">|</span>
  </span>
</template>

<style scoped lang="scss">
  .vcs-panorama-footer {
    display: flex;
    align-items: center;
    & > span {
      display: inline-flex;
      font-size: smaller;
      align-items: center;
    }
  }
</style>
