import { describe, expect, it, beforeEach, afterEach } from 'vitest';
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

    beforeEach(() => {
      i18n = new I18nCollection();
    });

    afterEach(() => {
      i18n.destroy();
    });

    describe('default Messages', () => {
      it('should add the default messages to the i18n Collection', () => {
        expect(i18n.getMergedMessages()).to.have.keys(['de', 'en']);
      });
    });

    describe('plugin handling', () => {
      it('should add plugins Items to the mergedMessages', () => {
        i18n.addPluginMessages('myPlugin', 'newmoduleId', { key: 'message' });
        const mergedMessages = i18n.getMergedMessages();
        expect(mergedMessages.key).to.be.equal('message');
      });

      it('should remove plugin items from the MergedMessages', () => {
        i18n.addPluginMessages('myPlugin', 'newmoduleId', { key: 'message' });
        i18n.removePluginMessages('myPlugin', 'newmoduleId');
        const mergedMessages = i18n.getMergedMessages();
        expect(mergedMessages.key).to.not.exist;
      });
    });
  });
});
