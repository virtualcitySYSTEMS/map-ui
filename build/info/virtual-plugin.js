/**
 * Handle the interface and abstract annotations.
 * @param {Object} dictionary The tag dictionary.
 */
exports.defineTags = function defineTags(dictionary) {
  const classTag = dictionary.lookUp('class');
  dictionary.defineTag('interface', {
    mustNotHaveValue: true,
    onTagged(doclet) {
      // eslint-disable-next-line prefer-rest-params
      classTag.onTagged.apply(this, arguments);
      doclet.virtual = true;
    },
  });
};
