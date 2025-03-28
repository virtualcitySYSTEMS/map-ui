import { marked } from 'marked';
import DOMPurify from 'dompurify';

/**
 * @param {string} content
 * @returns {string}
 */

export function parseAndSanitizeMarkdown(content) {
  const html = marked.parse(content, { breaks: true });
  // Then sanitize the HTML using DOMPurify
  return DOMPurify.sanitize(html, { ADD_ATTR: ['target'] });
}
