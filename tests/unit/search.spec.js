import {
  describe, expect, it, beforeAll, beforeEach, afterAll, afterEach, vi,
} from 'vitest';
import { Feature } from 'ol';
import Point from 'ol/geom/Point.js';
import { OpenlayersMap } from '@vcmap/core';
import VcsUiApp from '../../src/vcsUiApp.js';
import { createSearchButtonAction } from '../../src/actions/actionHelper.js';


describe('search', () => {
  /** @type {VcsUiApp} */
  let app;
  let impls;

  /**
   * @param {string} name
   * @returns {SearchImpl}
   */
  const getDummyImpl = (name = 'impl') => ({ name, search: () => {}, destroy: () => {} });

  const getAbortImpl = () => {
    let rej;
    const promise = new Promise((resolve, reject) => {
      rej = reject;
    });
    return {
      name: 'abort',
      search: () => promise,
      suggest: () => promise,
      abort: () => {
        rej(new DOMException('This search was aborted', 'AbortError'));
      },
      destroy: () => {},
    };
  };

  const searchFeature = async (q) => {
    const feature = new Feature({
      geometry: new Point([1, 1]),
    });
    feature.setId(`feature-${q}`);
    return {
      title: `feature-${q}`,
      feature,
    };
  };

  const searchClicked = async (q) => {
    return {
      title: `clicked-${q}`,
      clicked: () => {},
    };
  };

  const searchInvalidResult = async (q) => {
    return { title: `invalid-${q}` };
  };

  describe('add search implementation', () => {
    beforeAll(async () => {
      app = new VcsUiApp();
      const map = new OpenlayersMap({ name: 'ol' });
      app.maps.add(map);
      await app.maps.setActiveMap(map.name);
    });

    afterAll(() => {
      app.destroy();
    });

    it('should add search impl to the collection', () => {
      app.search.add(getDummyImpl('impl1'), 'owner');
      expect([...app.search]).to.have.length(1);
    });

    it('should only be added, if search is provided', () => {
      expect(app.search.add.bind({ name: 'impl', destroy: () => {} }, 'owner')).to.throw();
    });
  });

  describe('remove search implementation by owner', () => {
    beforeAll(async () => {
      app = new VcsUiApp();
      const map = new OpenlayersMap({ name: 'ol' });
      app.maps.add(map);
      await app.maps.setActiveMap(map.name);
      impls = [
        getDummyImpl('impl1'), getDummyImpl('impl2'), getDummyImpl('impl3'),
      ];
      impls.forEach((impl, idx) => app.search.add(impl, `owner-${idx}`));
    });

    afterAll(() => {
      app.destroy();
    });

    it('should remove implementations owned by provided owner', () => {
      app.search.removeOwner('owner-0');
      expect([...app.search]).to.have.ordered.members([impls[1], impls[2]]);
    });
  });

  describe('search', () => {
    beforeAll(async () => {
      app = new VcsUiApp();
      const map = new OpenlayersMap({ name: 'ol' });
      app.maps.add(map);
      await app.maps.setActiveMap(map.name);
      impls = [
        { name: 'impl1', search: searchFeature, destroy: () => {} },
        { name: 'impl2', search: searchClicked, destroy: () => {} },
        { name: 'impl3', search: searchInvalidResult, destroy: () => {} },
      ];
      impls.forEach((impl, idx) => app.search.add(impl, `owner-${idx}`));
    });

    afterAll(() => {
      app.destroy();
    });

    beforeEach(async () => {
      await app.search.search('foo');
    });

    afterEach(() => {
      app.search.clearResults();
    });

    it('should clear old results', async () => {
      await app.search.search('bar');
      expect(app.search.currentResults.value.some(item => item.title.includes('foo'))).to.be.false;
      expect(app.search.currentResults.value.every(item => item.title.includes('bar'))).to.be.true;
    });

    it('should return results of different implementations in the add order of those implementations', () => {
      expect(app.search.currentResults.value.map(r => r.title)).to.have.ordered.members(['feature-foo', 'clicked-foo']);
    });

    it('should filter out results without feature or clicked handler', () => {
      expect(app.search.currentResults.value.some(item => item.title.includes('invalid'))).to.be.false;
    });

    it('should add a default clicked handler to results with feature', () => {
      expect(app.search.currentResults.value.find(item => item.title === 'feature-foo')).to.have.property('clicked');
    });

    it('should add results with feature to the result layer', () => {
      expect(app.search.resultLayer.getFeatureById('feature-foo')).to.exist;
    });
  });

  describe('error handling on search', () => {
    beforeEach(async () => {
      app = new VcsUiApp();
      const map = new OpenlayersMap({ name: 'ol' });
      app.maps.add(map);
      await app.maps.setActiveMap(map.name);
    });

    afterEach(() => {
      app.search.clearResults();
      app.destroy();
    });

    it('should return results, if one impl throws an error', async () => {
      app.search.add({ name: 'impl1', search: searchFeature, destroy: () => {} }, 'impl1');
      app.search.add({ name: 'impl2', search() { return Promise.reject(new Error('Test error')); }, destroy: () => {} }, 'impl2');
      await app.search.search('foo');
      expect(app.search.currentResults.value).to.have.length(1);
    });

    it('should return empty results array, if all impl throw an error', async () => {
      app.search.add({ name: 'impl1', search() { return Promise.reject(new Error('Test error')); }, destroy: () => {} }, 'impl1');
      app.search.add({ name: 'impl2', search() { return Promise.reject(new Error('Test error')); }, destroy: () => {} }, 'impl2');
      await app.search.search('foo');
      expect(app.search.currentResults.value).to.be.empty;
    });

    it('should return an empty results array, if one of the impls aborts', async () => {
      app.search.add({ name: 'impl1', search: searchFeature, destroy: () => {} }, 'impl1');
      app.search.add({ name: 'impl2', search() { return Promise.reject(new Error('Test error')); }, destroy: () => {} }, 'impl2');
      app.search.add(getAbortImpl(), 'abort');
      const searchPromise = app.search.search('foo');
      app.search.abort();
      await searchPromise;
      expect(app.search.currentResults.value).to.be.empty;
    });
  });

  describe('suggest', async () => {
    beforeAll(async () => {
      app = new VcsUiApp();
      const map = new OpenlayersMap({ name: 'ol' });
      app.maps.add(map);
      await app.maps.setActiveMap(map.name);
      impls = [
        { name: 'impl1', search: searchFeature, destroy: () => {} },
        { name: 'impl2', search: searchClicked, suggest: q => [`impl2-${q}`], destroy: () => {} },
        { name: 'impl3', search: searchInvalidResult, suggest: q => [`impl3-${q}`], destroy: () => {} },
      ];
      impls.forEach((impl, idx) => app.search.add(impl, `owner-${idx}`));
    });

    afterAll(() => {
      app.destroy();
    });

    it('should return suggestions of different implementations in the add order of those implementations', async () => {
      const suggestions = await app.search.suggest('foo');
      expect(suggestions).to.have.ordered.members(['impl2-foo', 'impl3-foo']);
    });
  });

  describe('abort', () => {
    beforeAll(async () => {
      app = new VcsUiApp();
      const map = new OpenlayersMap({ name: 'ol' });
      app.maps.add(map);
      await app.maps.setActiveMap(map.name);
      impls = [
        {
          name: 'impl0',
          search: searchFeature,
          suggest: () => { return Promise.resolve('suggestion'); },
          destroy: () => {},
        },
        getAbortImpl(),
      ];
      impls.forEach((impl, idx) => app.search.add(impl, `impl${idx}`));
    });

    afterAll(() => {
      app.destroy();
    });

    it('should return empty result array on abort', async () => {
      const searchPromise = app.search.search('foo');
      app.search.abort();
      await searchPromise;
      expect(app.search.currentResults.value).to.be.empty;
    });

    it('should return empty suggestion array', async () => {
      const suggestionPromise = app.search.suggest('foo');
      app.search.abort();
      const suggestions = await suggestionPromise;
      expect(suggestions).to.be.empty;
    });
  });

  describe('resultsChanged event', () => {
    beforeEach(async () => {
      app = new VcsUiApp();
      const map = new OpenlayersMap({ name: 'ol' });
      app.maps.add(map);
      await app.maps.setActiveMap(map.name);
    });

    afterAll(() => {
      app.destroy();
    });

    afterEach(() => {
      app.search.clearResults();
    });

    it('should raise resultsChanged event, if new result items are available', async () => {
      app.search.add({ name: 'impl1', search: searchFeature, destroy: () => {} }, 'owner');
      const resultsChangedSpy = vi.fn();
      app.search.resultsChanged.addEventListener(resultsChangedSpy);
      await app.search.search('foo');
      expect(resultsChangedSpy).toHaveBeenCalledTimes(1);
    });

    it('should NOT raise resultsChanged event, if result array is empty', async () => {
      app.search.add({ name: 'impl1', search: searchInvalidResult, destroy: () => {} }, 'owner');
      const resultsChangedSpy = vi.fn();
      app.search.resultsChanged.addEventListener(resultsChangedSpy);
      await app.search.search('foo');
      expect(resultsChangedSpy).toHaveBeenCalledTimes(0);
    });

    it('should raise resultsChanged event, if existing results have been cleared', async () => {
      app.search.add({ name: 'impl1', search: searchFeature, destroy: () => {} }, 'owner');
      await app.search.search('foo');
      const resultsChangedSpy = vi.fn();
      app.search.resultsChanged.addEventListener(resultsChangedSpy);
      app.search.clearResults();
      expect(resultsChangedSpy).toHaveBeenCalledTimes(1);
    });

    it('should NOT raise resultsChanged event, if results array has already been empty before clearing', () => {
      const resultsChangedSpy = vi.fn();
      app.search.resultsChanged.addEventListener(resultsChangedSpy);
      app.search.clearResults();
      expect(resultsChangedSpy).toHaveBeenCalledTimes(0);
    });
  });

  describe('clear results', () => {
    beforeAll(async () => {
      app = new VcsUiApp();
      const map = new OpenlayersMap({ name: 'ol' });
      app.maps.add(map);
      await app.maps.setActiveMap(map.name);
      app.search.add({ name: 'impl', search: searchFeature, destroy: () => {} }, 'owner');
      await app.search.search('foo');
      app.search.currentResults.value.find(item => item.title === 'feature-foo').clicked();
      app.search.clearResults();
    });

    afterAll(() => {
      app.destroy();
    });

    it('should clear the results array', () => {
      expect(app.search.currentResults.value).to.be.empty;
    });

    it('should remove all features from the result layer', () => {
      expect(app.search.resultLayer.getFeatures()).to.be.empty;
    });

    it('should clear feature info, if a result feature is selected', () => {
      expect(app.featureInfo.selectedFeature).to.be.null;
    });
  });

  describe('create search action', () => {
    let searchAction;

    beforeAll(async () => {
      app = new VcsUiApp();
      const map = new OpenlayersMap({ name: 'ol' });
      app.maps.add(map);
      await app.maps.setActiveMap(map.name);
      ({ searchAction } = createSearchButtonAction(app));
    });

    afterAll(() => {
      app.destroy();
    });

    it('should return null, if NO search impl is registered on search', () => {
      expect(searchAction.value).to.be.null;
    });

    it('should return an action, if at least one search impl is registered on search', async () => {
      const impl = getDummyImpl();
      await app.search.add(impl, 'owner');
      expect(searchAction.value).to.have.property('name');
      expect(searchAction.value).to.have.property('title');
      expect(searchAction.value).to.have.property('icon');
      expect(searchAction.value).to.have.property('callback');
      app.search.remove(impl);
    });
  });
});
