import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import ContentTreeItem from '../../../src/contentTree/contentTreeItem.js';
import { StateActionState } from '../../../src/actions/stateRefAction.js';
import VcsUiApp from '../../../src/vcsUiApp.js';

describe('ContentTreeItem', () => {
  let app;

  beforeAll(() => {
    app = new VcsUiApp();
  });

  afterAll(() => {
    app.destroy();
  });

  describe('state action management', () => {
    it('should add a state action, if the state is not NONE', () => {
      const item = new ContentTreeItem({ name: 'foo' }, app);
      item.state = StateActionState.ACTIVE;
      expect(item.actions).to.have.lengthOf(1);
      item.destroy();
    });

    it('should not add a state action twice', () => {
      const item = new ContentTreeItem({ name: 'foo' }, app);
      item.state = StateActionState.ACTIVE;
      const [action] = item.actions;
      item.state = StateActionState.INACTIVE;
      expect(item.actions).to.have.members([action]);
      item.destroy();
    });

    it('should remove a previously created state action, if the state is set to NONE', () => {
      const item = new ContentTreeItem({ name: 'foo' }, app);
      item.state = StateActionState.ACTIVE;
      item.state = StateActionState.NONE;
      expect(item.actions).to.be.empty;
      item.destroy();
    });
  });

  describe('infoUrl action handling', () => {
    it('should add a info url action, info url is not empty', () => {
      const item = new ContentTreeItem({ name: 'foo' }, app);
      item.infoUrl = 'http://localhost';
      expect(item.actions).to.have.lengthOf(1);
      item.destroy();
    });

    it('should remove a previously created info url action, if the infoUrl is set to empty', () => {
      const item = new ContentTreeItem({ name: 'foo' }, app);
      item.infoUrl = 'http://localhost';
      item.infoUrl = null;
      expect(item.actions).to.be.empty;
      item.destroy();
    });
  });

  describe('adding actions', () => {
    it('should push all actions, if not passing weights', () => {
      const item = new ContentTreeItem({ name: 'foo' }, app);
      const actions = [
        { name: 'foo' },
        { name: 'bar' },
        { name: 'baz' },
      ];
      actions.forEach((a) => { item.addAction(a); });
      expect(item.actions).to.have.ordered.members(actions);
      item.destroy();
    });

    it('should assure, actions are sorted by weight', () => {
      const item = new ContentTreeItem({ name: 'foo' }, app);
      const actions = [
        [{ name: 'foo' }, 3],
        [{ name: 'bar' }, 5],
        [{ name: 'baz' }, -1],
        [{ name: 'foobar' }, 2],
      ];
      actions.forEach(([a, weight]) => { item.addAction(a, weight); });
      expect(item.actions).to.have.ordered.members([
        actions[2][0],
        actions[3][0],
        actions[0][0],
        actions[1][0],
      ]);
      item.destroy();
    });

    it('should throw, if adding an action with the same name twice', () => {
      const item = new ContentTreeItem({ name: 'foo' }, app);
      const name = 'foo';
      item.addAction({ name });
      expect(item.addAction.bind(item, { name })).to.throw;
      item.destroy();
    });
  });

  describe('removing actions', () => {
    it('should remove a previously added action', () => {
      const item = new ContentTreeItem({ name: 'foo' }, app);
      const name = 'foo';
      item.addAction({ name });
      item.removeAction(name);
      expect(item.actions).to.be.empty;
      item.destroy();
    });
  });

  describe('serialization', () => {
    describe('of an empty item', () => {
      it('should return name and type', () => {
        const item = new ContentTreeItem({ name: 'foo' }, app);
        const config = item.toJSON();
        expect(config).to.have.all.keys(['type', 'name']);
        item.destroy();
      });
    });

    describe('of a fully configured item', () => {
      let inputConfig;
      let outputConfig;

      beforeAll(() => {
        inputConfig = {
          name: 'foo',
          title: 'Foo',
          icon: '$vcsPen',
          initOpen: true,
          infoUrl: 'http://localhost',
          weight: 1,
        };
        const item = new ContentTreeItem(inputConfig, app);
        outputConfig = item.toJSON();
        item.destroy();
      });

      it('should configure title', () => {
        expect(outputConfig).to.have.property('title', inputConfig.title);
      });

      it('should configure icon', () => {
        expect(outputConfig).to.have.property('icon', inputConfig.icon);
      });

      it('should configure initOpen', () => {
        expect(outputConfig).to.have.property('initOpen', inputConfig.initOpen);
      });

      it('should configure infoUrl', () => {
        expect(outputConfig).to.have.property('infoUrl', inputConfig.infoUrl);
      });

      it('should configure weight', () => {
        expect(outputConfig).to.have.property('weight', inputConfig.weight);
      });
    });
  });
});
