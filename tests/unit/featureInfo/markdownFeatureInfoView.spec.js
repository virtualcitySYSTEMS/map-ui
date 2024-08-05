import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { VectorLayer } from '@vcmap/core';
import { Feature } from 'ol';
import { Point } from 'ol/geom.js';
import MarkdownFeatureInfoView from '../../../src/featureInfo/markdownFeatureInfoView.js';

describe('MarkdownFeatureInfoView', () => {
  describe('getting config', () => {
    it('should return the type and template string', () => {
      const abstractView = new MarkdownFeatureInfoView({
        name: 'TestView',
        template: '#FOO',
      });
      const config = abstractView.toJSON();
      expect(config).to.have.property(
        'type',
        MarkdownFeatureInfoView.className,
      );
      expect(config).to.have.property('template', '#FOO');
    });

    it('should return the type and template as an array', () => {
      const template = ['#foo', 'the foo'];
      const abstractView = new MarkdownFeatureInfoView({
        name: 'TestView',
        template,
      });
      const config = abstractView.toJSON();
      expect(config).to.have.property(
        'type',
        MarkdownFeatureInfoView.className,
      );
      expect(config).to.have.property('template').and.to.have.members(template);
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
      it('should render a property', () => {
        const infoView = new MarkdownFeatureInfoView({
          name: 'foo',
          template: '{{ property }}',
        });
        const { html } = infoView.getProperties({ feature }, layer);
        expect(html.trim()).to.equal('<p>foo</p>');
      });

      it('should render a non attributes', () => {
        const infoView = new MarkdownFeatureInfoView({
          name: 'foo',
          template: '{{ featureId }}',
        });
        const { html } = infoView.getProperties({ feature }, layer);
        expect(html.trim()).to.equal('<p>foo</p>');
      });
    });
  });
});
