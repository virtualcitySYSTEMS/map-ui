<template>
  <v-dialog
    v-if="options"
    v-model="localValue"
    :width="position.width"
    :height="position.height"
    :max-width="position.maxWidth"
    :max-height="position.maxHeight"
    persistent
    class="vcs-splash-screen"
  >
    <v-card>
      <v-card-text>
        <VcsMarkdown :content="$st(options.content)" />
        <VcsCheckbox v-if="options.acceptInput" v-model="checkBox">
          <template #label>
            <VcsMarkdown
              :content="
                $st(
                  options.checkBoxText ||
                    'components.splashScreen.checkBoxText',
                )
              "
              class="marked-checkbox-content"
            />
          </template>
        </VcsCheckbox>
        <VcsCheckbox v-if="options.enableDontShowAgain" v-model="dontShowAgain">
          <template #label>
            <div class="pl-2">
              {{ $t('components.splashScreen.dontShowAgain') }}
            </div>
          </template>
        </VcsCheckbox>
      </v-card-text>

      <v-card-actions>
        <div class="d-flex gc-2 w-100 justify-end">
          <VcsFormButton
            v-if="
              options.secondaryButtonTitle && options.secondaryCallbackOptions
            "
            :disabled="
              options.requireInputForSecondary &&
              options.acceptInput &&
              !checkBox
            "
            @click="secondaryButtonClicked"
          >
            {{ $st(options.secondaryButtonTitle) }}
          </VcsFormButton>
          <VcsFormButton
            color="primary"
            variant="filled"
            @click="exitScreen"
            :disabled="options.acceptInput && !checkBox"
            >{{
              $st(options.buttonTitle || 'components.splashScreen.buttonTitle')
            }}</VcsFormButton
          >
        </div>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
  import { VDialog, VCard, VCardText, VCardActions } from 'vuetify/components';
  import { computed, ref, inject } from 'vue';
  import { moduleIdSymbol } from '@vcmap/core';
  import { v5 as uuidv5 } from 'uuid';
  import { hideSplashScreenKey, setToLocalStorage } from '../localStorage.js';
  import { executeCallbacks } from '../callback/vcsCallback.js';
  import VcsFormButton from '../components/buttons/VcsFormButton.vue';
  import VcsCheckbox from '../components/form-inputs-controls/VcsCheckbox.vue';
  import VcsMarkdown from '../components/form-output/VcsMarkdown.vue';
  import { useProxiedAtomicModel } from '../components/modelHelper.js';
  import { name } from '../../package.json';

  /**
   * @param {import("@vcmap/ui").VcsUiApp} app
   * @returns {Promise<string>} The hash of the SplashScreen config.
   */
  export function getSplashScreenHash(app) {
    const config = app.uiConfig.getByKey('splashScreen');
    const string = JSON.stringify(
      Object.entries(config.value).sort((a, b) => a[0].localeCompare(b[0])),
    );
    return uuidv5(string, uuidv5.URL);
  }

  export default {
    name: 'VcsSplashScreen',
    components: {
      VDialog,
      VCard,
      VCardText,
      VCardActions,
      VcsFormButton,
      VcsCheckbox,
      VcsMarkdown,
    },
    props: {
      modelValue: {
        type: Boolean,
        default: false,
      },
      options: {
        type: Object,
        required: true,
      },
    },
    setup(props, { emit }) {
      const app = inject('vcsApp');
      const localValue = useProxiedAtomicModel(props, 'modelValue', emit);

      const checkBox = ref(false);
      const dontShowAgain = ref(false);

      function exitScreen() {
        localValue.value = false;
        checkBox.value = false;
        if (dontShowAgain.value) {
          const config = app.uiConfig.getByKey('splashScreen');
          const hash = getSplashScreenHash(app);
          const moduleId = config[moduleIdSymbol];
          setToLocalStorage(`${name}_${moduleId}`, hideSplashScreenKey, hash);
        }
        if (Array.isArray(props.options.exitCallbackOptions)) {
          executeCallbacks(app, props.options.exitCallbackOptions);
        }
      }

      function secondaryButtonClicked() {
        if (Array.isArray(props.options.secondaryCallbackOptions)) {
          executeCallbacks(app, props.options.secondaryCallbackOptions);
        }
      }

      const position = computed(() => ({
        width: props.options.position?.width || 800,
        height: props.options.position?.width || 500,
        maxWidth: props.options.position?.maxWidth,
        maxHeight: props.options.position?.maxHeight,
      }));

      return {
        localValue,
        exitScreen,
        secondaryButtonClicked,
        checkBox,
        dontShowAgain,
        position,
      };
    },
  };
</script>

<style scoped lang="scss">
  .marked-checkbox-content {
    :deep(p) {
      margin-bottom: 0;
    }
  }
  .v-input {
    margin-left: -5px !important;
  }
</style>
