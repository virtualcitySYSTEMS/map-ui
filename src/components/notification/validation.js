/**
 * validates rules and returns error messages
 * @param {Array} rules - validation functions or string messages
 * @param {*} value
 * @returns {string[]}
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
