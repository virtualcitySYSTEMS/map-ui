import { describe, it, expect, beforeAll } from 'vitest';
import { NotificationType, Notifier } from '../../index.js';
import { sleep } from '../helpers.js';

describe('Notifier', () => {
  describe('adding notifications', () => {
    /** @type {Notifier} */
    let notifier;
    beforeAll(() => {
      notifier = new Notifier();
      notifier.add({
        type: NotificationType.SUCCESS,
        message: 'hello world',
        title: 'foo',
      });
    });

    it('should add the notification', () => {
      expect(notifier.notifications.value).to.have.lengthOf(1);
    });

    it('should set the message', () => {
      expect(notifier.notifications.value[0]).to.have.property('message', 'hello world');
    });

    it('should set the title', () => {
      expect(notifier.notifications.value[0]).to.have.property('title', 'foo');
    });

    it('should set open to true', () => {
      expect(notifier.notifications.value[0]).to.have.property('open').and.to.have.property('value', true);
    });

    it('should set a default timeout of 5000', () => {
      expect(notifier.notifications.value[0]).to.have.property('timeout', 5000);
    });

    it('should set an internal id', () => {
      expect(notifier.notifications.value[0]).to.have.property('id').and.to.be.a('string');
    });
  });

  describe('removing a notification', () => {
    describe('by calling remove', () => {
      /** @type {Notifier} */
      let notifier;
      beforeAll(() => {
        notifier = new Notifier();
        const notification = notifier.add({
          type: NotificationType.SUCCESS,
          message: 'hello world',
          title: 'foo',
        });
        notifier.remove(notification);
      });

      it('should remove the notification', () => {
        expect(notifier.notifications.value).to.be.empty;
      });
    });

    describe('by setting open false', () => {
      /** @type {Notifier} */
      let notifier;
      beforeAll(() => {
        notifier = new Notifier();
        const notification = notifier.add({
          type: NotificationType.SUCCESS,
          message: 'hello world',
          title: 'foo',
        });
        notification.open = false;
      });

      it('should remove the notification after 100ms for transition', async () => {
        await sleep(101);
        expect(notifier.notifications.value).to.be.empty;
      });
    });

    describe('by calling close', () => {
      /** @type {Notifier} */
      let notifier;
      beforeAll(() => {
        notifier = new Notifier();
        const notification = notifier.add({
          type: NotificationType.SUCCESS,
          message: 'hello world',
          title: 'foo',
        });
        notification.close();
      });

      it('should remove the notification after 100ms for transition', async () => {
        await sleep(101);
        expect(notifier.notifications.value).to.be.empty;
      });
    });
  });
});
