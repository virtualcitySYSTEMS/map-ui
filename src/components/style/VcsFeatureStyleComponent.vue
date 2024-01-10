<template>
  <VcsVectorStyleComponent
    :value="styleOptions"
    @update:fill="updateFill"
    @update:stroke="updateStroke"
    @update:image="updateImage"
    @update:text="updateText"
    :style-components="styleComponents"
    :value-default="valueDefault"
  />
</template>

<script>
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
  import { Fill, Stroke } from 'ol/style.js';
  import { inject, onUnmounted, ref, watch } from 'vue';
  import VcsVectorStyleComponent, {
    VectorStyleMenus,
  } from './VcsVectorStyleComponent.vue';

  /**
   * @typedef {Object} StyleOptions
   * @property {import("ol/style/Fill").Options|null|undefined} [fill]
   * @property {import("ol/style/Stroke").Options|null|undefined} [stroke]
   * @property {import("ol/style/Image").Options|null|undefined} [image]
   * @property {import("ol/style/Text").Options|null|undefined} [text]
   */

  /**
   * Determines the style that is applied to a feature, either from the layer or directly set on the feature. Does not return the highlight style.
   * @param {import("ol").Feature} feature The feature for which the style should be determined
   * @param {import("@vcmap/core").VectorLayer} layer The features layer.
   * @returns {import("ol/style").Style} Either a reference to the features style or a clone of the layers style.
   */
  function getFeatureStyle(feature, layer) {
    const layerStyle = layer.style.style.clone();
    let featureStyle;
    if (feature[highlighted]) {
      featureStyle = feature[originalStyle];
    } else {
      featureStyle = feature.getStyle();
    }
    return featureStyle || layerStyle;
  }

  /**
   * Sets the style for a highlighted feature
   * @param {import("ol").Feature} feature The feature to set the style on
   * @param {import("ol/style").Style} style The style
   */
  function setFeatureStyle(feature, style) {
    feature.setStyle(style);
    feature[originalStyle] = style;
    const styleOptions = getStyleOptions(style);
    if (styleOptions.text?.text) {
      styleOptions.label = styleOptions.text.text;
    }
    feature[vectorStyleSymbol] = new VectorStyleItem(styleOptions);
  }

  /**
   * @param {import("ol").Feature} feature
   * @param {import("@vcmap/core").VectorPropertiesOptions} featureProperties
   * @returns {Array<VectorStyleMenus>}
   */
  function getStyleComponentsForFeature(feature, featureProperties) {
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

  /**
   * @param {Array<import("ol").Feature>} features
   * @param {import("@vcmap/core").VectorPropertiesOptions} featureProperties
   * @returns {Array<VectorStyleMenus>}
   */
  function getComponentsForFeatures(features, featureProperties) {
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

  /**
   * @param {import("ol/color").Color} c1
   * @param {import("ol/color").Color}  c2
   * @returns {boolean}
   */
  function olColorEqual(c1, c2) {
    return (
      c1[0] === c2[0] && c1[1] === c2[1] && c1[2] === c2[2] && c1[3] === c2[3]
    );
  }

  function isSameStyle(shape1, shape2) {
    return JSON.stringify(shape1) === JSON.stringify(shape2);
  }

  /**
   * @param {Array<import("ol/style/Style").default>} styles - Style for each feature
   * @param {VectorStyleMenus} componentId
   * @param {StyleOptions} styleOptions
   */
  function setStyleOptions(styles, componentId, styleOptions) {
    if (componentId === VectorStyleMenus.FILL) {
      // checks if there is a fill style and that all fill styles are equal. Otherwise return null.
      styleOptions.fill = styles.reduce((prev, style) => {
        if (prev === null) {
          return null;
        }
        const currentColor = style?.getFill()?.getColor();
        if (!currentColor) {
          return null;
        }
        const parsedColor = parseColor(currentColor);
        if (prev === undefined) {
          return { color: parsedColor };
        }
        return olColorEqual(parsedColor, prev.color)
          ? { color: parsedColor }
          : null;
      }, undefined);
    } else if (componentId === VectorStyleMenus.STROKE) {
      // checks if there is a stroke style and that all stoke styles are equal. Otherwise return null.
      styleOptions.stroke = styles.reduce((prev, style) => {
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
      }, undefined);
    } else if (componentId === VectorStyleMenus.IMAGE) {
      styleOptions.image = styles.reduce((prev, style) => {
        if (prev === null) {
          return null;
        }
        let current;

        if (style.getImage()) {
          current = getImageStyleOptions(style.getImage());
        }

        if (!current || (prev && !isSameStyle(prev, current))) {
          return null;
        }
        return current;
      }, undefined);
    } else if (componentId === VectorStyleMenus.TEXT) {
      styleOptions.text = styles.reduce((prev, style) => {
        if (prev === null) {
          return null;
        }
        let current;

        if (style.getText()) {
          current = getTextOptions(style.getText());
        }

        if (!current || !current.text) {
          return null;
        } else if (prev && !isSameStyle(prev, current)) {
          return null;
        }
        return current;
      }, undefined);
    }
  }

  /**
   * A style component to render the style options of an editor managers features. Must have a manager provided.
   * @vue-prop {import("@vcmap/core").VectorPropertiesOptions} featureProperties - JSON representation of a vector properties object.
   */
  export default {
    name: 'VcsFeatureStyleComponent',
    components: {
      VcsVectorStyleComponent,
    },
    props: {
      featureProperties: {
        type: Object,
        required: true,
      },
    },
    setup(props) {
      /** @type {import("../vector-properties/VcsFeatureEditingWindow.vue").EditorManager} */
      const manager = inject('manager');

      const styleComponents = ref([]);
      const styleOptions = ref({
        fill: undefined,
        stroke: undefined,
        image: undefined,
        text: undefined,
      });

      const setComponents = () => {
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
          styleComponents.value = getComponentsForFeatures(
            manager.currentFeatures.value,
            props.featureProperties,
          );
          if (styleComponents.value.length > 0) {
            const styles = manager.currentFeatures.value.map((feature) => {
              const layerStyle = manager.currentLayer.value.style.style.clone();
              let featureStyle;
              // not using f.getStyle because this would return the highlighted style (since its already highlighted).
              if (feature[highlighted]) {
                featureStyle = feature[originalStyle] ?? layerStyle;
              } else {
                featureStyle = feature.getStyle() ?? layerStyle;
              }
              return featureStyle;
            });
            styleComponents.value.forEach((componentId) => {
              setStyleOptions(styles, componentId, styleOptions.value);
            });
          }
        } else {
          styleComponents.value = [];
        }
      };

      let layerListeners = () => {};
      const setupLayer = () => {
        layerListeners();
        if (manager.currentLayer.value) {
          const vectorPropertiesListener =
            manager.currentLayer.value.vectorProperties.propertyChanged.addEventListener(
              setComponents,
            );
          const styleListener =
            manager.currentLayer.value.styleChanged.addEventListener(
              setComponents,
            );
          setComponents();
          layerListeners = () => {
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
      valueDefault.text.fill = { color: [0, 0, 0, 1] };
      valueDefault.text.stroke = { color: [255, 255, 255, 1], width: 1 };
      valueDefault.text.font = 'bold 18px Arial, Helvetica, sans-serif';

      return {
        styleComponents,
        styleOptions,
        valueDefault,
        updateFill(update) {
          styleOptions.value.fill = update;
          manager.currentFeatures.value.forEach((feature) => {
            const style = getFeatureStyle(feature, manager.currentLayer.value);
            style.setFill(update ? new Fill(update) : null);
            setFeatureStyle(feature, style);
          });
        },
        updateStroke(update) {
          styleOptions.value.stroke = update;
          manager.currentFeatures.value.forEach((feature) => {
            const style = getFeatureStyle(feature, manager.currentLayer.value);
            style.setStroke(update ? new Stroke(update) : null);
            setFeatureStyle(feature, style);
          });
        },
        updateText(update) {
          styleOptions.value.text = update;
          manager.currentFeatures.value.forEach((feature) => {
            const style = getFeatureStyle(feature, manager.currentLayer.value);
            let newText;
            if (update) {
              newText = getTextFromOptions(update);
            }
            style.setText(newText || null);
            setFeatureStyle(feature, style);
          });
        },
        updateImage(update) {
          styleOptions.value.image = update;
          manager.currentFeatures.value.forEach((feature) => {
            const style = getFeatureStyle(feature, manager.currentLayer.value);
            let newImage;
            if (update) {
              newImage = getImageStyleFromOptions(update);
            }
            style.setImage(newImage || null);
            setFeatureStyle(feature, style);
          });
        },
      };
    },
  };
</script>

<style scoped></style>
