import {
  describe,
  beforeAll,
  afterAll,
  it,
  expect,
} from 'vitest';
import { getPluginAssetUrl, pluginBaseUrlSymbol, VcsUiApp } from '../../index.js';

describe('getPluginAssetUrl', () => {
  let app;
  let plugin;

  beforeAll(() => {
    app = new VcsUiApp();
    plugin = { name: 'foo' };
    app.plugins.add(plugin);
  });

  afterAll(() => {
    app.destroy();
  });

  it('should return the asset url on a pathless base', () => {
    plugin[pluginBaseUrlSymbol] = 'http://localhost';
    expect(getPluginAssetUrl(app, 'foo', 'foo/bar.json')).to.equal('http://localhost/foo/bar.json');
  });

  it('should return the asset url on a pathed base', () => {
    plugin[pluginBaseUrlSymbol] = 'http://localhost/baz/';
    expect(getPluginAssetUrl(app, 'foo', 'foo/bar.json')).to.equal('http://localhost/baz/foo/bar.json');
  });

  it('should return the asset url with base query intact', () => {
    plugin[pluginBaseUrlSymbol] = 'http://localhost/?foo=true';
    expect(getPluginAssetUrl(app, 'foo', 'foo/bar.json')).to.equal('http://localhost/foo/bar.json?foo=true');
  });

  it('should return the asset url with asset query intact', () => {
    plugin[pluginBaseUrlSymbol] = 'http://localhost/';
    expect(getPluginAssetUrl(app, 'foo', 'foo/bar.json?foo=true')).to.equal('http://localhost/foo/bar.json?foo=true');
  });

  it('should return the asset url merging asset & base query intact', () => {
    plugin[pluginBaseUrlSymbol] = 'http://localhost/?bar=true';
    expect(getPluginAssetUrl(app, 'foo', 'foo/bar.json?foo=true')).to.equal('http://localhost/foo/bar.json?foo=true&bar=true');
  });

  it('should return the asset url preferring asset query', () => {
    plugin[pluginBaseUrlSymbol] = 'http://localhost/?bar=true&foo=true';
    expect(getPluginAssetUrl(app, 'foo', 'foo/bar.json?bar=false')).to.equal('http://localhost/foo/bar.json?bar=false&foo=true');
  });
});
