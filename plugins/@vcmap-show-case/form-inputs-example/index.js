import { ref, reactive, watch } from 'vue';
import { getLogger as getLoggerByName } from '@vcsuite/logger';

import { ButtonLocation, createToggleAction, WindowSlot } from '@vcmap/ui';
import packageJSON from './package.json';
import defaultConfig from './config.json';
import { conditionalTest, isValidEmail, isValidText } from './validation.js';
import FormInputsExample from './FormInputsExample.vue';
import createExampleActions from './exampleActions.js';

/**
 * @returns {Logger}
 */
function getLogger() {
  return getLoggerByName(packageJSON.name);
}

/**
 * @typedef FormInputsExampleConfig
 * @property {string} nonReactiveProp
 * @property {string[]} selectOptions
 * @property {string} initialTextInput
 */

/**
 * @typedef FormInputsExampleState
 * @property {string} selected
 * @property {Array<string>} selectedMultiple
 * @property {string} conditionalInput
 * @property {string} initialTextInput
 * @property {number} numberInput
 * @property {boolean} checkboxInput
 * @property {string} email
 */

/**
 * @returns {FormInputsExampleConfig}
 */
export function getDefaultConfig() {
  return defaultConfig;
}

/**
 *
 * @param {FormInputsExampleConfig} config
 * @returns {VcsPlugin}
 */
