import { ObliqueMap, ObliqueViewDirection } from '@vcmap/core';
import { mount } from '@vue/test-utils';
import { describe, beforeEach, afterEach, it, expect, vi } from 'vitest';
import VcsUiApp from '../../../src/vcsUiApp.js';
import VcsObliqueFooter from '../../../src/application/VcsObliqueFooter.vue';

/**
 * @param {Element} root
 * @returns {string[]} all attribute names starting with "on" within root (inclusive)
 */
function getEventHandlerAttributes(root) {
  return [root, ...root.querySelectorAll('*')].flatMap((element) =>
    element
      .getAttributeNames()
      .filter((name) => name.toLowerCase().startsWith('on')),
  );
}

describe('VcsObliqueFooter', () => {
  let app;
  let image;
  let component;

  beforeEach(() => {
    app = new VcsUiApp();
    image = {
      name: '<img src=x onerror="alert(document.cookie)">',
      viewDirection: ObliqueViewDirection.NORTH,
    };
    const map = new ObliqueMap({ name: 'oblique' });
    Object.defineProperty(map, 'currentImage', { get: () => image });
    vi.spyOn(app.maps, 'activeMap', 'get').mockReturnValue(map);
  });

  afterEach(() => {
    component?.unmount();
    component = undefined;
    app.destroy();
  });

  function mountFooter() {
    component = mount(VcsObliqueFooter, {
      global: {
        plugins: [app.vueI18nPlugin],
        provide: { vcsApp: app },
      },
    });
    return component;
  }

  describe('with the default template', () => {
    it('should render the image information', () => {
      image.name = 'my-image';
      const wrapper = mountFooter();
      expect(wrapper.text()).to.equal('Oblique image: my-image - north');
    });

    it('should not render event handler attributes from the image name', () => {
      const wrapper = mountFooter();
      expect(wrapper.find('img').exists()).to.be.true;
      expect(getEventHandlerAttributes(wrapper.element)).to.be.empty;
      expect(wrapper.html()).not.to.contain('onerror');
    });
  });

  describe('with a custom template', () => {
    it('should not render event handler attributes from interpolated image properties', () => {
      image.foo = '<a href="#" onclick="alert(1)">click</a>';
      app.uiConfig.add({
        name: 'obliqueFooterTemplate',
        value: '**{{ foo }}** {{ name }}',
      });
      const wrapper = mountFooter();
      expect(wrapper.find('strong').exists()).to.be.true;
      expect(getEventHandlerAttributes(wrapper.element)).to.be.empty;
      expect(wrapper.html()).not.to.contain('onclick');
      expect(wrapper.html()).not.to.contain('onerror');
    });
  });
});
