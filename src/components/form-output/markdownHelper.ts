import { marked } from 'marked';
import DOMPurify from 'dompurify';

export function parseAndSanitizeMarkdown(content: string): string {
  const html = marked.parse(content, { breaks: true }) as string;
  // Then sanitize the HTML using DOMPurify
  return DOMPurify.sanitize(html, { ADD_ATTR: ['target'] });
}
