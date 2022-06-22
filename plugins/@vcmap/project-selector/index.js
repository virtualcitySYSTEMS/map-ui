import { ref } from '@vue/composition-api';
import { ButtonLocation, createToggleAction } from '@vcmap/ui';
import { Context } from '@vcmap/core';
import { getLogger } from '@vcsuite/logger';
import ProjectsComponent from './ProjectSelectorComponent.vue';
import packageJSON from './package.json';
import defaultConfig from './config.json';
import de from './de.json';
import en from './en.json';
/**
 * @typedef {Object} VCMapContextOptions
 * @property {string} [name]
 * @property {string} [description]
 * @property {string} configUrl
 */

/**
 * @typedef {Object} VCMapContext
 * @property {string} [name]
 * @property {string} [description]
 * @property {string} configUrl
 * @property {string} contextId
 * @property {boolean} active
 */

/**
 * @typedef {Object} VCMapProjectOptions
 * @property {string} name
 * @property {string} [description]
 * @property {Array<VCMapContextOptions>} contexts
 */

/**
 * @typedef {Object} VCMapProject
 * @property {string} name
 * @property {string} [description]
 * @property {Array<VCMapContext>} contexts
 * @property {boolean} active
 */

/**
 * @typedef {Object} ProjectSelectorConfig
 * @property {string} [selected='VC Map Base'] - selected project on startup
 * @property {string[]} [selectedContexts] - selected contexts on startup
 * @property {boolean} [open=false] - open plugin on startup
 * @property {Array<VCMapProjectOptions>} projects
 * @property {Array<VCMapContextOptions>} contexts
 */

/**
 * @param {ProjectSelectorConfig} config
 * @returns {VcsPlugin}
 */
export default async function projectSelector(config) {
  const { selected, selectedContexts, open, projects = [], contexts = [] } = config;

  const pluginConfig = {
    selected: ref(selected || defaultConfig.selected),
    selectedContexts: ref(selectedContexts || defaultConfig.selectedContexts),
    open: ref(open || defaultConfig.open),
    projects: ref(/** @type {Array<VCMapProjectOptions>} */[...defaultConfig.projects, ...projects]),
    contexts: ref(/** @type {Array<VCMapContextOptions>} */[...defaultConfig.contexts, ...contexts]),
  };

  const pluginState = {
    projects: ref(/** @type {Array<VCMapProject>} */[]),
    contexts: ref(/** @type {Array<VCMapContext>} */[]),
  };

  /**
   * @param {VCMapContextOptions} contextOptions
   */
  function addContextFromOptions(contextOptions) {
    /**
     * @type {VCMapContext}
     */
    const context = {
      name: undefined,
      description: undefined,
      configUrl: undefined,
      ...contextOptions,
      contextId: undefined,
      active: false,
    };
    pluginState.contexts.value.push(context);
  }

  /**
   * @param {VCMapContext} context
   */
  function removeContext(context) {
    const idx = pluginState.contexts.value.findIndex(c => c.configUrl === context.configUrl);
    pluginState.contexts.value.splice(idx, 1);
  }

  /**
   * @param {VCMapProjectOptions} projectOptions
   */
  function addProjectFromOptions(projectOptions) {
    const { name, description, contexts: contextsOptions = [] } = projectOptions;
    /**
     * @type {VCMapProject}
     */
    const project = {
      name,
      description,
      contexts: contextsOptions.map(options => /** @type {VCMapContext} */({
        name: undefined,
        description: undefined,
        configUrl: undefined,
        ...options,
        contextId: undefined,
        active: false,
      })),
      active: false,
    };
    pluginState.projects.value.push(project);
  }

  /**
   * @param {VCMapProject} project
   */
  function removeProject(project) {
    const projectIdx = pluginState.projects.findIndex(p => p.name === project.name);
    pluginState.projects.value.splice(projectIdx, 1);
  }

  /**
   * @param {VcsApp} app
   * @param {VCMapContext} vcMapContext
   * @returns {Promise<void>}
   */
  async function loadContext(app, vcMapContext) {
    try {
      const configJson = await fetch(vcMapContext.configUrl)
        .then(response => response.json());
      const context = new Context(configJson);
      if (!app.getContextById(context.id)) {
        await app.addContext(context);
      }
      vcMapContext.contextId = context.id;
      vcMapContext.active = true;
    } catch (err) {
      getLogger().error(`Failed loading context from ${ vcMapContext.configUrl}`, err);
    }
  }

  /**
   * @param {VcsApp} app
   * @param {VCMapContext} vcMapContext
   * @returns {Promise<void>}
   */
  async function unloadContext(app, vcMapContext) {
    if (app.getContextById(vcMapContext.contextId)) {
      await app.removeContext(vcMapContext.contextId);
    }
    vcMapContext.active = false;
  }

  /**
   * @param {VcsApp} app
   * @param {VCMapProject} project
   * @returns {Promise<void>}
   */
  async function deselectProject(app, project) {
    if (project.active) {
      await Promise.all([...project.contexts].map((context) => {
        return unloadContext(app, context);
      }));
      project.active = false;
    }
  }

  /**
   * @param {VcsApp} app
   * @param {VCMapProject} project
   * @returns {Promise<void>}
   */
  async function selectProject(app, project) {
    if (!project.active) {
      await Promise.all([...pluginState.projects.value].map((p) => {
        return deselectProject(app, p);
      }));
      await Promise.all([...project.contexts].map((context) => {
        return loadContext(app, context);
      }));
      project.active = true;
    }
  }

  return {
    get name() { return packageJSON.name; },
    get version() { return packageJSON.version; },
    get vcMapVersion() { return packageJSON.vcMapVersion; },
    config: pluginConfig,
    state: pluginState,
    addContextFromOptions,
    removeContext,
    addProjectFromOptions,
    removeProject,
    selectProject,
    deselectProject,
    loadContext,
    unloadContext,
    onVcsAppMounted(app) {
      const windowComponent = {
        id: 'project-selector',
        component: ProjectsComponent,
        state: {
          headerTitle: 'Project Selector',
        },
        position: {
          left: '30%',
          right: '30%',
          top: '20%',
          bottom: '20%',
        },
      };
      const { action, destroy } = createToggleAction(
        {
          name: 'VC Map HOSTING',
          icon: 'mdi-chevron-down',
        },
        windowComponent,
        app.windowManager,
        packageJSON.name,
      );
      app.navbarManager.add(
        { id: 'project-selector', action },
        packageJSON.name,
        ButtonLocation.PROJECT,
      );
      this._destroyAction = destroy;

      pluginConfig.contexts.value.forEach(c => addContextFromOptions(c));
      pluginConfig.projects.value.forEach(p => addProjectFromOptions(p));
      const projectToSelect = [...pluginState.projects.value]
        .find(p => p.name === pluginConfig.selected.value) ||
        pluginState.projects.value[0];
      selectProject(app, projectToSelect);
      const contextsToSelect = [...pluginState.contexts.value]
        .filter(c => pluginConfig.selectedContexts.value.includes(c.name));
      contextsToSelect.forEach(c => loadContext(app, c));
      if (pluginConfig.open) {
        app.windowManager.add(windowComponent, packageJSON.name);
      }
    },
    i18n: {
      de,
      en,
    },
    destroy() {
      if (this._destroyAction) {
        this._destroyAction();
        this._destroyAction = null;
      }
    },
  };
}
