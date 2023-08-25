import { describe, beforeAll, afterAll, it, expect } from 'vitest';
import VcsUiApp from '../../src/vcsUiApp.js';
import {
  getPluginAssetUrl,
  getPluginEntry,
  pluginBaseUrlSymbol,
} from '../../src/pluginHelper.js';

describe('getPluginAssetUrl', () => {
  let app;
  let plugin;

  beforeAll(() => {
    app = new VcsUiApp();
    plugin = { name: 'foo', version: '1.0.0' };
    app.plugins.add(plugin);
  });

  afterAll(() => {
    app.destroy();
  });

  it('should return the asset url on a pathless base including plugin version', () => {
    plugin[pluginBaseUrlSymbol] = 'http://localhost';
    expect(getPluginAssetUrl(app, 'foo', 'foo/bar.json')).to.equal(
      'http://localhost/foo/bar.json?version=1.0.0',
    );
  });

  it('should return the asset url on a pathed base', () => {
    plugin[pluginBaseUrlSymbol] = 'http://localhost/baz/';
    expect(getPluginAssetUrl(app, 'foo', 'foo/bar.json')).to.equal(
      'http://localhost/baz/foo/bar.json?version=1.0.0',
    );
  });

  it('should return the asset url with base query intact', () => {
    plugin[pluginBaseUrlSymbol] = 'http://localhost/?foo=true';
    expect(getPluginAssetUrl(app, 'foo', 'foo/bar.json')).to.equal(
      'http://localhost/foo/bar.json?foo=true&version=1.0.0',
    );
  });

  it('should return the asset url with asset query intact', () => {
    plugin[pluginBaseUrlSymbol] = 'http://localhost/';
    expect(getPluginAssetUrl(app, 'foo', 'foo/bar.json?foo=true')).to.equal(
      'http://localhost/foo/bar.json?foo=true&version=1.0.0',
    );
  });

  it('should return the asset url merging asset & base query intact', () => {
    plugin[pluginBaseUrlSymbol] = 'http://localhost/?bar=true';
    expect(getPluginAssetUrl(app, 'foo', 'foo/bar.json?foo=true')).to.equal(
      'http://localhost/foo/bar.json?foo=true&bar=true&version=1.0.0',
    );
  });

  it('should return the asset url preferring asset query', () => {
    plugin[pluginBaseUrlSymbol] = 'http://localhost/?bar=true&foo=true';
    expect(getPluginAssetUrl(app, 'foo', 'foo/bar.json?bar=false')).to.equal(
      'http://localhost/foo/bar.json?bar=false&foo=true&version=1.0.0',
    );
  });
});

describe('getPluginEntry', () => {
  let base;

  beforeAll(() => {
    base = 'http://localhost/map';
  });

  it('should return a relative url, if base is the same', () => {
    expect(
      getPluginEntry(base, 'http://localhost/map/plugins/foo/index.js'),
    ).to.equal('plugins/foo/index.js');
  });

  it('should return an absolute url, if base is different', () => {
    console.log(
      getPluginEntry(
        base,
        'https://virtualcitymap.de/map/plugins/foo/index.js',
      ),
    );
    expect(
      getPluginEntry(
        base,
        'https://virtualcitymap.de/map/plugins/foo/index.js',
      ),
    ).to.equal('https://virtualcitymap.de/map/plugins/foo/index.js');
  });
});
