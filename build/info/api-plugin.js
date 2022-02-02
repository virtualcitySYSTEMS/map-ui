/**
 * Handle the api annotation.
 * @param {Object} dictionary The tag dictionary.
 */
exports.defineTags = function defineTags(dictionary) {
  dictionary.defineTag('api', {
    onTagged(doclet) {
      doclet.api = true;
    },
  });
};
