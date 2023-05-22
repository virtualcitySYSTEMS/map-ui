<template>
  <v-sheet class="d-flex flew-row align-center pl-2 pr-2">
    <VcsTextField :value="localLink" class="d-flex col-10 pa-0 mr-2" />
    <div class="d-flex col-2 justify-end pa-0">
      <VcsButton
        icon="mdi-content-copy"
        class="mr-2"
        @click="copy"
        :title="$t('createLink.copyToClipboard')"
      />
      <VcsButton
        icon="mdi-refresh"
        class="mr-2"
        @click="refresh"
        :title="$t('createLink.refreshTooltip')"
      />
    </div>
  </v-sheet>
</template>

<script>
  import { VSheet } from 'vuetify/lib';
  import {
    VcsTextField,
    VcsButton,
    setStateToUrl,
    NotificationType,
  } from '@vcmap/ui';
  import { getCurrentInstance, inject, ref } from 'vue';

  export default {
    name: 'FallbackCreateLink',
    props: {
      link: {
        type: String,
        required: true,
      },
    },
    components: {
      VcsTextField,
      VcsButton,
      VSheet,
    },
    setup(props) {
      const localLink = ref(props.link);
      const app = inject('vcsApp');

      const { proxy } = getCurrentInstance();
      const copy = () => {
        const element = proxy.$el.querySelector('input');
        element.select();
        document.execCommand('copy');
        app.notifier.add({
          title: 'createLink.title',
          message: 'createLink.copied',
          type: NotificationType.SUCCESS,
        });
      };

      const refresh = async () => {
        const state = await app.getState(true);
        const url = new URL(window.location.href);
        setStateToUrl(state, url);
        localLink.value = url.toString();
      };

      return {
        copy,
        refresh,
        localLink,
      };
    },
  };
</script>

<style scoped></style>
