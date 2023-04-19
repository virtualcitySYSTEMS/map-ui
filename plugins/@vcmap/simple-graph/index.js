import SimpleGraphView from './simpleGraphView.js';
/**
 * @returns {VcsPlugin}
 */
export default async function simpleGraph() {
  return {
    name: '@vcmap/simpleGraph',
    onVcsAppMounted(app) {
      /** Example for registering custom component on FeatureInfo */
      app.featureInfo.classRegistry.registerClass(
        app.dynamicModuleId,
        SimpleGraphView.className,
        SimpleGraphView,
      );
    },
  };
}
