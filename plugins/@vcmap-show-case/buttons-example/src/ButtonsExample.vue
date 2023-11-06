<template>
  <v-card>
    <v-list-item>
      <v-list-item-content>
        <v-list-item-title class="font-weight-bold">
          DISABLED
        </v-list-item-title>
      </v-list-item-content>
      <v-list-item-action>
        <v-switch v-model="disabled" />
      </v-list-item-action>
    </v-list-item>
    <v-divider />
    <v-list-item>
      <v-list-item-content>
        <v-list-item-title class="font-weight-bold">
          HAS UPDATE
        </v-list-item-title>
      </v-list-item-content>
      <v-list-item-action>
        <v-switch v-model="update" />
      </v-list-item-action>
    </v-list-item>
    <v-divider />
    <v-list-item>
      <v-list-item-content>
        <v-list-item-title class="font-weight-bold"> ACTIVE </v-list-item-title>
      </v-list-item-content>
      <v-list-item-action>
        <v-switch v-model="active" />
      </v-list-item-action>
    </v-list-item>
    <v-divider />
    <v-list-item>
      <v-list-item-content>
        <v-list-item-title class="font-weight-bold">
          ACTIVE BACKGROUND
        </v-list-item-title>
      </v-list-item-content>
      <v-list-item-action>
        <v-switch v-model="background" />
      </v-list-item-action>
    </v-list-item>
    <v-divider />
    <v-list-item>
      <v-list-item-content>
        <v-list-item-title class="font-weight-bold">
          LOADING
        </v-list-item-title>
      </v-list-item-content>
      <v-list-item-action>
        <v-switch v-model="loading" />
      </v-list-item-action>
    </v-list-item>
    <v-divider />
    <v-list-item>
      <v-list-item-content>
        <v-list-item-title class="font-weight-bold">
          <!-- eslint-disable-next-line -->
          &ltVcsFormButton /&gt
        </v-list-item-title>
        <v-row>
          <v-col>
            <v-card>
              <v-card-title>Form fields</v-card-title>
              <v-card-actions>
                <div class="d-flex gap-2">
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
      </v-list-item-content>
    </v-list-item>
    <v-divider />
    <v-list-item>
      <v-list-item-content>
        <v-list-item-title class="font-weight-bold">
          <!-- eslint-disable-next-line -->
          &ltVcsToolButton/&gt
        </v-list-item-title>
        <v-row>
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
      </v-list-item-content>
    </v-list-item>
    <v-divider />
    <v-list-item>
      <v-list-item-content>
        <v-list-item-title class="font-weight-bold">
          <!-- eslint-disable-next-line -->
          &ltVcsButton/&gt
        </v-list-item-title>
        <v-row>
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
      </v-list-item-content>
    </v-list-item>
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
    VListItem,
    VListItemContent,
    VListItemTitle,
    VListItemAction,
    VSwitch,
    VDivider,
    VRow,
    VCol,
    VCardTitle,
    VCardActions,
  } from 'vuetify/lib';

  export default {
    name: 'ButtonsExample',
    components: {
      VcsButton,
      VcsToolButton,
      VcsFormButton,
      VcsActionButtonList,
      VCard,
      VListItem,
      VListItemContent,
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
