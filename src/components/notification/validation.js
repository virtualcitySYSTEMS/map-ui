/**
 * validates rules and returns error messages
 * @param {Array<string|function(T):string>} rules - validation functions or string messages
 * @param {T} value
 * @returns {string[]}
 * @template T
 */
export default function validate(rules, value) {
  if (Array.isArray(rules)) {
    return rules
      .map((rule) => {
        if (typeof rule === 'function') {
          return rule(value);
        }
        return rule;
      })
      .filter((val) => val !== true);
  }
  return [];
}
