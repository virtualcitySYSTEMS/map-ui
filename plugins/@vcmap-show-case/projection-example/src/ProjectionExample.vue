<script setup lang="ts">
  import { ref, toRaw } from 'vue';
  import { mercatorProjection } from '@vcmap/core';
  import { VContainer, VCol, VRow, VSwitch } from 'vuetify/components';
  import { VcsProjection, VcsFormButton, VcsLabel } from '@vcmap/ui';

  const projectionOptions = ref(mercatorProjection.toJSON());
  const required = ref(false);
  const hideRequestButton = ref(false);
  const hideAlias = ref(false);
  function reset() {
    projectionOptions.value = mercatorProjection.toJSON();
    console.log(mercatorProjection.toJSON());
  }
</script>

<template>
  <div>
    <v-container>
      <v-row no-gutters>
        <v-col>
          <VcsLabel>
            {{ $t('required') }}
          </VcsLabel>
        </v-col>
        <v-col>
          <v-switch v-model="required" />
        </v-col>
      </v-row>
      <v-row no-gutters>
        <v-col>
          <VcsLabel>
            {{ $t('hideRequestButton') }}
          </VcsLabel>
        </v-col>
        <v-col>
          <v-switch v-model="hideRequestButton" />
        </v-col>
      </v-row>
      <v-row no-gutters>
        <v-col>
          <VcsLabel>
            {{ $t('hideAlias') }}
          </VcsLabel>
        </v-col>
        <v-col>
          <v-switch v-model="hideAlias" />
        </v-col>
      </v-row>
      <v-row no-gutters>
        <v-col>
          <vcs-form-button @click="reset" class="w-100"
            >Reset Web Mercator</vcs-form-button
          >
        </v-col>
      </v-row>
    </v-container>
    <vcs-projection
      v-model="projectionOptions"
      :required="required"
      :hide-request-button="hideRequestButton"
      :hide-alias="hideAlias"
      class="pa-1"
    ></vcs-projection>
    <div class="d-flex gc-2 justify-end mr-2">
      <vcs-form-button @click="console.log(toRaw(projectionOptions))">{{
        $t('projectionExample.log')
      }}</vcs-form-button>
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
