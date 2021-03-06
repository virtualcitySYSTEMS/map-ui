import SimpleGraphView from './simpleGraphView.js';
/**
 * @returns {VcsPlugin}
 */
export default async function () {
  return {
    name: '@vcmap/simpleGraph',
    onVcsAppMounted(app) {
      /** Example for registering custom component on FeatureInfo */
      app.featureInfo.classRegistry.registerClass(
        app.dynamicContextId,
        SimpleGraphView.className,
        SimpleGraphView,
      );
    },
  };
}
