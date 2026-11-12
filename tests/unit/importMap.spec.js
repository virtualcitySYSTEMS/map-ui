import { describe, it, expect } from 'vitest';
import { createImportMapScript } from '../../build/buildHelpers.js';

describe('import map', () => {
  it('should keep the CSP hash stable', () => {
    // Hosts with a strict CSP allow the inline import map by this hash. If this fails, the import map changed:
    // update the hash here and note the change as a breaking change in the CHANGELOG.
    expect(createImportMapScript('./').cspHash).to.equal(
      "'sha256-6a0mKB1sCqQbLPQsKU+tLZVoE/OxXdhOhea+MAWbbGY='",
    );
  });
});
