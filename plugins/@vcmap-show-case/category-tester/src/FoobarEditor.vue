<template>
  <AbstractConfigEditor
    @submit="apply"
    v-bind="{ ...$attrs, ...$props }"
    :set-config-on-cancel="false"
  >
    <v-container class="py-0 px-2">
      <v-row no-gutters v-if="!multi">
        <v-col>
          <VcsLabel html-for="name" required dense>
            {{ $t('categoryTester.fooEditor.name') }}
          </VcsLabel>
        </v-col>
        <v-col>
          <VcsTextField id="name" clearable dense v-model="localConfig.name" />
        </v-col>
      </v-row>
      <v-row no-gutters v-if="!multi">
        <v-col>
          <VcsLabel html-for="title" dense>
            {{ $t('categoryTester.fooEditor.title') }}
          </VcsLabel>
        </v-col>
        <v-col>
          <VcsTextField
            id="title"
            clearable
            dense
            v-model="localConfig.title"
          />
        </v-col>
      </v-row>
      <v-row no-gutters>
        <v-col>
          <VcsLabel html-for="random" dense>
            {{ $t('categoryTester.fooEditor.random') }}
          </VcsLabel>
        </v-col>
        <v-col>
          <VcsTextField
            id="random"
            clearable
            dense
            type="number"
            v-model.number="localConfig.random"
            :placeholder="$t('categoryTester.fooEditor.ambiguous')"
          />
        </v-col>
      </v-row>
    </v-container>
  </AbstractConfigEditor>
</template>

<script>
  import { onMounted, onUnmounted, ref, watch } from 'vue';
  import { VContainer, VRow, VCol } from 'vuetify/lib';
  import { AbstractConfigEditor, VcsLabel, VcsTextField } from '@vcmap/ui';

  export default {
    name: 'FoobarEditor',
    components: {
      AbstractConfigEditor,
      VcsLabel,
      VcsTextField,
      VContainer,
      VRow,
      VCol,
    },
    props: {
      multi: {
        type: Boolean,
        default: false,
      },
      selection: {
        type: Object,
        default: undefined,
      },
      getConfig: {
        type: Function,
        required: true,
      },
      setConfig: {
        type: Function,
        required: true,
      },
    },
    setup(props) {
      const localConfig = ref({});
      let stopWatching = () => {};

      onMounted(async () => {
        localConfig.value = await props.getConfig();
      });

      if (props.multi && props.selection) {
        stopWatching = watch(
          () => props.selection,
          async () => {
            localConfig.value = await props.getConfig();
          },
        );
      }

      onUnmounted(() => stopWatching());

      async function apply() {
        await props.setConfig(localConfig.value);
      }

      return {
        localConfig,
        apply,
      };
    },
  };
</script>

<style lang="scss" scoped></style>
