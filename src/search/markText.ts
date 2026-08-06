type BlockIndices = {
  start: number;
  end: number;
};

function isBlockWithinBlocks(
  blocks: BlockIndices[],
  candidate: BlockIndices,
): boolean {
  return blocks.some(
    (block) => candidate.start >= block.start && candidate.end <= block.end,
  );
}

function addPartialBlocks(
  text: string,
  partial: RegExp,
  blocks: BlockIndices[],
): void {
  let match;

  while ((match = partial.exec(text))) {
    const block: BlockIndices = {
      start: match.index,
      end: match.index + match[0].length,
    };
    if (!isBlockWithinBlocks(blocks, block)) {
      blocks.push(block);
    }
  }
}

export function markText(text: string, query: string): string {
  let replacement = text;
  if (query) {
    const partials = query
      .split(/[.,\s]/)
      .map((p) => p.trim())
      .filter((p) => !!p)
      .sort((a, b) => b.length - a.length); // we sort partials by length so we can ensure smaller partials aren't already covered by larger ones

    const blocks: BlockIndices[] = [];
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
