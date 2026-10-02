import { reactive } from 'vue';
import { ButtonLocation, createToggleAction } from '@vcmap/ui';
import { VcsModule } from '@vcmap/core';
import { getLogger } from '@vcsuite/logger';
import ProjectsComponent from './ProjectSelectorComponent.vue';
import packageJSON from '../package.json';
import defaultConfig from '../config.json';
import de from './de.json';
import en from './en.json';

/**
 * @typedef {Object} VcsModuleState
 * @property {string} _id
 * @property {string} [name]
 * @property {string} [description]
 * @property {string} [configUrl]
 * @property {Object} [config]
 * @property {boolean} active
 * @property {Array<VcsModuleState>} [modules]
 */

/**
 * @typedef {Object} ProjectOptions
 * @property {string} name
 * @property {string} [description]
 * @property {Array<string>} modules - a list of config urls
 */

/**
 * @typedef {ProjectOptions} Project
 * @property {boolean} active
 * @property {Array<VcsModuleState>} modules
 */

/**
 * @typedef {Object} ProjectSelectorConfig
 * @property {string} [selected='VC Map Base'] - selected project on startup
 * @property {string[]} [selectedModules] - selected modules on startup
 * @property {boolean} [open=false] - open plugin on startup
 * @property {Array<Project>} projects
 * @property {Array<string>} modules
 * @property {Record<string, Array<string>>} [additionalModules] - child module URLs by parent module ID
 */

/**
 * @param {ProjectSelectorConfig} config
 * @returns {VcsPlugin}
 */
