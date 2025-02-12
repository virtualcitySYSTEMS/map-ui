import { describe, expect, it } from 'vitest';
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
});
