import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { Collection } from '@vcmap/core';
import I18nCollection, {
  mergeDeep,
  isObject,
} from '../../src/i18n/i18nCollection.js';

describe('i18nCollection', () => {
  describe('isObject', () => {
    it('should return if item is an object', () => {
      expect(isObject({})).to.be.true;
    });

    it('should return false if the item is not an object', () => {
      expect(isObject(2)).to.be.false;
      expect(isObject([])).to.be.false;
      expect(isObject(null)).to.be.false;
      expect(isObject(false)).to.be.false;
      expect(isObject(undefined)).to.be.false;
      expect(isObject(String('test'))).to.be.false;
      expect(isObject('test')).to.be.false;
    });
  });

  describe('mergeDeep', () => {
    it('should create a deep copy of a given source', () => {
      const source = { test: { test2: 2 } };
      const merged = mergeDeep(source);
      expect(merged).to.not.equal(source);
      expect(merged.test).to.not.equal(source.test);
      expect(merged).to.be.deep.equal(source);
    });

    it('should merge two sources', () => {
      const source = { test: { test2: 2 } };
      const source2 = { test2: { test2: 2 } };
      const merged = mergeDeep(source, source2);
      expect(merged).to.have.keys(['test', 'test2']);
    });

    it('should deep merge two sources', () => {
      const source = { test: { test2: 2 } };
      const source2 = { test: { test3: 2 } };
      const merged = mergeDeep(source, source2);
      expect(merged.test).to.have.keys(['test2', 'test3']);
    });

    it('should deep merge several sources', () => {
      const source = { test: { test2: 2 } };
      const source2 = { test: { test3: 2 } };
      const source3 = { test: { test3: 3 } };
      const source4 = { test: { test4: {} } };
      const merged = mergeDeep(source, source2, source3, source4);
      expect(merged.test).to.have.keys(['test2', 'test3', 'test4']);
      expect(merged.test.test3).to.be.equal(3);
    });

    it('should replace atomic values on a merge', () => {
      const source = { test: { test2: 2 } };
      const source2 = { test: { test2: 3 } };
      const merged = mergeDeep(source, source2);
      expect(merged.test.test2).to.be.equal(3);
    });

    it('should replace an array value on a merge', () => {
      const source = { test: { test2: [2, 3] } };
      const source2 = { test: { test2: 3 } };
      const merged = mergeDeep(source, source2);
      expect(merged.test.test2).to.be.equal(3);
    });

    it('should not replace a complex key with an atomic value', () => {
      const source = { test: { test2: 2 } };
      const source2 = { test: 2 };
      const merged = mergeDeep(source, source2);
      expect(merged.test).to.be.deep.equal(source.test);
    });
  });

  describe('i18n', () => {
    let i18n;
    let plugins;
    let testItem;
    let plugin;

    beforeEach(() => {
      plugins = new Collection();
      i18n = new I18nCollection(plugins);
      testItem = { name: 'test', de: { test: 'Test' }, en: { test: 'test' } };
      plugin = {
        name: 'plugin',
        version: '1.0.0',
        initialize() {},
        i18n: { de: { plugin: 'Plugin' }, en: { plugin: 'plugin' } },
      };
    });

    afterEach(() => {
      i18n.destroy();
    });

    describe('default Messages', () => {
      it('should add the default messages to the i18n Collection', () => {
        expect(i18n.getMergedMessages()).to.have.keys(['de', 'en']);
      });
    });

    describe('changed event', () => {
      let changedSpy;

      beforeEach(() => {
        changedSpy = vi.fn();
      });

      it('should raise changed on item added', () => {
        i18n.changed.addEventListener(changedSpy);
        i18n.add(testItem);
        expect(changedSpy).toHaveBeenCalledTimes(1);
        expect(changedSpy).toHaveBeenLastCalledWith(testItem);
      });

      it('should raise changed on item moved', () => {
        i18n.add(testItem);
        i18n.add({ name: 'otherItem' });
        i18n.changed.addEventListener(changedSpy);
        i18n.moveTo(testItem, 1);
        expect(changedSpy).toHaveBeenCalledTimes(1);
        expect(changedSpy).toHaveBeenLastCalledWith(testItem);
      });

      it('should raise changed on item removed', () => {
        i18n.add(testItem);
        i18n.changed.addEventListener(changedSpy);
        i18n.remove(testItem);
        expect(changedSpy).toHaveBeenCalledTimes(1);
        expect(changedSpy).toHaveBeenLastCalledWith(testItem);
      });

      it('should raise changed on plugin added', () => {
        i18n.changed.addEventListener(changedSpy);
        plugins.add(plugin);
        expect(changedSpy).toHaveBeenCalledTimes(1);
        expect(changedSpy).toHaveBeenLastCalledWith({
          name: plugin.name,
          ...plugin.i18n,
        });
      });

      it('should raise changed on plugin removed', () => {
        plugins.add(plugin);
        i18n.changed.addEventListener(changedSpy);
        plugins.remove(plugin);
        expect(changedSpy).toHaveBeenCalledTimes(1);
        expect(changedSpy).toHaveBeenLastCalledWith({
          name: plugin.name,
          ...plugin.i18n,
        });
      });

      it('should NOT raise changed, if item add failed', () => {
        i18n.add(testItem);
        i18n.changed.addEventListener(changedSpy);
        const idx = i18n.add(testItem);
        expect(idx).to.be.null;
        expect(changedSpy).toHaveBeenCalledTimes(0);
      });

      it('should NOT raise changed, if item remove failed', () => {
        i18n.changed.addEventListener(changedSpy);
        i18n.remove({ name: 'otherItem' });
        expect(changedSpy).toHaveBeenCalledTimes(0);
      });
    });

    describe('plugin handling', () => {
      it('should add plugins Items to the mergedMessages', () => {
        plugins.add(plugin);
        const mergedMessages = i18n.getMergedMessages();
        expect(mergedMessages.de).to.have.property('plugin', 'Plugin');
        expect(mergedMessages.en).to.have.property('plugin', 'plugin');
      });

      it('should remove plugin items from the MergedMessages', async () => {
        plugins.remove(plugin);
        const mergedMessages = i18n.getMergedMessages();
        expect(plugins.size).to.equal(0);
        expect(mergedMessages.de).to.not.have.property('plugin', 'Plugin');
        expect(mergedMessages.en).to.not.have.property('plugin', 'plugin');
      });
    });
  });
});
