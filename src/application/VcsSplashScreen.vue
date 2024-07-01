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
          <div v-html="splashScreenText"></div>

          <v-row class="mt-2" v-if="options.acceptInput" no-gutters>
            <v-col class="align-center d-flex">
              <VcsCheckbox
                id="checkbox_splashScreen"
                style="margin-bottom: 16px"
                v-model="checkBox"
              >
              </VcsCheckbox>

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
  import { computed, getCurrentInstance, ref, watch } from 'vue';
  import { parseAndSanitizeMarkdown } from './markdownHelper.js';
  import VcsFormButton from '../components/buttons/VcsFormButton.vue';
  import VcsCheckbox from '../components/form-inputs-controls/VcsCheckbox.vue';
  import VcsLabel from '../components/form-inputs-controls/VcsLabel.vue';

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
    },
    props: {
      value: {
        type: Boolean,
        default: false,
      },
      options: {
        type: Object,
        required: true,
      },
    },
    setup(props, { emit }) {
      const localValue = ref(props.value);
      watch(
        () => props.value,
        (newValue) => {
          localValue.value = newValue;
        },
      );
      const vm = getCurrentInstance().proxy;
      const splashScreenText = computed(() => {
        const translatedContent = vm.$st(props.options.content);
        return parseAndSanitizeMarkdown(translatedContent);
      });

      const splashScreenCheckboxText = computed(() => {
        const translatedContent = vm.$st(props.options.checkBoxText);
        return parseAndSanitizeMarkdown(translatedContent);
      });

      const checkBox = ref(!props.options.acceptInput);
      const exitScreen = () => {
        localValue.value = false;
        emit('input', localValue.value);
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
  .marked-checkbox-content ::v-deep p {
    margin-bottom: 0;
  }
</style>
