import {
  describe,
  beforeAll,
  beforeEach,
  afterEach,
  it,
  expect,
  vi,
} from 'vitest';
import { watch } from 'vue';
import UiConfig from '../../src/uiConfig.js';
import { sleep } from '../helpers.js';

describe('UiConfig', () => {
  let getDynamicContextId;

  beforeAll(() => {
    getDynamicContextId = () => 'dynamicContextId';
  });

  describe('adding of keys', () => {
    /**
     * @type {UiConfig}
     */
    let uiConfig;

    beforeEach(() => {
      uiConfig = new UiConfig(getDynamicContextId);
    });

    afterEach(() => {
      uiConfig.destroy();
    });

    it('should add a key', () => {
      uiConfig.add({ name: 'foo', value: 'bar' });
      expect(uiConfig.config.value).to.have.property('foo', 'bar');
    });

    it('should update a key on override', () => {
      uiConfig.add({ name: 'foo', value: 'bar' });
      uiConfig.override({ name: 'foo', value: 'baz' });
      expect(uiConfig.config.value).to.have.property('foo', 'baz');
    });

    it('should trigger a change on the ref, if a key changes', async () => {
      uiConfig.add({ name: 'foo', value: 'bar' });
      const spy = vi.fn();
      const watcher = watch(uiConfig.config, spy);
      uiConfig.override({ name: 'foo', value: 'baz' });
      await sleep();
      watcher();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('removing of keys', () => {
    /**
     * @type {UiConfig}
     */
    let uiConfig;
    let item;

    beforeEach(() => {
      uiConfig = new UiConfig(getDynamicContextId);
      item = { name: 'foo', value: 'bar' };
      uiConfig.add(item);
    });

    afterEach(() => {
      uiConfig.destroy();
    });

    it('should remove a key', () => {
      uiConfig.remove(item);
      expect(uiConfig.config.value).to.not.have.property('foo');
    });

    it('should trigger a change on the ref, if a key changes', async () => {
      const spy = vi.fn();
      const watcher = watch(uiConfig.config, spy);
      uiConfig.remove(item);
      await sleep();
      watcher();
      expect(spy).toHaveBeenCalled();
    });
  });
});
