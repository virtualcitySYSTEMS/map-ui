import { describe, beforeAll, expect, it } from 'vitest';
import { Feature } from 'ol';
import Point from 'ol/geom/Point.js';
import AddressBalloonFeatureInfoView from '../../../src/featureInfo/addressBalloonFeatureInfoView.js';

describe('AddressBalloonFeatureInfoView', () => {
  describe('getting attributes', () => {
    let addressBalloonFeatureInfoView;
    let feature;
    let featureId;
    let addressAttributes;

    beforeAll(() => {
      addressBalloonFeatureInfoView = new AddressBalloonFeatureInfoView({
        name: 'TestView',
        country: null,
      });

      featureId = 'test';
      addressAttributes = {
        name: 'testFeature',
        'gml:name': 'VCS',
        Address: {
          Street: 'Tauentzienstr',
          HouseNumber: '7BC',
          City: 'Berlin',
          ZipCode: '10787',
          Country: 'Deutschland',
        },
      };
      feature = new Feature();
      feature.setGeometry(new Point([1, 1]));
      feature.setId(featureId);
      feature.setProperties(addressAttributes);
    });

    it('should map address attributes existing on the feature', () => {
      const attributes = addressBalloonFeatureInfoView.getAttributes(feature);
      expect(attributes).to.have.property(
        'addressName',
        addressAttributes['gml:name'],
      );
      expect(attributes).to.have.property(
        'street',
        addressAttributes.Address.Street,
      );
      expect(attributes).to.have.property(
        'number',
        addressAttributes.Address.HouseNumber,
      );
      expect(attributes).to.have.property(
        'city',
        addressAttributes.Address.City,
      );
      expect(attributes).to.have.property(
        'zip',
        addressAttributes.Address.ZipCode,
      );
    });

    it('should NOT pass address keys configured with null', () => {
      expect(
        addressBalloonFeatureInfoView.getAttributes(feature),
      ).not.to.have.property('country');
    });
  });

  describe('getting config', () => {
    describe('of a default AddressBalloonFeatureInfoView', () => {
      it('should return the type and name', () => {
        const abstractView = new AddressBalloonFeatureInfoView({
          name: 'TestView',
        });
        const config = abstractView.toJSON();
        expect(config).to.have.property(
          'type',
          'AddressBalloonFeatureInfoView',
        );
        expect(config).to.have.property('name', 'TestView');
      });
    });

    describe('of a configured AddressBalloonFeatureInfoView', () => {
      let inputConfig;
      let outputConfig;

      beforeAll(() => {
        inputConfig = {
          addressName: 'VCS',
          street: 'Tauentzienstr',
          number: '7BC',
          city: 'Berlin',
          zip: '10787',
          country: 'Deutschland',
        };
        const abstractView = new AddressBalloonFeatureInfoView(inputConfig);
        outputConfig = abstractView.toJSON();
        abstractView.destroy();
      });

      it('should configure addressName', () => {
        expect(outputConfig).to.have.property('addressName', 'VCS');
      });
      it('should configure street', () => {
        expect(outputConfig).to.have.property('street', inputConfig.street);
      });
      it('should configure number', () => {
        expect(outputConfig).to.have.property('number', inputConfig.number);
      });
      it('should configure city', () => {
        expect(outputConfig).to.have.property('city', inputConfig.city);
      });
      it('should configure zip', () => {
        expect(outputConfig).to.have.property('zip', inputConfig.zip);
      });
      it('should configure country', () => {
        expect(outputConfig).to.have.property('country', inputConfig.country);
      });
    });
  });
});
