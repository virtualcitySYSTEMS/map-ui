/* eslint-disable import/first */
import { vi } from 'vitest';

vi.hoisted(() => {
  global.jest = vi;
});

import ResizeObserver from 'resize-observer-polyfill';

global.ResizeObserver = ResizeObserver;

import 'jest-canvas-mock';
import '../src/setup.js';
