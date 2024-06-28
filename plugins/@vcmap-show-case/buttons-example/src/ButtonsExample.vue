<template>
  <v-card>
    <v-list density="compact">
      <v-list-item density="compact">
        <v-list-item-title class="font-weight-bold">
          DISABLED
        </v-list-item-title>
        <template #append>
          <v-list-item-action>
            <v-switch hide-details density="compact" v-model="disabled" />
          </v-list-item-action>
        </template>
      </v-list-item>
      <v-divider />
      <v-list-item>
        <v-list-item-title class="font-weight-bold">
          HAS UPDATE
        </v-list-item-title>
        <template #append>
          <v-list-item-action>
            <v-switch hide-details density="compact" v-model="update" />
          </v-list-item-action>
        </template>
      </v-list-item>
      <v-divider />
      <v-list-item>
        <v-list-item-title class="font-weight-bold"> ACTIVE </v-list-item-title>
        <template #append>
          <v-list-item-action>
            <v-switch hide-details density="compact" v-model="active" />
          </v-list-item-action>
        </template>
      </v-list-item>
      <v-divider />
      <v-list-item>
        <v-list-item-title class="font-weight-bold">
          ACTIVE BACKGROUND
        </v-list-item-title>
        <template #append>
          <v-list-item-action>
            <v-switch hide-details density="compact" v-model="background" />
          </v-list-item-action>
        </template>
      </v-list-item>
      <v-divider />
      <v-list-item>
        <v-list-item-title class="font-weight-bold">
          LOADING
        </v-list-item-title>
        <template #append>
          <v-list-item-action>
            <v-switch hide-details density="compact" v-model="loading" />
          </v-list-item-action>
        </template>
      </v-list-item>
      <v-divider />
      <v-list-item>
        <v-list-item-title class="font-weight-bold">
          <!-- eslint-disable-next-line -->
          &ltVcsFormButton /&gt
        </v-list-item-title>
        <v-row class="pa-1">
          <v-col>
            <v-card>
              <v-card-title>Form fields</v-card-title>
              <v-card-actions>
                <div class="d-flex gc-2">
                  <VcsFormButton
                    @click="toggle"
                    :disabled="disabled"
                    :has-update="update"
                    :loading="loading"
                    tooltip="OUTLINED BUTTON"
                  >
                    OUTLINED
                  </VcsFormButton>
                  <VcsFormButton
                    @click="toggle"
                    :disabled="disabled"
                    :has-update="update"
                    :loading="loading"
                    tooltip="FILLED BUTTON"
                    variant="filled"
                  >
                    FILLED
                  </VcsFormButton>
                </div>
              </v-card-actions>
            </v-card>
          </v-col>
          <v-col>
            <v-card>
              <v-card-title>OVERFLOW</v-card-title>
              <v-card-actions>
                <VcsActionButtonList
                  :disabled="disabled"
                  :actions="[
                    {
                      name: 'Action 1',
                      title: 'Overflow Button with active state',
                      callback: toggle,
                      active,
                    },
                    {
                      name: 'Action 2',
                      title: 'Overflow Button without state',
                      callback: toggle,
                    },
                  ]"
                  button="VcsFormButton"
                  :overflow-count="0"
                />
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </v-list-item>
      <v-divider />
      <v-list-item>
        <v-list-item-title class="font-weight-bold">
          <!-- eslint-disable-next-line -->
          &ltVcsToolButton/&gt
        </v-list-item-title>
        <v-row class="pa-1">
          <v-col>
            <v-card>
              <v-card-title>Navbar</v-card-title>
              <v-card-actions>
                <VcsToolButton
                  @click="toggle"
                  :active="active"
                  :disabled="disabled"
                  :background="background"
                  :has-update="update"
                  :loading="loading"
                  icon="$vcs3d"
                  tooltip="VcsToolButton"
                />
              </v-card-actions>
            </v-card>
          </v-col>
          <v-col>
            <v-card>
              <v-card-title>OVERFLOW</v-card-title>
              <v-card-actions>
                <VcsActionButtonList
                  :disabled="disabled"
                  :actions="[
                    {
                      name: 'Tool 1',
                      title: 'Overflow Button with active state',
                      callback: toggle,
                      active,
                    },
                    {
                      name: 'Tool 2',
                      title: 'Overflow Button without state',
                      callback: toggle,
                    },
                  ]"
                  button="VcsToolButton"
                  :overflow-count="0"
                />
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </v-list-item>
      <v-divider />
      <v-list-item>
        <v-list-item-title class="font-weight-bold">
          <!-- eslint-disable-next-line -->
          &ltVcsButton/&gt
        </v-list-item-title>
        <v-row class="pa-1">
          <v-col>
            <v-card>
              <v-card-title>Action Item</v-card-title>
              <v-card-actions>
                <VcsButton
                  @click="toggle"
                  :active="active"
                  :has-update="update"
                  :disabled="disabled"
                  :loading="loading"
                  icon="$vcsColorSwatch"
                  tooltip="ACTION BUTTON"
                />
              </v-card-actions>
            </v-card>
          </v-col>
          <v-col>
            <v-card>
              <v-card-title>OVERFLOW</v-card-title>
              <v-card-actions>
                <VcsActionButtonList
                  :disabled="disabled"
                  :actions="[
                    {
                      name: 'Action 1',
                      title: 'Overflow Button with active state',
                      callback: toggle,
                      active,
                    },
                    {
                      name: 'Action 2',
                      title: 'Overflow Button without state',
                      callback: toggle,
                    },
                  ]"
                  :overflow-count="0"
                />
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </v-list-item>
    </v-list>
  </v-card>
</template>
<script>
  import {
    VcsButton,
    VcsToolButton,
    VcsFormButton,
    VcsActionButtonList,
  } from '@vcmap/ui';
  import { ref } from 'vue';
  import {
    VCard,
    VList,
    VListItem,
    VListItemTitle,
    VListItemAction,
    VSwitch,
    VDivider,
    VRow,
    VCol,
    VCardTitle,
    VCardActions,
  } from 'vuetify/components';

  export default {
    name: 'ButtonsExample',
    components: {
      VcsButton,
      VcsToolButton,
      VcsFormButton,
      VcsActionButtonList,
      VCard,
      VList,
      VListItem,
      VListItemTitle,
      VListItemAction,
      VSwitch,
      VDivider,
      VRow,
      VCol,
      VCardTitle,
      VCardActions,
    },
    setup() {
      const active = ref(false);
      const background = ref(false);
      const disabled = ref(false);
      const update = ref(false);
      const loading = ref(false);

      return {
        active,
        background,
        disabled,
        update,
        loading,
        toggle() {
          active.value = !active.value;
        },
      };
    },
  };
</script>
