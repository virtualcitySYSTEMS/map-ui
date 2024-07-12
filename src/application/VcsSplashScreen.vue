<template>
  <v-dialog
    v-if="options"
    v-model="localValue"
    :width="position.width"
    :height="position.height"
    :max-width="position.maxWidth"
    :max-height="position.maxHeight"
    persistent
  >
    <v-card>
      <div class="px-2 pt-2 pb-1">
        <v-card-text>
          <VcsMarked :content="splashScreenText"></VcsMarked>

          <v-row class="mt-2" v-if="options.acceptInput" no-gutters>
            <v-col class="align-center d-flex">
              <VcsCheckbox v-model="checkBox"> </VcsCheckbox>

              <VcsLabel>
                <div
                  v-html="splashScreenCheckboxText"
                  class="marked-checkbox-content"
                ></div>
              </VcsLabel>
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions>
          <v-col class="text-right">
            <VcsFormButton
              color="primary"
              variant="filled"
              @click="exitScreen"
              :disabled="!checkBox"
              >{{ $t(options.buttonTitle) }}</VcsFormButton
            >
          </v-col>
        </v-card-actions>
      </div>
    </v-card>
  </v-dialog>
</template>

<script>
  import {
    VDialog,
    VCard,
    VCardText,
    VCardActions,
    VRow,
    VCol,
  } from 'vuetify/components';
  import { computed, getCurrentInstance, ref } from 'vue';
  import { parseAndSanitizeMarkdown } from './markdownHelper.js';
  import VcsFormButton from '../components/buttons/VcsFormButton.vue';
  import VcsCheckbox from '../components/form-inputs-controls/VcsCheckbox.vue';
  import VcsLabel from '../components/form-inputs-controls/VcsLabel.vue';
  import VcsMarked from '../components/form-output/VcsMarkdown.vue';
  import { useProxiedAtomicModel } from '../components/modelHelper.js';

  export default {
    name: 'VcsSplashScreen',
    components: {
      VcsLabel,
      VDialog,
      VCard,
      VCardText,
      VCardActions,
      VcsFormButton,
      VcsCheckbox,
      VRow,
      VCol,
      VcsMarked,
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
      const localValue = useProxiedAtomicModel(props, 'modelValue', emit);

      const vm = getCurrentInstance().proxy;
      const splashScreenText = computed(() => {
        return vm.$st(props.options.content);
      });

      const splashScreenCheckboxText = computed(() => {
        const translatedContent = vm.$st(props.options.checkBoxText);
        return parseAndSanitizeMarkdown(translatedContent);
      });

      const checkBox = ref(!props.options.acceptInput);
      const exitScreen = () => {
        localValue.value = false;
      };

      const position = computed(() => ({
        width: props.options.position?.width || 800,
        height: props.options.position?.width || 500,
        maxWidth: props.options.position?.maxWidth,
        maxHeight: props.options.position?.maxHeight,
      }));

      return {
        localValue,
        exitScreen,
        splashScreenText,
        splashScreenCheckboxText,
        checkBox,
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