export default async function projectSelector(config) {
  const {
    selected,
    selectedModules,
    open,
    projects = [],
    modules = [],
    additionalModules = {},
  } = config;

  const pluginConfig = reactive({
    selected: selected || defaultConfig.selected,
    selectedModules: selectedModules || defaultConfig.selectedModules,
    open: open || defaultConfig.open,
    projects: /** @type {Array<ProjectOptions>} */ [
      ...defaultConfig.projects,
      ...projects,
    ],
    modules: /** @type {Array<string>} */ [
      ...defaultConfig.modules,
      ...modules,
    ],
  });

  const pluginState = reactive({
    projects: /** @type {Array<Project>} */ [],
    modules: /** @type {Array<VcsModuleState>} */ [],
  });
  const additionalModuleStates = new Map(
    Object.entries(additionalModules).map(([moduleId, configUrls]) => [
      moduleId,
      configUrls.map((configUrl) => ({
        _id: undefined,
        configUrl,
        active: false,
      })),
    ]),
  );
  let removeModuleRemovedListener;

  /**
   * @param {string} configUrl
   */
  function addModule(configUrl) {
    pluginState.modules.push({ _id: undefined, configUrl, active: false });
  }

  /**
   * @param {string} moduleId
   */
  function removeModule(moduleId) {
    const idx = pluginState.modules.findIndex(({ _id }) => _id === moduleId);
    pluginState.modules.splice(idx, 1);
  }

  /**
   * @param {ProjectOptions} projectOptions
   */
  function addProject({ name, description, modules: configUrls }) {
    const project = {
      name,
      description,
      modules: configUrls.map((configUrl) => ({
        _id: undefined,
        configUrl,
        active: false,
      })),
      active: false,
    };
    pluginState.projects.push(project);
  }

  /**
   * @param {Project} project
   */
  function removeProject(project) {
    const projectIdx = pluginState.projects.findIndex(
      (p) => p.name === project.name,
    );
    pluginState.projects.splice(projectIdx, 1);
  }

  /**
   * @param {VcsApp} app
   * @param {VcsModuleState} moduleState
   * @returns {Promise<void>}
   */
  async function unloadModule(app, moduleState) {
    if (moduleState.modules) {
      await Promise.all(
        moduleState.modules.map((state) => unloadModule(app, state)),
      );
      moduleState.modules = undefined;
      moduleState.active = false;
      return;
    }
    if (app.getModuleById(moduleState._id)) {
      await Promise.all(
        (additionalModuleStates.get(moduleState._id) || []).map((state) =>
          unloadModule(app, state),
        ),
      );
      await app.removeModule(moduleState._id);
      moduleState.active = false;
      moduleState._id = undefined;
    }
  }

  /**
   * @param {VcsApp} app
   * @param {VcsModuleState} moduleState
   * @returns {Promise<void>}
   */
  async function loadModule(app, moduleState) {
    try {
      const response = await fetch(moduleState.configUrl);
      if (response.ok) {
        const configJson = await response.json();
        if (Array.isArray(configJson.modules)) {
          moduleState.modules = configJson.modules.map((moduleConfig) =>
            typeof moduleConfig === 'string'
              ? { _id: undefined, active: false, configUrl: moduleConfig }
              : { _id: undefined, active: false, config: moduleConfig },
          );
          await Promise.all(
            moduleState.modules.map((state) => loadModule(app, state)),
          );
          moduleState.name = configJson.name;
          moduleState.description = configJson.description;
          moduleState.active = moduleState.modules.every(
            (state) => state.active,
          );
          return;
        }
        const module = new VcsModule(configJson);
        if (!app.getModuleById(module._id)) {
          await app.addModule(module);
          moduleState._id = module._id;
          moduleState.name = module.name;
          moduleState.description = module.description;
          moduleState.active = true;
          await Promise.all(
            (additionalModuleStates.get(module._id) || []).map((state) =>
              loadModule(app, state),
            ),
          );
        }
      }
    } catch (err) {
      getLogger().error(
        `Failed loading module from ${moduleState.configUrl}`,
        err,
      );
    }
  }

  /**
   * @param {VcsApp} app
   * @param {Project} project
   * @returns {Promise<void>}
   */
  async function deselectProject(app, project) {
    if (project.active) {
      await Promise.all(
        [...project.modules].map((moduleState) => {
          return unloadModule(app, moduleState);
        }),
      );
      project.active = false;
    }
  }

  /**
   * @param {VcsApp} app
   * @param {Project} project
   * @returns {Promise<void>}
   */
  async function selectProject(app, project) {
    if (!project.active) {
      await Promise.all(
        [...pluginState.projects].map((p) => {
          return deselectProject(app, p);
        }),
      );
      await Promise.all(
        [...project.modules].map((moduleState) => {
          return loadModule(app, moduleState);
        }),
      );
      project.active = true;
    }
  }

  return {
    get name() {
      return packageJSON.name;
    },
    get version() {
      return packageJSON.version;
    },
    get mapVersion() {
      return packageJSON.mapVersion;
    },
    config: pluginConfig,
    state: pluginState,
    addModule,
    removeModule,
    addProject,
    removeProject,
    selectProject,
    deselectProject,
    loadModule,
    unloadModule,
    onVcsAppMounted(app) {
      const windowComponent = {
        id: 'project-selector',
        component: ProjectsComponent,
        state: { headerTitle: 'Project Selector' },
        position: { left: '30%', right: '30%', top: '10%' },
      };
      const { action, destroy } = createToggleAction(
        { name: 'VC Map HOSTING', icon: 'mdi-chevron-down' },
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
      removeModuleRemovedListener = app.moduleRemoved.addEventListener(
        (module) => {
          const moduleStates = [
            ...pluginState.modules,
            ...[...additionalModuleStates.values()].flat(),
            ...pluginState.projects.flatMap(
              ({ modules: projectModules }) => projectModules,
            ),
          ];
          moduleStates.forEach((moduleState) => {
            if (moduleState._id === module._id) {
              moduleState.active = false;
              moduleState._id = undefined;
            }
          });
        },
      );

      pluginConfig.modules.forEach((c) => addModule(c));
      pluginConfig.projects.forEach((p) => addProject(p));
      const projectToSelect =
        [...pluginState.projects].find(
          (p) => p.name === pluginConfig.selected,
        ) || pluginState.projects[0];
      selectProject(app, projectToSelect);
      const modulesToSelect = [...pluginState.modules].filter((m) =>
        pluginConfig.selectedModules.includes(m.configUrl),
      );
      modulesToSelect.forEach((m) => loadModule(app, m));
      if (pluginConfig.open) {
        app.windowManager.add(windowComponent, packageJSON.name);
      }
    },
    i18n: {
      de,
      en,
    },
    destroy() {
      if (removeModuleRemovedListener) {
        removeModuleRemovedListener();
        removeModuleRemovedListener = undefined;
      }
      if (this._destroyAction) {
        this._destroyAction();
        this._destroyAction = null;
      }
    },
  };
}
