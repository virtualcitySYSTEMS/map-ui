import SimpleGraphView from './simpleGraphView.js';
import { name, version, mapVersion } from '../package.json';
/**
 * @returns {VcsPlugin}
 */
export default async function simpleGraph() {
  return {
    get name() {
      return name;
    },
    get version() {
      return version;
    },
    get mapVersion() {
      return mapVersion;
    },
    onVcsAppMounted(app) {
      /** Example for registering custom component on FeatureInfo */
      app.featureInfoClassRegistry.registerClass(
        app.dynamicModuleId,
        SimpleGraphView.className,
        SimpleGraphView,
      );
    },
  };
}
