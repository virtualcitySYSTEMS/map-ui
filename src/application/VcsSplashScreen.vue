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
          <VcsMarkdown :content="$st(options.content)" />
          <VcsCheckbox v-if="options.acceptInput" v-model="checkBox">
            <template #label>
              <VcsMarkdown
                :content="$st(options.checkBoxText)"
                class="marked-checkbox-content"
              />
            </template>
          </VcsCheckbox>
        </v-card-text>

        <v-card-actions>
          <v-row no-gutters>
            <v-col class="text-right">
              <VcsFormButton
                color="primary"
                variant="filled"
                @click="exitScreen"
                :disabled="options.acceptInput && !checkBox"
                >{{ $t(options.buttonTitle) }}</VcsFormButton
              >
            </v-col>
          </v-row>
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
  import { computed, ref } from 'vue';
  import VcsFormButton from '../components/buttons/VcsFormButton.vue';
  import VcsCheckbox from '../components/form-inputs-controls/VcsCheckbox.vue';
  import VcsMarkdown from '../components/form-output/VcsMarkdown.vue';
  import { useProxiedAtomicModel } from '../components/modelHelper.js';

  export default {
    name: 'VcsSplashScreen',
    components: {
      VDialog,
      VCard,
      VCardText,
      VCardActions,
      VcsFormButton,
      VcsCheckbox,
      VRow,
      VCol,
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
      const localValue = useProxiedAtomicModel(props, 'modelValue', emit);

      const checkBox = ref(false);
      const exitScreen = () => {
        localValue.value = false;
        checkBox.value = false;
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
