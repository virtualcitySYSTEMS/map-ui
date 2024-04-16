import { marked } from 'marked';
import DOMPurify from 'dompurify';

/**
 * @param {string} content
 * @returns {string}
 */
export function parseAndSanitizeMarkdown(content) {
  return DOMPurify.sanitize(marked(content));
}

/**
 * @param {Record<string, unknown>} parent
 * @param {(string|number)[]} keys
 * @returns {undefined|T}
 * @template {*} T
 */
function findRecursive(parent, keys) {
  if (keys.length === 1) {
    return parent[keys[0]];
  } else {
    const nextKey = keys.shift();
    const nextParent = parent[nextKey];
    if (nextParent) {
      return findRecursive(nextParent, keys);
    }
  }
  return undefined;
}

/**
 * Replaces template strings by provided attributes, e.g. {{myAttribute}}
 * @param {string|string[]} template
 * @param {Record<string, unknown>} attributes
 * @returns {string}
 */
export function replaceAttributes(template, attributes) {
  const templateString = Array.isArray(template)
    ? template.join('\n')
    : template;
  return templateString.replace(/\{\{([^}]+)}}/g, (p, value) => {
    const keys = value.trim().split('.');

    for (let i = 0; i < keys.length; i++) {
      let key = keys[i];
      if (typeof key === 'string') {
        const indices = [];
        let arrayIndex = /\[["']?([^\]]+)["']?]$/.exec(key);
        while (arrayIndex != null) {
          let bracketKey = arrayIndex[1];
          if (/^\d+$/.test(bracketKey)) {
            bracketKey = Number(bracketKey);
          }
          indices.push(bracketKey);
          key = key.substring(0, arrayIndex.index);
          arrayIndex = /\[["']?([^\]]+)["']?]$/.exec(key);
        }

        if (indices.length > 0) {
          keys.splice(i, 1, key, ...indices);
        }
      }
    }

    return findRecursive(attributes, keys) ?? '';
  });
}
