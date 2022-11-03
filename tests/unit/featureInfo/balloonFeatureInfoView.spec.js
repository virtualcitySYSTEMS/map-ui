import {
  describe,
  beforeAll,
  expect,
  it,
} from 'vitest';
import BalloonFeatureInfoView from '../../../src/featureInfo/balloonFeatureInfoView.js';

describe('BalloonFeatureInfoView', () => {
  describe('getting config', () => {
    describe('of a default BalloonFeatureInfoView', () => {
      it('should return the type and name', () => {
        const abstractView = new BalloonFeatureInfoView({ name: 'TestView' });
        const config = abstractView.toJSON();
        expect(config).to.have.property('type', 'BalloonFeatureInfoView');
        expect(config).to.have.property('name', 'TestView');
      });
    });

    describe('of a configured BalloonFeatureInfoView', () => {
      let inputConfig;
      let outputConfig;

      beforeAll(() => {
        inputConfig = {
          name: 'TestView',
          balloonTitle: 'My Balloon title',
          balloonSubtitle: 'My Balloon subtitle',
        };
        const abstractView = new BalloonFeatureInfoView(inputConfig);
        outputConfig = abstractView.toJSON();
        abstractView.destroy();
      });

      it('should configure name', () => {
        expect(outputConfig).to.have.property('name', 'TestView');
      });
      it('should configure title', () => {
        expect(outputConfig).to.have.property('balloonTitle', inputConfig.balloonTitle);
      });
      it('should configure src', () => {
        expect(outputConfig).to.have.property('balloonSubtitle', inputConfig.balloonSubtitle);
      });
    });
  });
});
