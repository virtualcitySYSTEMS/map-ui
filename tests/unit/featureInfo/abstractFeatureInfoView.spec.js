import {
  describe,
  beforeAll,
  expect,
  it,
} from 'vitest';
import { Feature } from 'ol';
import Point from 'ol/geom/Point.js';
import AbstractFeatureInfoView, {
  applyKeyMapping,
  applyValueMapping,
} from '../../../src/featureInfo/abstractFeatureInfoView.js';

describe('AbstractFeatureInfoView', () => {
  let abstractFeatureInfoView;
  let feature;
  let featureId;
  let filteredAttributes;

  beforeAll(() => {
    abstractFeatureInfoView = new AbstractFeatureInfoView({
      name: 'TestView',
      attributeKeys: ['name', 'function'],
    }, { name: 'VueComponent' });

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
      // eslint-disable-next-line no-template-curly-in-string
      applyValueMapping(attributes, { function: 'codeLists.values.function.${value}' });
      expect(attributes).to.have.property('function', `codeLists.values.function.${feature.getProperty('function')}`);
    });
  });

  describe('applyKeyMapping', () => {
    it('should return mapped key, if mapping provides a new key', () => {
      const attributes = { ...filteredAttributes };
      applyKeyMapping(attributes, { function: 'mappedKeyFunction' });
      expect(attributes).to.have.property('mappedKeyFunction', filteredAttributes.function);
    });

    it('should delete old key, if mapping provides a new key', () => {
      const attributes = { ...filteredAttributes };
      applyKeyMapping(attributes, { function: 'mappedKeyFunction' });
      expect(attributes).to.not.have.property('function');
    });

    it('should leave key unchanged, if mapping does NOT provide a new value', () => {
      const attributes = { ...filteredAttributes };
      applyKeyMapping(attributes, { usage: 'mappedKeyUsage' });
      expect(attributes).to.have.property('function', filteredAttributes.function);
    });
  });

  describe('getAttributes', () => {
    it('should filter attributes by given attributeKeys', () => {
      expect(abstractFeatureInfoView.getAttributes(feature)).to.be.deep.equal(filteredAttributes);
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
    });
    it('should apply key mapping and delete replaced keys', () => {
      abstractFeatureInfoView.keyMapping = {
        function: 'codeLists.keys.function',
      };
      const { name } = filteredAttributes;
      expect(abstractFeatureInfoView.getAttributes(feature)).to.be.deep.equal({
        name,
        'codeLists.keys.function': `codeLists.values.function.${filteredAttributes.function}`,
      });
      expect(abstractFeatureInfoView.getAttributes(feature)).to.not.have.property('function');
    });
  });

  describe('getting config', () => {
    describe('of a default abstractFeatureInfoView', () => {
      it('should return the type and name', () => {
        const abstractView = new AbstractFeatureInfoView({ name: 'TestView' }, { name: 'VueComponent' });
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
        const abstractView = new AbstractFeatureInfoView(inputConfig, { name: 'VueComponent' });
        outputConfig = abstractView.toJSON();
        abstractView.destroy();
      });

      it('should configure name', () => {
        expect(outputConfig).to.have.property('name', 'TestView');
      });
      it('should configure attributeKeys', () => {
        expect(outputConfig.attributeKeys).to.deep.equal(inputConfig.attributeKeys);
      });
      it('should configure keyMapping', () => {
        expect(outputConfig.keyMapping).to.have.property('function', inputConfig.keyMapping.function);
      });
      it('should configure valueMapping', () => {
        expect(outputConfig.valueMapping).to.have.property('function', inputConfig.valueMapping.function);
      });
      it('should configure window', () => {
        expect(outputConfig.window).to.have.property('position', inputConfig.window.position);
      });
    });
  });
});
