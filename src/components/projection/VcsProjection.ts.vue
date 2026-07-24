<script setup lang="ts">
  import type { PropType } from 'vue';
  import { computed, inject, ref, toRaw, useAttrs, watch } from 'vue';
  import { VRow, VCol, VContainer } from 'vuetify/components';
  import { getCaughtError, Projection } from '@vcmap/core';
  import type { ProjectionOptions } from '@vcmap/core';
  import deepEqual from 'fast-deep-equal';
  import { getLogger } from '@vcsuite/logger';
  import VcsCheckbox from '../form-inputs-controls/VcsCheckbox.ts.vue';
  import VcsButton from '../buttons/VcsButton.ts.vue';
  import VcsTextField from '../form-inputs-controls/VcsTextField.ts.vue';
  import VcsChipArrayInput from '../form-inputs-controls/VcsChipArrayInput.ts.vue';
  import VcsLabel from '../form-inputs-controls/VcsLabel.ts.vue';
  import { NotificationType } from '../../notifier/notifier.js';
  import { useComponentId, usePadding } from '../composables.js';
  import type VcsUiApp from '../../vcsUiApp.js';

  const epsgRegex = /^([a-zA-Z]+:)*(\d{4,6})$/i;

  function parseEPSGCode(epsg: string | number | undefined): {
    prefix?: string | null;
    code?: string;
  } {
    if (!epsg) {
      return {};
    }

    const match = String(epsg).match(epsgRegex);
    if (!match) {
      return {};
    }

    let prefix = match[1] ? match[1].toUpperCase().replace(/:$/, '') : null;
    const code = match[2];

    if (prefix === 'EPSG') {
      prefix = null;
    }
    return { prefix, code };
  }

  /**
   * @param {string|number} epsgCode
   * @returns {Promise<string>}
   */
  function getProj4FromEPSGIo(epsgCode: string | number): Promise<string> {
    return fetch(`https://epsg.io/${epsgCode}.proj4`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Could not find EPSG Code');
        }
        return response.text();
      })
      .then((data) => {
        if (data.length > 1000) {
          throw new Error('Could not find EPSG Code');
        }
        return data;
      });
  }

  const props = defineProps({
    modelValue: {
      type: Object as PropType<ProjectionOptions>,
      default: undefined,
    },
    required: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    hideRequestButton: {
      type: Boolean,
      default: false,
    },
    hideAlias: {
      type: Boolean,
      default: false,
    },
  });

  const emit = defineEmits(['update:modelValue']);

  const localValue = ref(structuredClone(toRaw(props.modelValue)));
  // Watch for changes in prop (reassignment) and update internal
  watch(
    () => props.modelValue,
    (internalValue) => {
      const newValue = toRaw(internalValue);
      if (!newValue || deepEqual(localValue.value, newValue)) {
        return;
      }
      try {
        localValue.value = structuredClone(newValue);
      } catch (e) {
        getLogger('modelHelper').error(
          'Failed to update internal value. You may have a provided a deeply nested ref, which caused',
          e,
        );
      }
    },
    { deep: true, immediate: true },
  );

  const hasLocalValue = computed({
    get() {
      return Object.keys(localValue?.value ?? {}).length > 0;
    },
    set(value) {
      localValue.value = value ? { epsg: undefined } : undefined;
    },
  });

  watch(
    () => localValue.value?.epsg,
    () => {
      const { code, prefix } = parseEPSGCode(localValue.value?.epsg);
      if (code && localValue.value && code !== localValue.value.epsg) {
        localValue.value.epsg = code;
      }
      if (prefix && localValue.value && prefix !== localValue.value.prefix) {
        localValue.value.prefix = prefix;
      }
    },
    { immediate: true },
  );

  const app = inject('vcsApp') as VcsUiApp;

  const requesting = ref(false);

  async function requestProj4(): Promise<void> {
    try {
      requesting.value = true;
      if (localValue.value) {
        localValue.value.proj4 = await getProj4FromEPSGIo(
          localValue.value.epsg as string,
        );
      }
    } catch (err: unknown) {
      const { message } = getCaughtError(err);
      app.notifier.add({
        type: NotificationType.ERROR,
        title: 'components.projection.epsgIoRequestFailed',
        message,
      });
      getLogger('VcsProjection').error(message);
    } finally {
      requesting.value = false;
    }
  }

  function validateProj4(proj4: string | undefined): true | string {
    return (
      Projection.validateOptions({ ...localValue.value, proj4 }) ||
      'components.projection.invalidProj4'
    );
  }

  function validateEpsg(epsg: string | undefined): true | string {
    return /^\d{4,6}$/.test(epsg ?? '') || 'components.projection.invalidProj4';
  }

  watch(
    localValue,
    (internalValue) => {
      const newValue = toRaw(internalValue);
      const value = toRaw(props.modelValue);
      if (
        newValue !== undefined &&
        (deepEqual(value, newValue) ||
          !(
            validateEpsg(newValue?.epsg as string | undefined) === true &&
            Projection.validateOptions(newValue)
          ))
      ) {
        return;
      }
      try {
        emit(`update:modelValue`, structuredClone(newValue));
      } catch (e) {
        getLogger('modelHelper').error(
          'Failed to emit value. You may have a provided a deeply nested ref, which caused',
          e,
        );
      }
    },
    { deep: true },
  );

  const cid = useComponentId();
  const paddingProvided = usePadding(useAttrs());

  const prefix = computed({
    get() {
      return localValue.value?.prefix ?? '';
    },
    set(value) {
      if (localValue.value === undefined) {
        localValue.value = {};
      }
      localValue.value.prefix = value;
    },
  });

  const epsg = computed({
    get() {
      return localValue.value?.epsg ?? '';
    },
    set(value) {
      if (localValue.value === undefined) {
        localValue.value = {};
      }
      localValue.value.epsg = value;
    },
  });

  const proj4 = computed({
    get() {
      return localValue.value?.proj4 ?? '';
    },
    set(value) {
      if (localValue.value === undefined) {
        localValue.value = {};
      }
      localValue.value.proj4 = value;
    },
  });

  const alias = computed({
    get() {
      return localValue.value?.alias ?? [];
    },
    set(value) {
      if (localValue.value === undefined) {
        localValue.value = {};
      }
      if (value.length > 0) {
        localValue.value.alias = value;
      } else {
        localValue.value.alias = undefined;
      }
    },
  });

  // manual conditional validation
  const errorMessages = ref();
  watch([epsg, proj4], () => {
    const e = validateProj4(localValue.value?.proj4);
    errorMessages.value = e === true ? undefined : e;
  });
