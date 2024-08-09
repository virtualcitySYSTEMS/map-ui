import {
  describe,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
  expect,
  it,
  vi,
} from 'vitest';
import { Feature } from 'ol';
import Point from 'ol/geom/Point.js';
import {
  CesiumTilesetLayer,
  VcsModule,
  getDefaultVectorStyleItemOptions,
  isProvidedFeature,
  mercatorProjection,
  OpenlayersMap,
  vcsLayerName,
  VectorLayer,
  VectorStyleItem,
  WMSLayer,
  WMTSLayer,
} from '@vcmap/core';
import { createDummyCesium3DTileFeature } from '@vcmap/core/dist/tests/unit/helpers/cesiumHelpers.js';
import { Circle, Style, Stroke, Fill, Text } from 'ol/style.js';
import { Color } from '@vcmap-cesium/engine';

import VcsUiApp from '../../../src/vcsUiApp.js';
import TableFeatureInfoView from '../../../src/featureInfo/tableFeatureInfoView.js';
import { getDefaultPrimaryColor } from '../../../src/vuePlugins/vuetify.js';
import AbstractFeatureInfoView from '../../../src/featureInfo/abstractFeatureInfoView.js';
import FeatureInfo, {
  featureInfoViewSymbol,
} from '../../../src/featureInfo/featureInfo.js';
import FeatureInfoInteraction from '../../../src/featureInfo/featureInfoInteraction.js';

