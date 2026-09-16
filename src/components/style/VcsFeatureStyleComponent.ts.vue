<template>
  <VcsVectorStyleComponent
    class="vcs-feature-style-component"
    :model-value="styleOptions"
    @update:fill="updateFill"
    @update:stroke="updateStroke"
    @update:image="updateImage"
    @update:text="updateText"
    :style-components="styleComponents"
    :value-default="valueDefault"
  />
</template>

<script lang="ts">
  import type {
    VectorLayer,
    VectorStyleItemOptions,
    VectorStyleItemText,
    VectorStyleItemImage,
    VectorPropertiesOptions,
  } from '@vcmap/core';
  import {
    GeometryType,
    highlighted,
    originalStyle,
    parseColor,
    getDefaultVectorStyleItemOptions,
    getImageStyleOptions,
    getTextOptions,
    getImageStyleFromOptions,
    getTextFromOptions,
    vectorStyleSymbol,
    VectorStyleItem,
    getStyleOptions,
  } from '@vcmap/core';
  import type { PropType, Ref } from 'vue';
  import { defineComponent, inject, onUnmounted, ref, watch } from 'vue';
  import { Fill, Stroke, Style } from 'ol/style.js';
  import type { Options as ImageOptions } from 'ol/style/Image.js';
  import type Feature from 'ol/Feature.js';
  import type { Color } from 'ol/color.js';
  import deepEqual from 'fast-deep-equal';
  import VcsVectorStyleComponent from './VcsVectorStyleComponent.ts.vue';
  import { VectorStyleMenus } from './composables.js';
  import type { EditorManager } from '../vector-properties/vectorPropertiesHelper.js';

  /**
   * Determines the style that is applied to a feature, either from the layer or directly set on the feature. Does not return the highlight style.
   * @param feature The feature for which the style should be determined
   * @param layer The features layer.
   * @returns Either a reference to the features style or a clone of the layers style.
   */
  function getFeatureStyle(feature: Feature, layer: VectorLayer): Style {
    const layerStyle = (layer.style.style as Style).clone();
    let featureStyle: Style | undefined;
    if (feature[highlighted]) {
      featureStyle = feature[originalStyle] as Style;
    } else {
      featureStyle = feature.getStyle() as Style;
    }
    return featureStyle || layerStyle;
  }

  /**
   * Sets the style for a highlighted feature
   * @param feature The feature to set the style on
   * @param style The style to set on the feature
   */
  function setFeatureStyle(feature: Feature, style: Style): void {
    feature.setStyle(style);
    feature[originalStyle] = style;
    const styleOptions = getStyleOptions(style) as VectorStyleItemOptions;
    feature[vectorStyleSymbol] = new VectorStyleItem(styleOptions);
  }

  function getStyleComponentsForFeature(
    feature: Feature,
    featureProperties: VectorPropertiesOptions,
  ): VectorStyleMenus[] {
    const type = feature.getGeometry()?.getType?.();
    const components = [];

    if (type === GeometryType.Point) {
      components.push(VectorStyleMenus.IMAGE);
      components.push(VectorStyleMenus.TEXT);
      if (featureProperties.extrudedHeight) {
        components.push(VectorStyleMenus.STROKE);
      }
    } else if (type === GeometryType.LineString) {
      components.push(VectorStyleMenus.STROKE);
      if (featureProperties.extrudedHeight) {
        components.push(VectorStyleMenus.FILL);
      }
    } else if (type === GeometryType.Polygon || type === GeometryType.Circle) {
      components.push(VectorStyleMenus.STROKE, VectorStyleMenus.FILL);
    }

    return components;
  }

  function getComponentsForFeatures(
    features: Feature[],
    featureProperties: VectorPropertiesOptions,
  ): VectorStyleMenus[] {
    const components = features
      .map((feature) =>
        getStyleComponentsForFeature(feature, featureProperties),
      )
      .filter((c) => c.length > 0);

    if (components.length === 0) {
      return [];
    }

    return (
      Object.values(VectorStyleMenus)
        // only add those style components, that are shared by all features
        .filter((id) =>
          components.every((c) => c.length === 0 || c.includes(id)),
        )
    );
  }

  function olColorEqual(c1: Color, c2: Color): boolean {
    return (
      c1[0] === c2[0] && c1[1] === c2[1] && c1[2] === c2[2] && c1[3] === c2[3]
    );
  }

  function isSameStyle(shape1: unknown, shape2: unknown): boolean {
    return deepEqual(shape1, shape2);
  }

  /**
   * @param styles - Style for each feature
   */
  function setStyleOptions(
    styles: Style[],
    componentId: VectorStyleMenus,
    styleOptions: VectorStyleItemOptions,
  ): void {
    if (componentId === VectorStyleMenus.FILL) {
      // checks if there is a fill style and that all fill styles are equal. Otherwise return null.
      styleOptions.fill =
        styles.reduce<{ color: Color } | null | undefined>((prev, style) => {
          if (prev === null) {
            return null;
          }
          const currentColor = style?.getFill()?.getColor();
          if (!currentColor) {
            return null;
          }
          const parsedColor = parseColor(currentColor as Color);
          if (prev === undefined) {
            return { color: parsedColor };
          }
          return olColorEqual(parsedColor, prev.color)
            ? { color: parsedColor }
            : null;
        }, undefined) ?? undefined;
    } else if (componentId === VectorStyleMenus.STROKE) {
      // checks if there is a stroke style and that all stoke styles are equal. Otherwise return null.
      styleOptions.stroke =
        styles.reduce<{ color: Color; width?: number } | null | undefined>(
          (prev, style) => {
            if (prev === null) {
              return null;
            }

            const currentColor = style?.getStroke()?.getColor();
            if (!currentColor) {
              return null;
            }
            const parsedColor = parseColor(currentColor);
            if (prev && !olColorEqual(parsedColor, prev.color)) {
              return null;
            }
            const width = style?.getStroke()?.getWidth();
            if (prev && prev.width !== width) {
              return null;
            }

            return {
              color: parsedColor,
              width,
            };
          },
          undefined,
        ) ?? undefined;
    } else if (componentId === VectorStyleMenus.IMAGE) {
      styleOptions.image =
        styles.reduce<VectorStyleItemImage | null | undefined>(
          (prev, style) => {
            if (prev === null) {
              return null;
            }
            let current;

            const image = style.getImage();
            if (image) {
              current = getImageStyleOptions(image);
            }

            if (!current || (prev && !isSameStyle(prev, current))) {
              return null;
            }
            return current;
          },
          undefined,
        ) ?? undefined;
    } else if (componentId === VectorStyleMenus.TEXT) {
      styleOptions.text =
        styles.reduce<VectorStyleItemText | null | undefined>((prev, style) => {
          if (prev === null) {
            return null;
          }
          let current;

          const text = style.getText();
          if (text) {
            current = getTextOptions(text);
          }

          if (!current || !current.text) {
            return null;
          } else if (prev && !isSameStyle(prev, current)) {
            return null;
          }
          return current;
        }, undefined) ?? undefined;
    }
  }

  /**
   * A style component to render the style options of an editor managers features. Must have a manager provided.
   * @vue-prop {import("@vcmap/core").VectorPropertiesOptions} featureProperties - JSON representation of a vector properties object.
   */
  export default defineComponent({
    name: 'VcsFeatureStyleComponent',
    components: { VcsVectorStyleComponent },
    props: {
      featureProperties: {
        type: Object as PropType<VectorPropertiesOptions>,
        required: true,
      },
    },
    setup(props) {
      const manager = inject('manager') as EditorManager;

      const styleComponents = ref<VectorStyleMenus[]>([]);
      const styleOptions: Ref<VectorStyleItemOptions> = ref({
        fill: undefined,
        stroke: undefined,
        image: undefined,
        text: undefined,
      });

      const setComponents = (): void => {
        styleOptions.value = {
          fill: undefined,
          stroke: undefined,
          image: undefined,
          text: undefined,
        };
        if (
          manager.currentFeatures.value.length > 0 &&
          manager.currentLayer.value
        ) {
          const currentLayer = manager.currentLayer.value;
          styleComponents.value = getComponentsForFeatures(
            manager.currentFeatures.value,
            props.featureProperties,
          );
          if (styleComponents.value.length > 0) {
            const styles = manager.currentFeatures.value
              .map((feature) => {
                const layerStyle = (currentLayer.style.style as Style).clone();
                let featureStyle: Style | undefined;
                // not using f.getStyle because this would return the highlighted style (since its already highlighted).
                if (feature[highlighted]) {
                  featureStyle =
                    feature[originalStyle] instanceof Style
                      ? feature[originalStyle]
                      : layerStyle;
                } else {
                  const style = feature.getStyle();
                  featureStyle = style instanceof Style ? style : layerStyle;
                }
                return featureStyle;
              })
              .filter((style) => style instanceof Style);
            styleComponents.value.forEach((componentId) => {
              setStyleOptions(styles, componentId, styleOptions.value);
            });
          }
        } else {
          styleComponents.value = [];
        }
      };

      let layerListeners = (): void => {};
      const setupLayer = (): void => {
        layerListeners();
        if (manager.currentLayer.value) {
          const currentLayer = manager.currentLayer.value;
          const vectorPropertiesListener =
            currentLayer.vectorProperties.propertyChanged.addEventListener(
              setComponents,
            );
          const styleListener =
            currentLayer.styleChanged.addEventListener(setComponents);
          setComponents();
          layerListeners = (): void => {
            vectorPropertiesListener();
            styleListener();
          };
        }
      };
      const featuresWatcher = watch(manager.currentFeatures, setComponents);
      const parametersWatcher = watch(
        () => props.featureProperties.extrudedHeight,
        (curr, prev) => {
          // only if extruded height is either added or removed from point or linestring, since this adds/reomves stroke and fill style components respectively.
          if (
            !!prev !== !!curr &&
            manager.currentFeatures.value.some((f) => {
              const type = f.getGeometry()?.getType();
              return (
                type === GeometryType.Point || type === GeometryType.LineString
              );
            })
          ) {
            setComponents();
          }
        },
      );
      setupLayer();

      onUnmounted(() => {
        featuresWatcher();
        layerListeners();
        parametersWatcher();
      });

      const valueDefault = getDefaultVectorStyleItemOptions();
      if (!valueDefault.text) {
        valueDefault.text = {};
      }
      valueDefault.text.fill = { color: [0, 0, 0, 1] };
      valueDefault.text.stroke = { color: [255, 255, 255, 1], width: 1 };
      valueDefault.text.font = 'bold 18px Arial, Helvetica, sans-serif';

      return {
        styleComponents,
        styleOptions,
        valueDefault,
        updateFill(update: VectorStyleItemOptions['fill']): void {
          styleOptions.value.fill = update;
          manager.currentFeatures.value.forEach((feature) => {
            const style = getFeatureStyle(feature, manager.currentLayer.value!);
            style.setFill(update ? new Fill(update) : null);
            setFeatureStyle(feature, style);
          });
        },
        updateStroke(update: VectorStyleItemOptions['stroke']): void {
          styleOptions.value.stroke = update;
          manager.currentFeatures.value.forEach((feature) => {
            const style = getFeatureStyle(feature, manager.currentLayer.value!);
            style.setStroke(update ? new Stroke(update) : null);
            setFeatureStyle(feature, style);
          });
        },
        updateText(update?: VectorStyleItemText): void {
          styleOptions.value.text = update;
          manager.currentFeatures.value.forEach((feature) => {
            const style = getFeatureStyle(feature, manager.currentLayer.value!);
            let newText;
            if (update) {
              newText = getTextFromOptions(update);
            }
            style.setText((newText || null) as Parameters<Style['setText']>[0]);
            setFeatureStyle(feature, style);
          });
        },
        updateImage(update?: VectorStyleItemImage): void {
          styleOptions.value.image = update;
          manager.currentFeatures.value.forEach((feature) => {
            const style = getFeatureStyle(feature, manager.currentLayer.value!);
            let newImage;
            if (update) {
              newImage = getImageStyleFromOptions(update as ImageOptions);
            }
            style.setImage(
              (newImage || null) as Parameters<Style['setImage']>[0],
            );
            setFeatureStyle(feature, style);
          });
        },
      };
    },
  });
</script>

<style scoped></style>
