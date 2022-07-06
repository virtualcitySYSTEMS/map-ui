import {
  describe,
  beforeAll,
  expect,
  it,
} from 'vitest';
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
});
