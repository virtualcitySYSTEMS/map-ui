import { describe, expect, it } from 'vitest';
import { markText } from '../../../src/search/markText.js';

describe('marked text', () => {
  it('should highlight the search term in the text', () => {
    const markedText = markText(
      'The quick brown fox jumps over the lazy dog, while another brown fox rests under a shady tree.',
      'brown fox',
    );

    expect(markedText).toBe(
      'The quick <span class="text-primary">brown</span> <span class="text-primary">fox</span> jumps over the lazy dog, while another <span class="text-primary">brown</span> <span class="text-primary">fox</span> rests under a shady tree.',
    );
  });

  it('should ensure partials do not overlap', () => {
    const markedText = markText(
      'I know spanish and another language.',
      'an spanish',
    );

    expect(markedText).toBe(
      'I know <span class="text-primary">spanish</span> <span class="text-primary">an</span>d <span class="text-primary">an</span>other l<span class="text-primary">an</span>guage.',
    );
  });

  it('should not mark anything, if there are no hits', () => {
    const markedText = markText(
      'The quick brown fox jumps over the lazy dog, while another brown fox rests under a shady tree.',
      'red badger',
    );

    expect(markedText).toBe(
      'The quick brown fox jumps over the lazy dog, while another brown fox rests under a shady tree.',
    );
  });
});
