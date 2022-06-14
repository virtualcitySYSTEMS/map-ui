/* eslint-disable import/no-extraneous-dependencies, import/first */
import { vi } from 'vitest';
import CanvasRenderingContext2D from 'jest-canvas-mock/lib/classes/CanvasRenderingContext2D.js';
import Path2D from 'jest-canvas-mock/lib/classes/Path2D.js';


global.jest = vi;
global.CanvasRenderingContext2D = CanvasRenderingContext2D;
global.Path2D = Path2D;

import 'jest-canvas-mock';
import '../src/setup.js';
