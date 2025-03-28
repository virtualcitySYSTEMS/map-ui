import { describe, beforeAll, expect, it, afterAll } from 'vitest';
import { VectorLayer } from '@vcmap/core';
import { Feature } from 'ol';
import { Point } from 'ol/geom.js';
import IframeFeatureInfoView from '../../../src/featureInfo/iframeFeatureInfoView.js';

describe('IframeFeatureInfoView', () => {
  describe('getting config', () => {
    describe('of a default IframeFeatureInfoView', () => {
      it('should return the type and name', () => {
        const abstractView = new IframeFeatureInfoView({ name: 'TestView' });
        const config = abstractView.toJSON();
        expect(config).to.have.property('type', 'IframeFeatureInfoView');
        expect(config).to.have.property('name', 'TestView');
      });
    });

    describe('of a configured IframeFeatureInfoView', () => {
      let inputConfig;
      let outputConfig;

      beforeAll(() => {
        inputConfig = {
          name: 'TestView',
          title: 'iframe',
          src: 'https://iframe',
        };
        const abstractView = new IframeFeatureInfoView(inputConfig);
        outputConfig = abstractView.toJSON();
        abstractView.destroy();
      });

      it('should configure name', () => {
        expect(outputConfig).to.have.property('name', 'TestView');
      });

      it('should configure title', () => {
        expect(outputConfig).to.have.property('title', inputConfig.title);
      });

      it('should configure src', () => {
        expect(outputConfig).to.have.property('src', inputConfig.src);
      });
    });
  });

  describe('rendering the template', () => {
    let layer;
    let feature;

    beforeAll(() => {
      layer = new VectorLayer({});
      feature = new Feature({
        geometry: new Point([0, 0, 1]),
        property: 'foo',
        nested: {
          property: 'foo',
          array: [{ property: 'foo' }],
          'spaced property': 'foo',
        },
        array: [['foo'], 'foo'],
        'spaced property': 'foo',
        number: 5.1,
      });
      feature.setId('foo');
      layer.addFeatures([feature]);
    });

    afterAll(() => {
      layer.destroy();
    });

    describe('rendering properties', () => {
      it('should render a properties and attributes', () => {
        const infoView = new IframeFeatureInfoView({
          name: 'foo',

          src: 'https://myIframeUrl.com/myFeatureInformation?layer={{layerName}}&featureId={{featureId}}&property={{property}}&nested={{nested.array[0].property}}',
        });
        const { src } = infoView.getProperties({ feature }, layer);
        expect(src).to.equal(
          `https://myIframeUrl.com/myFeatureInformation?layer=${layer.name}&featureId=${feature.getId()}&property=foo&nested=foo`,
        );
      });
    });
  });
});
