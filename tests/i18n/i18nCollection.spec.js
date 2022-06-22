import {
  describe,
  expect,
  it,
  beforeEach, afterEach,
} from 'vitest';
import { contextIdSymbol } from '@vcmap/core';
import I18nCollection, { mergeDeep, isObject, i18nPluginSymbol } from '../../src/i18n/i18nCollection.js';


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
      const source4 = { test: { test4: { } } };
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
    let elem1;
    let elem2;

    beforeEach(() => {
      i18n = new I18nCollection(() => { return 'contextId'; });
      elem1 = { de: { myKey: 'test' } };
      elem2 = { de: { myKey2: 'test2' } };
      i18n.add(elem1);
      i18n.add(elem2);
    });

    afterEach(() => {
      i18n.destroy();
    });

    it('should add the dynamicContextID to all added elements', () => {
      expect(elem1[contextIdSymbol]).to.be.equal('contextId');
      expect(elem2[contextIdSymbol]).to.be.equal('contextId');
    });

    it('should remove context specific items on removeContext', async () => {
      i18n.parseItems([{ new2: 'newItems' }], 'contextId2');
      expect(i18n.size).to.be.equal(3);
      i18n.removeContext('contextId');
      expect(i18n.size).to.be.equal(1);
      i18n.removeContext('contextId2');
      expect(i18n.size).to.be.equal(0);
    });

    it('should add the i18nPluginSymbol to items added by a plugin', () => {
      i18n.addPluginMessages('myPlugin', 'newContextId', { key: 'message' });
      expect(i18n.size).to.be.equal(3);
      expect(i18n.get(2)[i18nPluginSymbol]).to.be.equal('myPlugin');
    });
  });

  describe('i18n serialization/deserialization', () => {
    let i18n;
    let configArray;

    beforeEach(async () => {
      i18n = new I18nCollection(() => { return 'contextId'; });
      configArray = [
        { de: { myKey: 'test' } },
        { de: { myKey2: 'test2' } },
      ];
      await i18n.parseItems(configArray, 'configContextId');
    });

    afterEach(() => {
      i18n.destroy();
    });

    it('should parse items from a configuration array', () => {
      expect(i18n.size).to.be.equal(2);
    });

    it('should add the provided contextId to the parsed items', () => {
      expect(i18n.get(0)[contextIdSymbol]).to.be.equal('configContextId');
      expect(i18n.get(1)[contextIdSymbol]).to.be.equal('configContextId');
    });

    it('should serialize items from a configuration array', () => {
      expect(i18n.serializeContext('configContextId')).to.deep.equal(configArray);
    });

    it('should ignore plugin items on serialization', () => {
      i18n.addPluginMessages('myPlugin', 'configContextId', { test: 'test' });
      expect(i18n.serializeContext('configContextId')).to.deep.equal(configArray);
    });
  });
});