export default function formInputsExample(config) {
  /**
   * @type {FormInputsExampleConfig}
   */
  const pluginConfig = {
    // not reactive can be put without using reactive or ref
    nonReactiveProp: 'nonReactive',
    // no validation, ref to track config changes; use reactive on nested arrays or objects
    selectOptions: ref(
      [...config.selectOptions] || [...defaultConfig.selectOptions],
    ),
    // ref prop with getter setter --> validation
    _initialTextInput: ref(defaultConfig.initialTextInput),
    set initialTextInput(value) {
      const validation = isValidText(value);
      if (validation === true) {
        this._initialTextInput.value = value;
      } else {
        getLogger().error(
          'Error setting initialTextInput on plugin config:',
          validation,
        );
      }
    },
    get initialTextInput() {
      return this._initialTextInput;
    },
  };
  if (config.initialTextInput) {
    pluginConfig.initialTextInput = config.initialTextInput;
  }

  /**
   * @type {FormInputsExampleState}
   */
  const pluginState = {
    selected: pluginConfig.selectOptions.value[0],
    selectedMultiple: [],
    conditionalInput: '',
    initialTextInput: pluginConfig.initialTextInput.value,
    numberInput: 100.156,
    checkboxInput: true,
    email: '',
    prependedInput: '',
    files: [],
    dateInput: '',
  };

  /** @type {FormInputsExampleState} */
  const defaultState = JSON.parse(JSON.stringify(pluginState));

  /**
   * watcher to update state, when specific config properties are changed
   * @see https://v3.vuejs.org/guide/reactivity-computed-watchers.html#watching-multiple-sources
   *
   * additional notes:
   * - watching refs, changes are only triggered on resigning the value
   * - if reactive objects or arrays shall be watched, you'll need to add option `{ deep: true }`
   *   @see https://v3.vuejs.org/guide/reactivity-computed-watchers.html#watching-reactive-objects
   *   in this case you may need a separate watcher, since watching multiple sources seems only to work for refs
   * @returns {import("vue").WatchStopHandle}
   */
  const stopWatching = watch(
    [pluginConfig.selectOptions, pluginConfig.initialTextInput],
    ([selectOptions, initialTextInput]) => {
      if (!selectOptions.includes(pluginState.selected)) {
        getLogger().error('invalid state', pluginState.selected);
        pluginState.selected = selectOptions[0];
      }
      // XXX should initial states be overwritten on config change?
      pluginState.initialTextInput = initialTextInput;
    },
  );

  /**
   * returns serializable state object
   * @returns {FormInputsExampleState}
   */
  function getSerializedState() {
    // use destruction to get rid of reactive getter/ setter. be careful with nested props!
    return { ...pluginState };
  }

  /**
   * can be async
   * @param {FormInputsExampleState} stateObject
   */
  function setSerializedState(stateObject) {
    /**
     * string returns of the validation functions are treated as error
     * @type {Object<string, true|string>}
     */
    const validation = {
      conditionalInput: conditionalTest(
        stateObject.conditionalInput,
        stateObject.selected,
      ),
      initialTextInput: isValidText(stateObject.initialTextInput),
      email: isValidEmail(stateObject.email),
    };
    Object.keys(validation).forEach((key) => {
      if (validation[key] !== true) {
        // XXX warning or error???
        getLogger().warning(
          `Validation failed for state property "${key}":`,
          validation[key],
        );
        // XXX should invalid props be assigned or not?
        delete stateObject[key];
      }
    });
    Object.assign(pluginState, stateObject);
  }

  return {
    get name() {
      return packageJSON.name;
    },
    get version() {
      return packageJSON.version;
    },
    get vcMapVersion() {
      return packageJSON.vcMapVersion;
    },
    config: pluginConfig,
    state: reactive(pluginState),
    resetState: () =>
      Object.assign(pluginState, JSON.parse(JSON.stringify(defaultState))),
    getSerializedState,
    setSerializedState,
    onVcsAppMounted(app) {
      const { actions, showSection, dense } = createExampleActions();

      const { action, destroy } = createToggleAction(
        {
          name: 'Form Inputs Example',
          icon: '$vcsHealthCareIndustries',
          title: 'form-inputs-example.tooltip',
        },
        {
          id: 'formInputsExample',
          component: FormInputsExample,
          slot: WindowSlot.DYNAMIC_LEFT,
          state: {
            headerTitle: 'form-inputs-example.title',
            headerIcon: '$vcsCircle',
            headerActions: actions,
            headerActionsOverflow: 2,
            infoUrl: 'https://vc.systems',
          },
          props: {
            actions,
            showSection,
            dense,
          },
        },
        app.windowManager,
        packageJSON.name,
      );
      app.navbarManager.add(
        { id: 'formInputsExample', action },
        packageJSON.name,
        ButtonLocation.TOOL,
      );
      this._destroyAction = destroy;
    },
    toJSON: async () => {
      const configJson = {};
      configJson.selectOptions = pluginConfig.selectOptions;
      if (pluginConfig.initialTextInput !== defaultConfig.initialTextInput) {
        configJson.initialTextInput = defaultConfig.initialTextInput;
      }
      return configJson;
    },
    i18n: {
      de: {
        'form-inputs-example': {
          title: 'Form Inputs Beispiel',
          select: 'Select Feld',
          tooltip: 'Form Inputs Beispiel Plugin',
          help: 'Geben Sie eine Zahl in das Feld NumberInput ein. VcsFormattedNumber rundet auf eine Dezimalstelle.',
          help1: 'Wählen Sie eine Option',
          help1desc:
            "Wenn 'Option A' gewählt ist, muss der bedingte Input 'test' sein.",
          help2: "Ändern Sie den Wert von 'myInitialText'",
          help2desc:
            "InitialTextInput bleibt solange im Lade-Status, bis sich der Wert 'myInitialText' ändert.",
          help3: 'Geben Sie eine Email Adresse ein',
          help3desc: 'Email Adressen werden validiert.',
          numbers: {
            one: 'eins',
            two: 'zwei',
            three: 'drei',
          },
        },
      },
      en: {
        'form-inputs-example': {
          title: 'Form Inputs Example',
          select: 'Select field',
          tooltip: 'Form Inputs Example Plugin',
          help: 'Enter a number to the NumberInput field. VcsFormattedNumber rounds to one decimal digit.',
          help1: 'Select an option',
          help1desc:
            "If 'Option A' is chosen, conditional input must be 'test'.",
          help2: "Change 'myInitialText' to some other value",
          help2desc:
            "InitialTextInput text field stays in loading state, as long as 'myInitialText' is not changed.",
          help3: 'Enter an email address.',
          help3desc: 'Emails get validated.',
          numbers: {
            one: 'one',
            two: 'two',
            three: 'three',
          },
        },
      },
    },
    destroy() {
      // destroy watcher
      stopWatching();
      if (this._destroyAction) {
        this._destroyAction();
        this._destroyAction = null;
      }
    },
  };
}
