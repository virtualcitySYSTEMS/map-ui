import { vi, describe, it, expect, beforeAll } from 'vitest';
import { VcsUiApp } from '@vcmap/ui';
import { VcsModule } from '@vcmap/core';
import { helloWorld } from '../src/index.js';
import { name } from '../package.json';

describe('HelloWorld', () => {
  describe('helloWorld', () => {
    it('should return hello World', () => {
      const val = helloWorld();
      expect(val).to.equal('Hello World!');
    });
  });

  describe('addModule', () => {
    let module;
    /** @type {VcsUiApp} */
    let app;
    let added;

    beforeAll(async () => {
      module = new VcsModule({
        plugins: [
          {
            name,
          },
        ],
      });
      app = new VcsUiApp();
      added = vi.fn();
      app.moduleAdded.addEventListener(added);
      // since plugin's entry cannot be resolved, we mock the _parseContext method and call override on the plugins collection
      vi.spyOn(app, '_parseModule').mockImplementationOnce(() => {
        app.plugins.override({ name });
      });
      await app.addModule(module);
    });

    it('should add the module', () => {
      expect(app.getModuleById(module._id)).to.equal(module);
    });

    it('should raise the contextAdded event', () => {
      expect(added).toHaveBeenCalledTimes(1);
    });

    it('should add plugins part of the module', () => {
      const plugin = app.plugins.getByKey(name);
      // eslint-disable-next-line no-unused-expressions
      expect(plugin).not.to.be.undefined;
    });
  });
});
