import {
  describe,
  beforeAll,
  afterAll,
  expect,
  it,
  vi,
} from 'vitest';
import { Feature } from 'ol';
import FeatureInfoInteraction from '../../../src/featureInfo/featureInfoInteraction.js';

describe('FeatureInfoInteraction', () => {
  let featureInfoInteraction;
  let feature;
  let position;
  let windowPosition;
  let featureChangedSpy;

  beforeAll(() => {
    featureInfoInteraction = new FeatureInfoInteraction();
    feature = new Feature();
    position = [1, 1];
    windowPosition = [0, 0];
  });

  afterAll(() => {
    featureInfoInteraction.destroy();
  });

  describe('selecting a feature', () => {
    beforeAll(() => {
      featureChangedSpy = vi.fn();
      featureInfoInteraction.featureChanged.addEventListener(featureChangedSpy);
      featureInfoInteraction.selectFeature(feature, position, windowPosition);
    });

    it('should set selected feature', () => {
      expect(featureInfoInteraction.selectedFeature).to.equal(feature);
    });
    it('should set clicked position', () => {
      expect(featureInfoInteraction.clickedPosition).to.equal(position);
    });
    it('should raise featureChanged', () => {
      expect(featureChangedSpy).toHaveBeenCalledTimes(1);
      expect(featureChangedSpy).toHaveBeenLastCalledWith({ feature, position, windowPosition });
    });
  });

  describe('clear', () => {
    beforeAll(() => {
      featureChangedSpy = vi.fn();
      featureInfoInteraction.featureChanged.addEventListener(featureChangedSpy);
      featureInfoInteraction.clear();
    });

    it('should unset selected feature', () => {
      expect(featureInfoInteraction.selectedFeature).to.be.null;
    });
    it('should unset clicked position', () => {
      expect(featureInfoInteraction.clickedPosition).to.be.null;
    });
    it('should raise featureChanged', () => {
      expect(featureChangedSpy).toHaveBeenCalledTimes(1);
      expect(featureChangedSpy).toHaveBeenLastCalledWith(null);
    });
  });
});
