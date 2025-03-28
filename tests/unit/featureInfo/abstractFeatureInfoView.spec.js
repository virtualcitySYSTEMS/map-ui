import { describe, beforeAll, expect, it } from 'vitest';
import { Feature } from 'ol';
import Point from 'ol/geom/Point.js';
import { VectorLayer } from '@vcmap/core';
import VcsUiApp from '../../../src/vcsUiApp.js';
import AbstractFeatureInfoView, {
  applyAttributeFilter,
  applyEmptyAttributesFilter,
  applyKeyMapping,
  applyOlcsAttributeFilter,
  applyValueMapping,
} from '../../../src/featureInfo/abstractFeatureInfoView.js';

describe('AbstractFeatureInfoView', () => {
  let abstractFeatureInfoView;
  let feature;
  let featureId;
  let filteredAttributes;

  beforeAll(() => {
    abstractFeatureInfoView = new AbstractFeatureInfoView(
      {
        name: 'TestView',
        attributeKeys: ['name', 'function'],
      },
      { name: 'VueComponent' },
    );

    featureId = 'test';
    filteredAttributes = {
      name: 'testFeature',
      function: 1000,
    };
    feature = new Feature();
    feature.setGeometry(new Point([1, 1]));
    feature.setId(featureId);
    feature.setProperties({
      ...filteredAttributes,
      usage: 1010,
      roofType: 1020,
    });
  });

  describe('applyValueMapping', () => {
    it('should return mapped value, if mapping provides a new value', () => {
      const attributes = { ...filteredAttributes };
      applyValueMapping(attributes, { function: { 1000: 'mappedValue1000' } });
      expect(attributes).to.have.property('function', 'mappedValue1000');
    });

    it('should leave value unchanged, if mapping does NOT provide a new value', () => {
      const attributes = { ...filteredAttributes };
      applyValueMapping(attributes, { function: { 1010: 'mappedValue1010' } });
      expect(attributes).to.have.property('function', 1000);
    });

    it('should return a value, if mapping provides a template string', () => {
      const attributes = { ...filteredAttributes };

      applyValueMapping(attributes, {
        // eslint-disable-next-line no-template-curly-in-string
        function: 'codeLists.values.function.${value}',
      });
      expect(attributes).to.have.property(
        'function',
        `codeLists.values.function.${feature.getProperty('function')}`,
      );
    });

    it('should apply value mapping for nested values', () => {
      const attributes = { foo: { bar: null } };
      applyValueMapping(attributes, { 'foo.bar': 'bar' });
      expect(attributes)
        .to.have.property('foo')
        .and.to.have.property('bar', 'bar');
    });

    it('should apply value mapping to deeply nested keys', () => {
      const attributes = { foo: { bar: { baz: null } } };
      applyValueMapping(attributes, { 'foo.bar.baz': 'bar' });
      expect(attributes)
        .to.have.property('foo')
        .and.to.have.property('bar')
        .and.to.have.property('baz', 'bar');
    });

    it('should apply value mapping for keys with a period', () => {
      const attributes = { 'foo.bar': null };
      applyValueMapping(attributes, { 'foo.bar': 'bar' });
      expect(attributes).to.have.property('foo.bar', 'bar');
    });
  });

  describe('applyKeyMapping', () => {
    it('should return mapped key, if mapping provides a new key', () => {
      const attributes = { ...filteredAttributes };
      applyKeyMapping(attributes, { function: 'mappedKeyFunction' });
      expect(attributes).to.have.property(
        'mappedKeyFunction',
        filteredAttributes.function,
      );
    });

    it('should delete old key, if mapping provides a new key', () => {
      const attributes = { ...filteredAttributes };
      applyKeyMapping(attributes, { function: 'mappedKeyFunction' });
      expect(attributes).to.not.have.property('function');
    });

    it('should leave key unchanged, if mapping does NOT provide a new value', () => {
      const attributes = { ...filteredAttributes };
      applyKeyMapping(attributes, { usage: 'mappedKeyUsage' });
      expect(attributes).to.have.property(
        'function',
        filteredAttributes.function,
      );
    });

    it('should apply key mapping for nested keys', () => {
      const attributes = { foo: { bar: null } };
      applyKeyMapping(attributes, { 'foo.bar': 'bar' });
      expect(attributes).to.have.property('bar', null);
      expect(attributes).to.have.property('foo').and.to.be.empty;
    });

    it('should apply key mapping to deeply nested keys', () => {
      const attributes = { foo: { bar: { baz: null } } };
      applyKeyMapping(attributes, { 'foo.bar.baz': 'bar' });
      expect(attributes).to.have.property('bar', null);
      expect(attributes).to.have.property('foo').and.to.have.property('bar').and
        .to.be.empty;
    });

    it('should apply key mapping for keys with a period', () => {
      const attributes = { 'foo.bar': null };
      applyKeyMapping(attributes, { 'foo.bar': 'bar' });
      expect(attributes).to.have.property('bar', null);
      expect(attributes).to.not.have.property('foo.bar');
    });

    it('should apply key mapping to child keys before adding key mapping to parent keys', () => {
      const attributes = { foo: { bar: true, baz: true } };
      applyKeyMapping(attributes, { foo: 'baz', 'foo.bar': 'bar' });
      expect(attributes).to.have.property('bar', true);
      expect(attributes)
        .to.have.property('baz')
        .and.to.have.property('baz', true);
      expect(attributes).to.not.have.property('foo');
    });
  });

  describe('filter attributes', () => {
    let attributes;

    beforeAll(() => {
      attributes = {
        foo: { bar: true, baz: false },
        bar: true,
        baz: true,
        'foo.bar': { foo: true, bar: true },
        fooBar: { foo: { bar: null } },
      };
    });

    it('should filter for top level keys', () => {
      const filtered = applyAttributeFilter(attributes, ['bar']);
      expect(filtered).to.have.property('bar', true);
      expect(filtered).to.have.all.keys(['bar']);
    });

    it('should filter for nested keys', () => {
      const filtered = applyAttributeFilter(attributes, ['foo.baz']);
      expect(filtered).to.have.nested.property('foo.baz', false);

      expect(filtered).to.have.all.keys(['foo']);
      expect(filtered.foo).to.have.all.keys(['baz']);
    });

    it('should filter for deeply nested keys', () => {
      const filtered = applyAttributeFilter(attributes, ['fooBar.foo.bar']);
      expect(filtered).to.have.nested.property('fooBar.foo.bar', null);
      expect(filtered).to.have.all.keys(['fooBar']);
      expect(filtered.fooBar).to.have.all.keys(['foo']);
      expect(filtered.fooBar.foo).to.have.all.keys(['bar']);
    });

    it('should filter for top level keys with a period', () => {
      const filtered = applyAttributeFilter(attributes, ['foo.bar']);
      expect(filtered)
        .to.have.property('foo.bar')
        .and.to.eql({ foo: true, bar: true });
      expect(filtered).to.have.all.keys(['foo.bar']);
    });
  });

  describe('filter olcs attributes', () => {
    let attributes;

    beforeAll(() => {
      attributes = {
        foo: { bar: true, baz: false },
        bar: true,
        baz: true,
        'foo.bar': { foo: true, bar: true },
        olcs_storeyHeight: 5,
        olcs_altitudeMode: 'absolute',
      };
    });

    it('should filter olcs keys', () => {
      const filteredOlcs = applyOlcsAttributeFilter(attributes);
      expect(filteredOlcs).to.not.have.property('olcs_storeyHeight');
      expect(filteredOlcs).to.not.have.property('olcs_altitudeMode');
      expect(Object.keys(filteredOlcs)).to.have.length(4);
    });

    it('should leave other keys', () => {
      const keys = ['bar'];
      const filtered = applyAttributeFilter(attributes, keys);
      const filteredOlcs = applyOlcsAttributeFilter(filtered, keys);
      expect(filteredOlcs).to.have.property('bar', true);
      expect(filteredOlcs).to.not.have.property('olcs_storeyHeight');
      expect(filteredOlcs).to.not.have.property('olcs_altitudeMode');
    });

    it('should NOT filter olcs keys provided as attributeKeys', () => {
      const keys = ['bar', 'olcs_storeyHeight'];
      const filtered = applyAttributeFilter(attributes, keys);
      const filteredOlcs = applyOlcsAttributeFilter(filtered, keys);
      expect(filtered).to.have.property('bar', true);
      expect(filteredOlcs).to.have.property('olcs_storeyHeight', 5);
    });

    it('should NOT filter olcs keys mapped using keyMapping', () => {
      applyKeyMapping(attributes, { olcs_storeyHeight: 'Storey Height' });
      const filteredOlcs = applyOlcsAttributeFilter(attributes);
      expect(filteredOlcs).to.not.have.property('olcs_altitudeMode');
      expect(filteredOlcs).to.have.property('Storey Height', 5);
    });
  });

  describe('filter attributes having empty objects as value', () => {
    let attributes;

    beforeAll(() => {
      attributes = {
        foo: { bar: true, baz: false },
        bar: true,
        baz: true,
        'foo.bar': { foo: true, bar: true },
        emptyObject: {},
      };
    });

    it('should filter empty object values', () => {
      const filtered = applyEmptyAttributesFilter(attributes);
      expect(filtered).to.not.have.property('emptyObject');
      expect(Object.keys(filtered)).to.have.length(4);
    });
  });

  describe('getAttributes', () => {
    it('should filter attributes by given attributeKeys', () => {
      expect(abstractFeatureInfoView.getAttributes(feature)).to.be.deep.equal(
        filteredAttributes,
      );
    });

    it('should apply value mapping', () => {
      abstractFeatureInfoView.valueMapping = {
        // eslint-disable-next-line no-template-curly-in-string
        function: 'codeLists.values.function.${value}',
        usage: { 1010: 'mappedValueUsage' },
      };
      expect(abstractFeatureInfoView.getAttributes(feature)).to.be.deep.equal({
        ...filteredAttributes,
        function: `codeLists.values.function.${filteredAttributes.function}`,
      });
      abstractFeatureInfoView.valueMapping = undefined;
    });

    it('should apply key mapping and delete replaced keys', () => {
      abstractFeatureInfoView.keyMapping = {
        function: 'codeLists.keys.function',
      };
      const { name } = filteredAttributes;
      expect(abstractFeatureInfoView.getAttributes(feature)).to.be.deep.equal({
        name,
        'codeLists.keys.function': filteredAttributes.function,
      });
      expect(
        abstractFeatureInfoView.getAttributes(feature),
      ).to.not.have.property('function');
    });
  });

  describe('getTags', () => {
    it('should return tags for available feature attributes', () => {
      abstractFeatureInfoView.tags = {
        name: { tag: 'b' },
        description: { tag: 's' },
      };
      expect(abstractFeatureInfoView.getTags(feature)).to.be.deep.equal({
        name: { tag: 'b' },
      });
    });

    it('should return supported tags only', () => {
      abstractFeatureInfoView.tags = {
        function: { tag: 'script' },
      };
      expect(abstractFeatureInfoView.getTags(feature)).to.be.deep.equal({});
    });

    it('should map tags key', () => {
      abstractFeatureInfoView.keyMapping = {
        name: 'mappedName',
      };
      abstractFeatureInfoView.tags = {
        name: { tag: 'b' },
      };
      expect(abstractFeatureInfoView.getTags(feature)).to.be.deep.equal({
        mappedName: { tag: 'b' },
      });
      abstractFeatureInfoView.keyMapping = undefined;
    });

    it('should map tags option values', () => {
      abstractFeatureInfoView.tags = {
        // eslint-disable-next-line no-template-curly-in-string
        name: { tag: 'a', href: 'https://de.wikipedia.org/wiki/${value}' },
      };
      expect(abstractFeatureInfoView.getTags(feature)).to.be.deep.equal({
        name: { tag: 'a', href: 'https://de.wikipedia.org/wiki/testFeature' },
      });
    });
  });

  describe('getWindowComponentOptions', () => {
    let app;
    let layer;

    beforeAll(() => {
      app = new VcsUiApp();
      layer = new VectorLayer({});
    });

    it('should evaluate a template string in window headerTitle', () => {
      abstractFeatureInfoView.window.state = { headerTitle: '{{function}}' };
      expect(
        abstractFeatureInfoView.getWindowComponentOptions(
          app,
          { feature },
          layer,
        ).state,
      ).to.have.property('headerTitle', `${feature.getProperty('function')}`);
    });

    it('should evaluate a template string in window headerTitle with multiple variables', () => {
      abstractFeatureInfoView.window.state = {
        headerTitle: '{{layerName}} - {{function}}',
      };
      expect(
        abstractFeatureInfoView.getWindowComponentOptions(
          app,
          { feature },
          layer,
        ).state,
      ).to.have.property(
        'headerTitle',
        `${layer.name} - ${feature.getProperty('function')}`,
      );
    });

    it('should evaluate a concatenated template string in window headerTitle', () => {
      abstractFeatureInfoView.window.state = {
        headerTitle: ['{{layerName}}', ' - ', '{{function}}'],
      };
      expect(
        abstractFeatureInfoView.getWindowComponentOptions(
          app,
          { feature },
          layer,
        ).state,
      ).to.have.deep.property('headerTitle', [
        layer.name,
        ' - ',
        `${feature.getProperty('function')}`,
      ]);
    });
  });

  describe('getting config', () => {
    describe('of a default abstractFeatureInfoView', () => {
      it('should return the type and name', () => {
        const abstractView = new AbstractFeatureInfoView(
          { name: 'TestView' },
          { name: 'VueComponent' },
        );
        const config = abstractView.toJSON();
        expect(config).to.have.property('type', 'AbstractFeatureInfoView');
        expect(config).to.have.property('name', 'TestView');
      });
    });

    describe('of a configured abstractFeatureInfoView', () => {
      let inputConfig;
      let outputConfig;

      beforeAll(() => {
        inputConfig = {
          name: 'TestView',
          attributeKeys: ['gml:name', 'function'],
          keyMapping: {
            function: 'codeLists.keys.function',
          },
          valueMapping: {
            // eslint-disable-next-line no-template-curly-in-string
            function: 'codeLists.values.function.${value}',
          },
          window: {
            position: [0, 0],
          },
        };
        const abstractView = new AbstractFeatureInfoView(inputConfig, {
          name: 'VueComponent',
        });
        outputConfig = abstractView.toJSON();
        abstractView.destroy();
      });

      it('should configure name', () => {
        expect(outputConfig).to.have.property('name', 'TestView');
      });

      it('should configure attributeKeys', () => {
        expect(outputConfig.attributeKeys).to.deep.equal(
          inputConfig.attributeKeys,
        );
      });

      it('should configure keyMapping', () => {
        expect(outputConfig.keyMapping).to.have.property(
          'function',
          inputConfig.keyMapping.function,
        );
      });

      it('should configure valueMapping', () => {
        expect(outputConfig.valueMapping).to.have.property(
          'function',
          inputConfig.valueMapping.function,
        );
      });

      it('should configure window', () => {
        expect(outputConfig.window).to.have.property(
          'position',
          inputConfig.window.position,
        );
      });
    });
  });
});
