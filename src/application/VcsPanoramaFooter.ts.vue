<script setup lang="ts">
  import { ref, inject, onUnmounted, computed } from 'vue';
  import type { PanoramaImage, VcsMap } from '@vcmap/core';
  import { PanoramaMap } from '@vcmap/core';
  import { useI18n } from 'vue-i18n';
  import type VcsUiApp from '../vcsUiApp.js';

  const app = inject('vcsApp') as VcsUiApp;
  const name = ref<string | undefined>(undefined);
  const currentImageTime = ref<Date | undefined>(undefined);
  const i18n = useI18n();
  const hasLinks = computed(
    () =>
      !!app.uiConfig.config?.dataProtection ||
      !!app.uiConfig.config?.imprint ||
      (app.uiConfig.config?.footerInformation?.length ?? 0) > 0,
  );

  const showPanoramaFooter = computed(
    () => !app.uiConfig.config.hidePanoramaFooter,
  );

  const formattedImageTime = computed(() => {
    if (!currentImageTime.value) {
      return '';
    }
    return new Intl.DateTimeFormat(i18n.locale.value, {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(currentImageTime.value);
  });

  let imageChangedListener: () => void = () => {};
  const setImage = (image?: PanoramaImage): void => {
    if (image) {
      name.value = image.name;
      if (image.time) {
        currentImageTime.value = image.time;
      } else {
        currentImageTime.value = undefined;
      }
    }
  };
  const setMap = (map: VcsMap | null): void => {
    imageChangedListener();
    if (map instanceof PanoramaMap) {
      setImage(map.currentPanoramaImage);
      imageChangedListener = map.currentImageChanged.addEventListener(setImage);
    } else {
      name.value = undefined;
      currentImageTime.value = undefined;
      imageChangedListener = (): void => {};
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
    v-if="showPanoramaFooter && name && currentImageTime"
    class="vcs-panorama-footer"
  >
    <span class="overflow-hidden"> {{ formattedImageTime }} - {{ name }} </span>
    <span v-if="hasLinks" class="ml-1">|</span>
  </span>
</template>

<style scoped lang="scss">
  .vcs-panorama-footer {
    display: flex;
    align-items: center;
    & > span {
      display: inline-flex;
      font-size: smaller !important;
      align-items: center;
    }
  }
</style>
