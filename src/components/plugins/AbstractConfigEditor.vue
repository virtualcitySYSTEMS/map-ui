<template>
  <v-container class="pa-0 abstract-config-editor">
    <v-form v-model="isValid" @submit.prevent="submit">
      <slot />
      <div class="d-flex gc-2 px-2 pt-2 pb-1">
        <div class="d-flex gc-2 w-100 justify-start">
          <VcsFormButton v-if="showReset" icon="$vcsReturn" @click="reset" />
        </div>
        <div class="d-flex gc-2 w-100 justify-end">
          <VcsFormButton type="submit" variant="filled" :disabled="!isValid">
            {{ $st(submitButtonTitle) }}
          </VcsFormButton>
          <VcsFormButton @click.stop="cancel">
            {{ $t('components.cancel') }}
          </VcsFormButton>
          <VcsActionButtonList :actions="actions" button="VcsFormButton" />
        </div>
      </div>
    </v-form>
  </v-container>
</template>

<script>
  import { VContainer, VForm } from 'vuetify/components';
  import { ref, inject } from 'vue';
  import VcsFormButton from '../buttons/VcsFormButton.vue';
  import VcsActionButtonList from '../buttons/VcsActionButtonList.vue';

  /**
   * @description Basic wrapper for all config editor components using {@link https://vuetifyjs.com/en/api/v-form/ |vuetify form}.
   * Providing a footer with submit, cancel and optionally reset button.
   * @vue-prop {boolean} [showReset=false] - Flag to show a reset button in the footer. You need to handle @reset in a child component.
   * @vue-prop {Array<VcsAction>} [actions] - Optional actions rendered as ActionButtonList in the footer.
   * @vue-prop {string} [submitButtonTitle='components.apply'] - Option to change the submit button title, e.g. to 'components.add'.
   * @vue-prop {boolean} [autoClose=true] - Whether window component shall be close on submit or cancel.
   * @vue-event {Event} submit - Event fired on clicking the submit button.
   * @vue-event {Event} cancel - Event fired on clicking the cancel button.
   * @vue-event {Event} reset - Event fired on clicking the reset button.
   */
  export default {
    name: 'AbstractConfigEditor',
    components: {
      VContainer,
      VForm,
      VcsFormButton,
      VcsActionButtonList,
    },
    props: {
      showReset: {
        type: Boolean,
        default: false,
      },
      actions: {
        type: Array,
        default: () => [],
      },
      submitButtonTitle: {
        type: String,
        default: 'components.apply',
      },
      setConfigOnCancel: {
        type: Boolean,
        default: true,
      },
      autoClose: {
        type: Boolean,
        default: true,
      },
    },
    emits: ['submit', 'cancel', 'reset'],
    setup(props, { attrs, emit }) {
      const app = inject('vcsApp');

      const close = () => {
        if (app.windowManager.has(attrs['window-state'].id)) {
          app.windowManager.remove(attrs['window-state'].id);
        }
      };

      return {
        isValid: ref(true),
        submit(e) {
          emit('submit', e);
          if (props.autoClose) {
            close();
          }
        },
        cancel(e) {
          emit('cancel', e);
          if (props.autoClose) {
            close();
          }
        },
        reset(e) {
          emit('reset', e);
        },
      };
    },
  };
</script>

<style scoped></style>
