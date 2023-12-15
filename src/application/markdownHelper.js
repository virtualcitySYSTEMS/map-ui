import { marked } from 'marked';
import DOMPurify from 'dompurify';

// eslint-disable-next-line import/prefer-default-export
export function parseAndSanitizeMarkdown(content) {
  return DOMPurify.sanitize(marked(content));
}
