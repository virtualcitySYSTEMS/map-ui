import { describe, beforeAll, expect, it } from 'vitest';
import TableFeatureInfoView from '../../../src/featureInfo/tableFeatureInfoView.js';

describe('TableFeatureInfoView', () => {
  describe('getting config', () => {
    describe('of a default IframeFeatureInfoView', () => {
      it('should return the type and name', () => {
        const abstractView = new TableFeatureInfoView({ name: 'TestView' });
        const config = abstractView.toJSON();
        expect(config).to.have.property('type', 'TableFeatureInfoView');
        expect(config).to.have.property('name', 'TestView');
      });
    });

    describe('of a configured IframeFeatureInfoView', () => {
      let inputConfig;
      let outputConfig;

      beforeAll(() => {
        inputConfig = {
          name: 'TestView',
          itemsPerPageArray: [5, 10, 20],
          itemsPerPage: 5,
          showSearchbar: true,
          searchbarPlaceholder: 'search',
        };
        const tableView = new TableFeatureInfoView(inputConfig);
        outputConfig = tableView.toJSON();
        tableView.destroy();
      });

      it('should configure name', () => {
        expect(outputConfig).to.have.property('name', 'TestView');
      });

      it('should configure itemsPerPageArray', () => {
        expect(outputConfig).to.have.property(
          'itemsPerPageArray',
          inputConfig.itemsPerPageArray,
        );
      });

      it('should configure itemsPerPage', () => {
        expect(outputConfig).to.have.property(
          'itemsPerPage',
          inputConfig.itemsPerPage,
        );
      });

      it('should configure searchbarPlaceholder', () => {
        expect(outputConfig).to.have.property(
          'searchbarPlaceholder',
          inputConfig.searchbarPlaceholder,
        );
      });
    });
  });
});