describe('FeatureInfo', () => {
  describe('setting up listeners', () => {
    let app;
    let layer;

    beforeEach(async () => {
      app = new VcsUiApp();
      app.featureInfo.add(new TableFeatureInfoView({ name: 'foo' }));
      layer = new VectorLayer({
        projection: mercatorProjection.toJSON(),
      });
      layer.properties.featureInfo = 'foo';
      app.layers.add(layer);
      const feature = new Feature({});
      layer.addFeatures([feature]);
      await app.addModule(new VcsModule({ _id: 'remove' }));
      await app.featureInfo.selectFeature(feature);
    });

    afterEach(() => {
      app.destroy();
    });

    it('should clear the feature info, if the layer is not supported on the currently active map', async () => {
      layer.mapNames = ['foo'];
      const map = new OpenlayersMap({});
      app.maps.add(map);
      await app.maps.setActiveMap(map.name);
      expect(app.featureInfo.selectedFeature).to.be.null;
    });

    it('should clear the feature info, if the layers state changes', async () => {
      await layer.activate();
      expect(app.featureInfo.selectedFeature).to.be.null;
    });

    it('should clear the feature info, if the window is closed', () => {
      app.windowManager.remove(app.featureInfo.windowId);
      expect(app.featureInfo.selectedFeature).to.be.null;
    });

    it('should clear, when adding a new module', async () => {
      await app.addModule(new VcsModule({ _id: 'add' }));
      expect(app.featureInfo.selectedFeature).to.be.null;
    });

    it('should clear, when removing a module', async () => {
      await app.removeModule('remove');
      expect(app.featureInfo.selectedFeature).to.be.null;
    });
  });

  describe('selecting of a feature', () => {
    let app;
    let layer;
    let feature;
    let selectedCallback;

    beforeEach(async () => {
      app = new VcsUiApp();
      layer = new VectorLayer({
        projection: mercatorProjection.toJSON(),
      });
      layer.properties.featureInfo = 'foo';
      app.layers.add(layer);
      feature = new Feature({ geometry: new Point([1, 1, 1]) });
      layer.addFeatures([feature]);
      app.featureInfo.add(new TableFeatureInfoView({ name: 'foo' }));
      selectedCallback = vi.fn();
      app.featureInfo.featureChanged.addEventListener(selectedCallback);
      await app.featureInfo.selectFeature(feature);
    });

    afterEach(() => {
      app.destroy();
    });

    it('should add window of registered view class', () => {
      expect(app.windowManager.has(app.featureInfo.windowId)).to.be.true;
    });

    it('should highlight selected feature', () => {
      expect(layer.featureVisibility.highlightedObjects).to.have.property(
        feature.getId(),
      );
    });

    it('should set the current feature', () => {
      expect(app.featureInfo.selectedFeature).to.equal(feature);
    });

    it('should raise the feature selected event', () => {
      expect(selectedCallback).toHaveBeenCalledWith(feature);
    });
  });

  describe('determining of highlight style', () => {
    let app;
    let fillColor;

    beforeAll(() => {
      app = new VcsUiApp();
      app.featureInfo.add(new TableFeatureInfoView({ name: 'foo' }));
      fillColor = Color.fromCssColorString(
        app.uiConfig.config.primaryColor ?? getDefaultPrimaryColor(app),
      ).withAlpha(0.8);
    });

    afterAll(() => {
      app.destroy();
    });

    describe('of a normal vector feature', () => {
      describe('if layer does not have a highlight style', () => {
        let layer;

        beforeAll(() => {
          layer = new VectorLayer({
            projection: mercatorProjection.toJSON(),
          });
          layer.properties.featureInfo = 'foo';
          app.layers.add(layer);
        });

        describe('if the feature has no style', () => {
          let style;
          let highlightStyle;

          beforeAll(async () => {
            const feature = new Feature({});
            layer.addFeatures([feature]);
            await app.featureInfo.selectFeature(feature);
            highlightStyle =
              layer.featureVisibility.highlightedObjects[feature.getId()].style
                .style;
            ({ style } = layer);
          });

          it('should set the fill color to the primary colors', () => {
            const color = fillColor.toBytes();
            color[3] /= 255;
            expect(highlightStyle.getFill().getColor()).to.have.members(color);
          });

          it('should set the storkes color to the primary color', () => {
            expect(highlightStyle.getStroke().getColor()).to.equal(
              fillColor.toCssColorString(),
            );
          });

          it('should set the strokes width to twice as much', () => {
            expect(highlightStyle.getStroke().getWidth()).to.equal(
              style.style.getStroke().getWidth() * 2,
            );
          });

          it('should set the style image scale to twice as much', () => {
            expect(highlightStyle.getImage().getScale()).to.equal(
              style.style.getImage().getScale() * 2,
            );
          });

          it('should change the text color to the primary color', () => {
            expect(highlightStyle.getText().getFill().getColor()).to.equal(
              fillColor.toCssColorString(),
            );
          });

          it('should change the texts scale to twice as much', () => {
            expect(highlightStyle.getText().getScale()).to.equal(
              (style.style.getText().getScale() ?? 1) * 2,
            );
          });
        });

        describe('if the feature has a style', () => {
          let setupFeature;

          beforeAll(() => {
            setupFeature = async (style) => {
              const feature = new Feature();
              feature.setStyle(style);
              layer.addFeatures([feature]);
              await app.featureInfo.selectFeature(feature);
              return layer.featureVisibility.highlightedObjects[feature.getId()]
                .style.style;
            };
          });

          it('should set the scale on the styles images to twice as much', async () => {
            const style = new Style({ image: new Circle({ radius: 5 }) });
            const highlightStyle = await setupFeature(style);
            expect(highlightStyle.getImage().getScale()).to.equal(
              style.getImage().getScale() * 2,
            );
          });

          it('should set the width & color on a styles stroke', async () => {
            const style = new Style({
              stroke: new Stroke({ color: '#FF00FF', width: 1 }),
            });
            const highlightStyle = await setupFeature(style);

            expect(highlightStyle.getStroke().getWidth()).to.equal(2);
            expect(highlightStyle.getStroke().getColor()).to.equal(
              fillColor.toCssColorString(),
            );
          });

          it('should set the color on a styles fill', async () => {
            const style = new Style({ fill: new Fill({ color: '#FFFFFF' }) });
            const highlightStyle = await setupFeature(style);

            const color = fillColor.toBytes();
            color[3] /= 255;
            expect(highlightStyle.getFill().getColor()).to.have.members(color);
          });

          it('should set scale on text', async () => {
            const style = new Style({
              text: new Text({
                stroke: new Stroke({ width: 1, color: '#FF00FF' }),
                text: 'foo',
              }),
            });
            style.getText().setScale(2);
            const highlightStyle = await setupFeature(style);

            expect(highlightStyle.getText().getScale()).to.equal(4);
          });

          it('should set color on text', async () => {
            const style = new Style({
              text: new Text({
                stroke: new Stroke({ width: 1, color: '#FF00FF' }),
                text: 'foo',
                fill: new Fill({ color: '#00FF00' }),
              }),
            });
            const highlightStyle = await setupFeature(style);

            expect(highlightStyle.getText().getFill().getColor()).to.equal(
              fillColor.toCssColorString(),
            );
          });
        });
      });

      describe('if layer has a highlight style', () => {
        let layer;

        beforeAll(() => {
          layer = new VectorLayer({
            projection: mercatorProjection.toJSON(),
          });
          layer.properties.featureInfo = 'foo';
          layer.highlightStyle = new VectorStyleItem({});
          app.layers.add(layer);
        });

        it('should use the highlight style, if the feature has no style', async () => {
          const feature = new Feature({});
          layer.addFeatures([feature]);
          await app.featureInfo.selectFeature(feature);
          expect(
            layer.featureVisibility.highlightedObjects[feature.getId()].style,
          ).to.equal(layer.highlightStyle);
        });

        it('should use the highlight style, if the feature has a style', async () => {
          const feature = new Feature({});
          feature.style = new Style();
          layer.addFeatures([feature]);
          await app.featureInfo.selectFeature(feature);
          expect(
            layer.featureVisibility.highlightedObjects[feature.getId()].style,
          ).to.equal(layer.highlightStyle);
        });
      });
    });

    describe('of a cesium3DTile feature', () => {
      describe('if the layer has no highlight style', () => {
        let layer;
        let highlightStyle;

        beforeAll(async () => {
          layer = new CesiumTilesetLayer({});
          layer.properties.featureInfo = 'foo';
          app.layers.add(layer);
          const feature = createDummyCesium3DTileFeature({ _id: 'foo' });
          feature[vcsLayerName] = layer.name;
          await app.featureInfo.selectFeature(feature);
          highlightStyle =
            layer.featureVisibility.highlightedObjects[feature.getId()].style
              .style;
        });

        it('should set the fill color to the primary colors', () => {
          const color = fillColor.toBytes();
          color[3] /= 255;
          expect(highlightStyle.getFill().getColor()).to.have.members(color);
        });
      });

      describe('if the layer has a highlight style', () => {
        let layer;
        let highlightStyle;

        beforeAll(async () => {
          layer = new CesiumTilesetLayer({});
          layer.properties.featureInfo = 'foo';
          layer.highlightStyle = new VectorStyleItem({});
          app.layers.add(layer);
          const feature = createDummyCesium3DTileFeature({ id: 'foo' });
          feature[vcsLayerName] = layer.name;
          await app.featureInfo.selectFeature(feature);
          highlightStyle =
            layer.featureVisibility.highlightedObjects[feature.getId()].style;
        });

        it('should use the highlight style', () => {
          expect(highlightStyle).to.equal(layer.highlightStyle);
        });
      });
    });

    describe('of provided features', () => {
      describe('if the layer has no highlight style', () => {
        let layer;

        beforeAll(() => {
          layer = new WMTSLayer({});
          layer.properties.featureInfo = 'foo';
          app.layers.add(layer);
        });

        describe('if the feature has no style', () => {
          let style;
          let highlightStyle;

          beforeAll(async () => {
            const feature = new Feature({});
            feature[isProvidedFeature] = true;
            feature[vcsLayerName] = layer.name;
            await app.featureInfo.selectFeature(feature);
            highlightStyle =
              app.featureInfo._scratchLayer.featureVisibility
                .highlightedObjects[feature.getId()].style.style;
            style = new VectorStyleItem(getDefaultVectorStyleItemOptions());
          });

          it('should set the fill color to the primary colors on the default vector styleItem', () => {
            const color = fillColor.toBytes();
            color[3] /= 255;
            expect(highlightStyle.getFill().getColor()).to.have.members(color);
          });

          it('should set the stroke color to the primary color', () => {
            expect(highlightStyle.getStroke().getColor()).to.equal(
              fillColor.toCssColorString(),
            );
          });

          it('should set the strokes width to twice as much', () => {
            expect(highlightStyle.getStroke().getWidth()).to.equal(
              style.style.getStroke().getWidth() * 2,
            );
          });

          it('should set the style image scale to twice as much', () => {
            expect(highlightStyle.getImage().getScale()).to.equal(
              style.style.getImage().getScale() * 2,
            );
          });

          it('should change the text color to the primary color', () => {
            expect(highlightStyle.getText().getFill().getColor()).to.equal(
              fillColor.toCssColorString(),
            );
          });

          it('should change the texts scale to twice as much', () => {
            expect(highlightStyle.getText().getScale()).to.equal(
              (style.style.getText().getScale() ?? 1) * 2,
            );
          });
        });

        describe('if the feature has a style', () => {
          let setupFeature;

          beforeAll(() => {
            setupFeature = async (style) => {
              const feature = new Feature();
              feature[isProvidedFeature] = true;
              feature[vcsLayerName] = layer.name;
              feature.setStyle(style);
              await app.featureInfo.selectFeature(feature);
              return app.featureInfo._scratchLayer.featureVisibility
                .highlightedObjects[feature.getId()].style.style;
            };
          });

          it('should set the scale on the styles images to twice as much', async () => {
            const style = new Style({ image: new Circle({ radius: 5 }) });
            const highlightStyle = await setupFeature(style);
            expect(highlightStyle.getImage().getScale()).to.equal(
              style.getImage().getScale() * 2,
            );
          });

          it('should set the width & color on a styles stroke', async () => {
            const style = new Style({
              stroke: new Stroke({ color: '#FF00FF', width: 1 }),
            });
            const highlightStyle = await setupFeature(style);

            expect(highlightStyle.getStroke().getWidth()).to.equal(2);
            expect(highlightStyle.getStroke().getColor()).to.equal(
              fillColor.toCssColorString(),
            );
          });

          it('should set the color on a styles fill', async () => {
            const style = new Style({ fill: new Fill({ color: '#FFFFFF' }) });
            const highlightStyle = await setupFeature(style);

            const color = fillColor.toBytes();
            color[3] /= 255;
            expect(highlightStyle.getFill().getColor()).to.have.members(color);
          });

          it('should set scale on text', async () => {
            const style = new Style({
              text: new Text({
                stroke: new Stroke({ width: 1, color: '#FF00FF' }),
                text: 'foo',
              }),
            });
            style.getText().setScale(2);
            const highlightStyle = await setupFeature(style);

            expect(highlightStyle.getText().getScale()).to.equal(4);
          });

          it('should set color on text', async () => {
            const style = new Style({
              text: new Text({
                stroke: new Stroke({ width: 1, color: '#FF00FF' }),
                text: 'foo',
                fill: new Fill({ color: '#00FF00' }),
              }),
            });
            const highlightStyle = await setupFeature(style);

            expect(highlightStyle.getText().getFill().getColor()).to.equal(
              fillColor.toCssColorString(),
            );
          });
        });
      });

      describe('if the layer has a highlight style', () => {
        let layer;

        beforeAll(async () => {
          layer = new WMTSLayer({});
          layer.properties.featureInfo = 'foo';
          layer.highlightStyle = new VectorStyleItem({});
          app.layers.add(layer);
        });

        it('should set the layers highlight style, if the feature has no style', async () => {
          const feature = new Feature({});
          feature[isProvidedFeature] = true;
          feature[vcsLayerName] = layer.name;
          await app.featureInfo.selectFeature(feature);
          const highlightStyle =
            app.featureInfo._scratchLayer.featureVisibility.highlightedObjects[
              feature.getId()
            ].style;
          expect(highlightStyle).to.equal(layer.highlightStyle);
        });

        it('should set the layers highlight style, if the feature has a style', async () => {
          const feature = new Feature({});
          feature[isProvidedFeature] = true;
          feature[vcsLayerName] = layer.name;
          feature.setStyle(new Style({}));
          await app.featureInfo.selectFeature(feature);
          const highlightStyle =
            app.featureInfo._scratchLayer.featureVisibility.highlightedObjects[
              feature.getId()
            ].style;
          expect(highlightStyle).to.equal(layer.highlightStyle);
        });
      });
    });

    describe('if the style is a function', () => {
      let style;
      let highlightStyle;

      beforeAll(async () => {
        const layer = new VectorLayer({
          projection: mercatorProjection.toJSON(),
        });
        layer.properties.featureInfo = 'foo';
        app.layers.add(layer);
        const feature = new Feature({});
        feature.setStyle(() => layer.style.style);
        layer.addFeatures([feature]);
        await app.featureInfo.selectFeature(feature);
        highlightStyle =
          layer.featureVisibility.highlightedObjects[feature.getId()].style
            .style;
        ({ style } = layer);
      });

      it('should set the fill color to the primary colors', () => {
        const color = fillColor.toBytes();
        color[3] /= 255;
        expect(highlightStyle.getFill().getColor()).to.have.members(color);
      });

      it('should set the storkes color to the primary color', () => {
        expect(highlightStyle.getStroke().getColor()).to.equal(
          fillColor.toCssColorString(),
        );
      });

      it('should set the strokes width to twice as much', () => {
        expect(highlightStyle.getStroke().getWidth()).to.equal(
          style.style.getStroke().getWidth() * 2,
        );
      });

      it('should set the style image scale to twice as much', () => {
        expect(highlightStyle.getImage().getScale()).to.equal(
          style.style.getImage().getScale() * 2,
        );
      });

      it('should change the text color to the primary color', () => {
        expect(highlightStyle.getText().getFill().getColor()).to.equal(
          fillColor.toCssColorString(),
        );
      });

      it('should change the texts scale to twice as much', () => {
        expect(highlightStyle.getText().getScale()).to.equal(
          (style.style.getText().getScale() ?? 1) * 2,
        );
      });
    });
  });

  describe('handling of provided features', () => {
    describe('selecting of a feature', () => {
      let app;
      let feature;
      let selectedCallback;

      beforeEach(async () => {
        app = new VcsUiApp();
        const layer = new WMSLayer({});
        layer.properties.featureInfo = 'foo';
        app.layers.add(layer);
        feature = new Feature({ geometry: new Point([1, 1, 1]) });
        feature[isProvidedFeature] = true;
        feature[vcsLayerName] = layer.name;
        app.featureInfo.add(new TableFeatureInfoView({ name: 'foo' }));
        selectedCallback = vi.fn();
        app.featureInfo.featureChanged.addEventListener(selectedCallback);
        await app.featureInfo.selectFeature(feature);
      });

      afterEach(() => {
        app.destroy();
      });

      it('should add window of registered view class', () => {
        expect(app.windowManager.has(app.featureInfo.windowId)).to.be.true;
      });

      it('should create a scratch layer and add it', () => {
        expect(app.featureInfo._scratchLayer).to.be.an.instanceOf(VectorLayer);
        expect(app.layers.has(app.featureInfo._scratchLayer)).to.be.true;
      });

      it('should highlight selected feature on the scratch layer', () => {
        expect(
          app.featureInfo._scratchLayer.featureVisibility.highlightedObjects,
        ).to.have.property(feature.getId());
      });

      it('should set the current feature', () => {
        expect(app.featureInfo.selectedFeature).to.equal(feature);
      });

      it('should raise the feature selected event', () => {
        expect(selectedCallback).toHaveBeenCalledWith(feature);
      });
    });

    describe('unselecting a feature', () => {
      let app;
      let feature;
      let selectedCallback;
      let windowId;

      beforeEach(async () => {
        app = new VcsUiApp();
        const layer = new WMSLayer({});
        layer.properties.featureInfo = 'foo';
        app.layers.add(layer);
        feature = new Feature({ geometry: new Point([1, 1, 1]) });
        feature[isProvidedFeature] = true;
        feature[vcsLayerName] = layer.name;
        app.featureInfo.add(new TableFeatureInfoView({ name: 'foo' }));
        await app.featureInfo.selectFeature(feature);
        ({ windowId } = app.featureInfo);
        selectedCallback = vi.fn();
        app.featureInfo.featureChanged.addEventListener(selectedCallback);
        await app.featureInfo.clear();
      });

      afterEach(() => {
        app.destroy();
      });

      it('should remove window of previous selected feature', () => {
        expect(app.windowManager.has(windowId)).to.be.false;
        expect(app.featureInfo.windowId).to.be.null;
      });

      it('should clear highlight selected feature', () => {
        expect(
          app.featureInfo._scratchLayer.featureVisibility.highlightedObjects,
        ).to.not.have.property(feature.getId());
      });

      it('should remove all features from the scratchLayer', () => {
        expect(app.featureInfo._scratchLayer.getFeatures()).to.be.empty;
      });

      it('should set the current feature to null', () => {
        expect(app.featureInfo.selectedFeature).to.be.null;
      });

      it('should raise the feature selected event with null', () => {
        expect(selectedCallback).toHaveBeenCalledWith(null);
      });
    });
  });

  describe('overriding feature info view', () => {
    let app;
    let layerFeatureInfo;
    let layer;

    beforeAll(() => {
      app = new VcsUiApp();
      layerFeatureInfo = new TableFeatureInfoView({ name: 'foo' });
      app.featureInfo.add(layerFeatureInfo);
      layer = new VectorLayer({
        projection: mercatorProjection.toJSON(),
      });
      layer.properties.featureInfo = layerFeatureInfo.name;
      app.layers.add(layer);
    });

    afterAll(() => {
      layer.destroy();
      app.destroy();
    });

    it('should primarily use feature info view of a feature', async () => {
      const feature = new Feature({});
      feature[featureInfoViewSymbol] = new AbstractFeatureInfoView({}, {});
      layer.addFeatures([feature]);
      const overrideFeatureInfo = new AbstractFeatureInfoView({}, {});
      await app.featureInfo.selectFeature(
        feature,
        null,
        null,
        overrideFeatureInfo,
      );
      expect(app.windowManager.get(app.featureInfo.windowId)).to.have.property(
        'component',
        feature[featureInfoViewSymbol].component,
      );
    });

    it('should secondarily use provided feature info view overriding the feature info view of a layer', async () => {
      const feature = new Feature({});
      layer.addFeatures([feature]);
      const overrideFeatureInfo = new AbstractFeatureInfoView({}, {});
      await app.featureInfo.selectFeature(
        feature,
        null,
        null,
        overrideFeatureInfo,
      );
      expect(app.windowManager.get(app.featureInfo.windowId)).to.have.property(
        'component',
        overrideFeatureInfo.component,
      );
    });

    it('should tertiary use the feature info view of a layer', async () => {
      const feature = new Feature({});
      layer.addFeatures([feature]);
      await app.featureInfo.selectFeature(feature);
      expect(app.windowManager.get(app.featureInfo.windowId)).to.have.property(
        'component',
        layerFeatureInfo.component,
      );
    });

    it('should allow for a layer to not have a feature info view defined', async () => {
      const layer2 = new VectorLayer({
        projection: mercatorProjection.toJSON(),
      });
      app.layers.add(layer2);
      const feature = new Feature({});
      layer2.addFeatures([feature]);
      const overrideFeatureInfo = new AbstractFeatureInfoView({}, {});
      await app.featureInfo.selectFeature(
        feature,
        null,
        null,
        overrideFeatureInfo,
      );
      expect(app.windowManager.get(app.featureInfo.windowId)).to.have.property(
        'component',
        overrideFeatureInfo.component,
      );
    });
  });

  describe('unselectable features', () => {
    let app;

    beforeAll(() => {
      app = new VcsUiApp();
      app.featureInfo.add(new TableFeatureInfoView({ name: 'foo' }));
    });

    afterAll(() => {
      app.destroy();
    });

    it('should not select a feature without a layer', async () => {
      await app.featureInfo.selectFeature(new Feature({}));
      expect(app.featureInfo.selectedFeature).to.be.null;
    });

    it('should not select a feature, which has an unregistered layer', async () => {
      const layer = new VectorLayer({
        projection: mercatorProjection.toJSON(),
      });
      layer.properties.featureInfo = 'foo';
      const feature = new Feature({});
      layer.addFeatures([feature]);
      await app.featureInfo.selectFeature(feature);
      expect(app.featureInfo.selectedFeature).to.be.null;
    });

    it('should not select a feature, which has a layer without a feature info property', async () => {
      const layer = new VectorLayer({
        projection: mercatorProjection.toJSON(),
      });
      app.layers.add(layer);
      const feature = new Feature({});
      layer.addFeatures([feature]);
      await app.featureInfo.selectFeature(feature);
      expect(app.featureInfo.selectedFeature).to.be.null;
    });

    it('should not select a feature, which has a layer, which references an inexistent feature info', async () => {
      const layer = new VectorLayer({
        projection: mercatorProjection.toJSON(),
      });
      layer.properties.featureInfo = 'bar';
      app.layers.add(layer);
      const feature = new Feature({});
      layer.addFeatures([feature]);
      await app.featureInfo.selectFeature(feature);
      expect(app.featureInfo.selectedFeature).to.be.null;
    });
  });

  describe('unselecting a feature', () => {
    let app;
    let layer;
    let feature;
    let selectedCallback;
    let windowId;

    beforeEach(async () => {
      app = new VcsUiApp();
      const map = new OpenlayersMap({ name: 'ol' });
      app.maps.add(map);
      await app.maps.setActiveMap(map.name);
      layer = new VectorLayer({
        projection: mercatorProjection.toJSON(),
      });
      layer.properties.featureInfo = 'foo';
      app.layers.add(layer);
      feature = new Feature({ geometry: new Point([1, 1, 1]) });
      layer.addFeatures([feature]);
      app.featureInfo.add(new TableFeatureInfoView({ name: 'foo' }));
      await app.featureInfo.selectFeature(feature);
      ({ windowId } = app.featureInfo);
      selectedCallback = vi.fn();
      app.featureInfo.featureChanged.addEventListener(selectedCallback);
      await app.featureInfo.clear();
    });

    afterEach(() => {
      app.destroy();
    });

    it('should remove window of previous selected feature', () => {
      expect(app.windowManager.has(windowId)).to.be.false;
      expect(app.featureInfo.windowId).to.be.null;
    });

    it('should clear highlight selected feature', () => {
      expect(layer.featureVisibility.highlightedObjects).to.not.have.property(
        feature.getId(),
      );
    });

    it('should set the current feature to null', () => {
      expect(app.featureInfo.selectedFeature).to.be.null;
    });

    it('should raise the feature selected event with null', () => {
      expect(selectedCallback).toHaveBeenCalledWith(null);
    });
  });

  describe('feature info tool button', () => {
    describe('setting up the toolbox', () => {
      let app;
      let toolboxComponent;

      beforeEach(() => {
        app = new VcsUiApp();
        const layer = new VectorLayer({
          projection: mercatorProjection.toJSON(),
        });
        layer.properties.featureInfo = 'foo';
        app.layers.add(layer);
        toolboxComponent = app.toolboxManager.get('featureInfo');
      });

      afterEach(() => {
        app.destroy();
      });

      it('should add the featureInfo tool button', () => {
        expect(app.toolboxManager.has('featureInfo')).to.be.true;
      });

      it('should activate the tool on startup, if startingFeatureInfo is not false', () => {
        expect(app.uiConfig.getByKey('startingFeatureInfo')).to.be.undefined;
        expect(toolboxComponent.action).to.have.property('active', true);
      });

      it('should NOT activate the tool on startup, if startingFeatureInfo is false', () => {
        app.uiConfig.add({ name: 'startingFeatureInfo', value: false });
        expect(app.uiConfig.getByKey('startingFeatureInfo')?.value).to.be.false;
        app.featureInfo.destroy();
        const featureInfo = new FeatureInfo(app);
        expect(toolboxComponent.action).to.have.property('active', false);
        featureInfo.destroy();
      });
    });

    describe('starting a session', () => {
      let app;
      let action;

      beforeAll(() => {
        app = new VcsUiApp();
        const layer = new VectorLayer({
          projection: mercatorProjection.toJSON(),
        });
        layer.properties.featureInfo = 'foo';
        app.layers.add(layer);
        ({ action } = app.toolboxManager.get('featureInfo'));
      });

      afterAll(() => {
        app.destroy();
      });

      it('should set the action active', () => {
        expect(action).to.have.property('active', true);
      });

      it('should add an interaction to the event handler', () => {
        expect(
          app.maps.eventHandler.interactions.find(
            (i) => i instanceof FeatureInfoInteraction,
          ),
        ).to.exist;
      });
    });

    describe('stopping the session', () => {
      let app;
      let toolboxComponent;

      beforeAll(async () => {
        app = new VcsUiApp();
        app.featureInfo.add(new TableFeatureInfoView({ name: 'foo' }));

        const layer = new VectorLayer({
          projection: mercatorProjection.toJSON(),
        });
        layer.properties.featureInfo = 'foo';
        app.layers.add(layer);
        const feature = new Feature({});
        layer.addFeatures([feature]);
        await app.featureInfo.selectFeature(feature);
        toolboxComponent = app.toolboxManager.get('featureInfo');
        toolboxComponent.action.callback();
      });

      afterAll(() => {
        app.destroy();
      });

      it('should set the action as inactive', () => {
        expect(toolboxComponent.action).to.have.property('active', false);
      });

      it('should remove any interactions', () => {
        expect(
          app.maps.eventHandler.interactions.find(
            (i) => i instanceof FeatureInfoInteraction,
          ),
        ).to.be.undefined;
      });

      it('should clear the feature info', () => {
        expect(app.featureInfo.selectedFeature).to.be.null;
      });
    });

    describe('if the exclusive interaction is removed', () => {
      let app;
      let toolboxComponent;

      beforeAll(async () => {
        app = new VcsUiApp();
        app.featureInfo.add(new TableFeatureInfoView({ name: 'foo' }));

        const layer = new VectorLayer({
          projection: mercatorProjection.toJSON(),
        });
        layer.properties.featureInfo = 'foo';
        app.layers.add(layer);
        const feature = new Feature({});
        layer.addFeatures([feature]);
        await app.featureInfo.selectFeature(feature);
        toolboxComponent = app.toolboxManager.get('featureInfo');
        app.maps.eventHandler.removeExclusive();
      });

      afterAll(() => {
        app.destroy();
      });

      it('should set the action as inactive', () => {
        expect(toolboxComponent.action).to.have.property('active', false);
      });

      it('should remove any interactions', () => {
        expect(
          app.maps.eventHandler.interactions.find(
            (i) => i instanceof FeatureInfoInteraction,
          ),
        ).to.be.undefined;
      });

      it('should clear the feature info', () => {
        expect(app.featureInfo.selectedFeature).to.be.null;
      });
    });
  });
});
