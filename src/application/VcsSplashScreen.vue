<template>
  <v-dialog
    v-model="dialog"
    :width="textPage.position.width"
    :height="textPage.position.height"
    :max-width="textPage.position.maxWidth"
    :max-height="textPage.position.maxHeight"
    persistent
  >
    <v-card>
      <div class="px-2 pt-2 pb-1">
        <v-card-text>
          <div v-html="splashScreenText"></div>

          <v-row class="mt-2" v-if="acceptInput" no-gutters>
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
              >{{ buttonTitle }}</VcsFormButton
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

  const dialog = ref(true);
  export function createSplashScreenAction(options) {
    return {
      ...options,
      callback() {
        dialog.value = true;
      },
    };
  }

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
      textPage: {
        type: Object,
        default: () => {},
      },
      windowId: {
        type: String,
        required: true,
      },
    },
    setup(props) {
      const vm = getCurrentInstance().proxy;
      const splashScreenText = computed(() => {
        const translatedContent = vm.$st(props.textPage.content);
        return parseAndSanitizeMarkdown(translatedContent);
      });
      const buttonTitle = vm.$st(props.textPage.buttonTitle);

      const splashScreenCheckboxText = computed(() => {
        const translatedContent = vm.$st(props.textPage.checkBoxText);
        return parseAndSanitizeMarkdown(translatedContent);
      });

      const acceptInput = ref(props.textPage.acceptInput);
      const checkBox = ref(!acceptInput.value);
      const exitScreen = () => {
        dialog.value = false;
      };

      return {
        dialog,
        exitScreen,
        splashScreenText,
        splashScreenCheckboxText,
        checkBox,
        acceptInput,
        buttonTitle,
      };
    },
  };
</script>

<style scoped lang="scss">
  .marked-checkbox-content ::v-deep p {
    margin-bottom: 0;
  }
</style>