</script>

<template>
  <v-container :class="{ 'pa-0': !paddingProvided }">
    <v-row no-gutters v-if="!required">
      <v-col>
        <VcsCheckbox
          v-model="hasLocalValue"
          label="components.projection.title"
        ></VcsCheckbox>
      </v-col>
    </v-row>
    <template v-if="required || hasLocalValue">
      <v-row no-gutters>
        <v-col cols="4">
          <VcsLabel :html-for="`${cid}-epsg`" required>
            {{ $st('components.projection.epsg') }}
          </VcsLabel>
        </v-col>
        <v-col>
          <VcsTextField clearable placeholder="EPSG" v-model.trim="prefix">
            <template #append><p>:</p></template>
          </VcsTextField>
        </v-col>
        <v-col>
          <VcsTextField
            :id="`${cid}-epsg`"
            clearable
            placeholder="code"
            v-model.trim="epsg"
            :rules="[validateEpsg]"
          />
        </v-col>
      </v-row>
      <v-row no-gutters>
        <v-col cols="4">
          <VcsLabel :html-for="`${cid}-proj4`">
            {{ $st('components.projection.proj4') }}
          </VcsLabel>
        </v-col>
        <v-col>
          <VcsTextField
            :id="`${cid}-proj4`"
            clearable
            :rules="[validateProj4]"
            :error-messages="errorMessages"
            v-model="proj4"
            class="w-100"
          >
            <template #append>
              <VcsButton
                v-if="!hideRequestButton"
                icon="mdi-download"
                tooltip="components.projection.proj4Tooltip"
                :loading="requesting"
                :disabled="!/^\d{4,6}$/.test(epsg as string)"
                @click="requestProj4"
              />
            </template>
          </VcsTextField>
        </v-col>
      </v-row>
      <v-row no-gutters v-if="!hideAlias">
        <v-col cols="4">
          <VcsLabel :html-for="`${cid}-alias`">
            {{ $st('components.projection.alias') }}
          </VcsLabel>
        </v-col>
        <v-col>
          <VcsChipArrayInput :id="`${cid}-alias`" clearable v-model="alias" />
        </v-col>
      </v-row>
    </template>
  </v-container>
</template>

<style scoped lang="scss">
  :deep(.v-input__append) {
    margin: 0;
  }
</style>
