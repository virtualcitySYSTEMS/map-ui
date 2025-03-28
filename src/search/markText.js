/**
 * @typedef {Object} BlockIndices
 * @property {number} start
 * @property {number} end
 */

/**
 * @param {BlockIndices[]} blocks
 * @param {BlockIndices} candidate
 * @returns {boolean}
 */
function isBlockWithinBlocks(blocks, candidate) {
  return blocks.some(
    (block) => candidate.start >= block.start && candidate.end <= block.end,
  );
}

/**
 * @param {string} text
 * @param {RegExp} partial
 * @param {BlockIndices[]} blocks
 */
function addPartialBlocks(text, partial, blocks) {
  let match;

  while ((match = partial.exec(text))) {
    const block = {
      start: match.index,
      end: match.index + match[0].length,
    };
    if (!isBlockWithinBlocks(blocks, block)) {
      blocks.push(block);
    }
  }
}

/**
 * @param {string} text
 * @param {string} query
 * @returns {string}
 */

export function markText(text, query) {
  let replacement = text;
  if (query) {
    const partials = query
      .split(/[.,\s]/)
      .map((p) => p.trim())
      .filter((p) => !!p)
      .sort((a, b) => b.length - a.length); // we sort partials by length so we can ensure smaller partials aren't already covered by larger ones

    const blocks = [];
    partials.forEach((partial) => {
      addPartialBlocks(text, new RegExp(partial, 'ig'), blocks);
    });

    blocks.sort((a, b) => a.start - b.start);
    blocks.reverse().forEach((block) => {
      replacement = `${replacement.substring(0, block.start)}<span class="text-primary">${replacement.substring(block.start, block.end)}</span>${replacement.substring(block.end)}`;
    });
  }
  return replacement;
}
