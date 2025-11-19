<template>
  <span v-if="content" class="vcs-oblique-footer">
    <!-- eslint-disable vue/no-v-html -->
    <span class="overflow-hidden" v-html="content" />
    <div v-if="hasLinks" class="ml-1">|</div>
  </span>
</template>

<script>
  import { computed, inject, onUnmounted, shallowRef } from 'vue';
  import {
    ObliqueMap,
    ObliqueViewDirection,
    renderTemplate,
  } from '@vcmap/core';
  import { parseAndSanitizeMarkdown } from '../components/form-output/markdownHelper.js';

  const i18nViewDirection = {
    [ObliqueViewDirection.NORTH]: 'footer.oblique.north',
    [ObliqueViewDirection.EAST]: 'footer.oblique.east',
    [ObliqueViewDirection.SOUTH]: 'footer.oblique.south',
    [ObliqueViewDirection.WEST]: 'footer.oblique.west',
    [ObliqueViewDirection.NADIR]: 'footer.oblique.nadir',
  };

  /**
   * @description Renders image information according to configured markdown template
   * @vue-computed {string} content - the derived rendered image information
   */
  export default {
    name: 'VcsObliqueFooter',
    setup() {
      const app = inject('vcsApp');

      /**
       * @returns {import("@vcmap/core").ObliqueImage|null}
       */
      function getImage() {
        const map = app.maps.activeMap;
        if (map instanceof ObliqueMap) {
          return map.currentImage;
        }
        return null;
      }

      /**
       * @param {import("@vcmap/core").ObliqueImage?} image
       * @returns {import("@vcmap/core").ObliqueImage & {viewDirection: string}|null}
       */
      function getTranslatedImageInfo(image) {
        if (image) {
          return {
            ...image,
            viewDirection: app.vueI18n.t(
              i18nViewDirection[image.viewDirection],
            ),
          };
        }
        return null;
      }

      const currentImage = shallowRef(getImage());

      let imageChangedListener = () => {};
      const mapChangedListener = app.maps.mapActivated.addEventListener(
        (map) => {
          imageChangedListener();
          if (map instanceof ObliqueMap) {
            currentImage.value = map.currentImage;
            imageChangedListener = map.imageChanged.addEventListener(
              (image) => {
                currentImage.value = image;
              },
            );
          } else if (currentImage.value) {
            currentImage.value = null;
            imageChangedListener = () => {};
          }
        },
      );

      onUnmounted(() => {
        imageChangedListener();
        mapChangedListener();
      });

      const hasLinks = computed(
        () =>
          !!app.uiConfig.config?.dataProtection ||
          !!app.uiConfig.config?.imprint ||
          app.uiConfig.config?.footerInformation?.length > 0,
      );

      const content = computed(() => {
        if (!app.uiConfig.config.hideObliqueFooter && currentImage.value) {
          const template =
            app.uiConfig.config.obliqueFooterTemplate ??
            'footer.oblique.template';
          return renderTemplate(
            parseAndSanitizeMarkdown(
              app.vueI18n.te(template) ? app.vueI18n.tm(template) : template,
            ),
            getTranslatedImageInfo(currentImage.value),
          );
        }
        return null;
      });

      return {
        content,
        hasLinks,
      };
    },
  };
</script>

<style lang="scss" scoped>
  .vcs-oblique-footer {
    display: flex;
    align-items: center;
    > div {
      font-size: smaller;
    }
    :deep(p) {
      font-size: smaller;
      display: inline;
      margin: 0;
    }
  }
</style>
