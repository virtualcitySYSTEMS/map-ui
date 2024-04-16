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
      });
      feature.setId('foo');
      layer.addFeatures([feature]);
    });

    afterAll(() => {
      layer.destroy();
    });

    it('should render a property', () => {
      const infoView = new MarkdownFeatureInfoView({
        name: 'foo',
        template: '{{ property }}',
      });
      const { html } = infoView.getProperties({ feature }, layer);
      expect(html.trim()).to.equal('<p>foo</p>');
    });

    it('should render a nested property', () => {
      const infoView = new MarkdownFeatureInfoView({
        name: 'foo',
        template: '{{ nested.property }}',
      });
      const { html } = infoView.getProperties({ feature }, layer);
      expect(html.trim()).to.equal('<p>foo</p>');
    });

    it('should render an array element', () => {
      const infoView = new MarkdownFeatureInfoView({
        name: 'foo',
        template: '{{ array[1] }}',
      });
      const { html } = infoView.getProperties({ feature }, layer);
      expect(html.trim()).to.equal('<p>foo</p>');
    });

    it('should render a nested array elements property', () => {
      const infoView = new MarkdownFeatureInfoView({
        name: 'foo',
        template: '{{ nested.array[0].property }}',
      });
      const { html } = infoView.getProperties({ feature }, layer);
      expect(html.trim()).to.equal('<p>foo</p>');
    });

    it('should render a nested array element', () => {
      const infoView = new MarkdownFeatureInfoView({
        name: 'foo',
        template: '{{ array[0][0] }}',
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

    it('should render empty for inexistent keys', () => {
      const infoView = new MarkdownFeatureInfoView({
        name: 'foo',
        template: '{{ foo }}',
      });
      const { html } = infoView.getProperties({ feature }, layer);
      expect(html.trim()).to.be.empty;
    });

    it('should access bracket notation', () => {
      const infoView = new MarkdownFeatureInfoView({
        name: 'foo',
        template: '{{ ["spaced property"] }}',
      });
      const { html } = infoView.getProperties({ feature }, layer);
      expect(html.trim()).to.be.empty;
    });

    it('should access nested bracket notation', () => {
      const infoView = new MarkdownFeatureInfoView({
        name: 'foo',
        template: '{{ nested["spaced property"] }}',
      });
      const { html } = infoView.getProperties({ feature }, layer);
      expect(html.trim()).to.be.empty;
    });
  });
});
