import { describe, it, expect, vi } from 'vitest';
import { callSafeAction } from '../../src/actions/actionHelper.js';
import { sleep } from '../helpers.js';

describe('callSafeAction helper', () => {
  it('should call the callback and log no error when the callback is synchronous and succeeds', () => {
    const action = {
      name: 'syncSuccessfulAction',
      title: 'Sync Successful Action',
      callback: vi.fn(),
    };
    callSafeAction(action);
    expect(action.callback).toBeCalled;
  });

  it('should catch and log an error when the synchronous callback throws an error', () => {
    const action = {
      name: 'syncThrowingAction',
      title: 'Sync Throwing Action',
      callback: vi.fn(() => {
        throw new Error('Something went wrong');
      }),
    };
    callSafeAction(action);
    expect(action.callback).toBeCalled;
  });

  it('should handle a promise returning asynchronous callback and log no error when it resolves', async () => {
    const action = {
      name: 'asyncSuccessfulAction',
      title: 'Async Successful Action',
      callback: vi.fn(async () => Promise.resolve()),
    };
    callSafeAction(action);
    await sleep();
    expect(action.callback).toBeCalled;
  });

  it('should catch and log an error when the asynchronous callback throws an error', async () => {
    const action = {
      name: 'asyncThrowingAction',
      title: 'Async Throwing Action',
      callback: vi.fn(async () =>
        Promise.reject(new Error('Something went wrong')),
      ),
    };
    callSafeAction(action);
    await sleep();
    expect(action.callback).toBeCalled;
  });
});
