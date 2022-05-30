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
        <v-list-item-title class="font-weight-bold">
          ACTIVE
        </v-list-item-title>
      </v-list-item-content>
      <v-list-item-action>
        <v-switch v-model="active" />
      </v-list-item-action>
    </v-list-item>
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
          &ltVcsButton standard/&gt (default)
        </v-list-item-title>
        <v-row>
          <v-col>
            <v-card>
              <v-card-title>PRIMARY</v-card-title>
              <v-card-actions>
                <VcsButton
                  @click="toggle"
                  :active="active"
                  color="primary"
                  :disabled="disabled"
                  :has-update="update"
                  :icon="loading ? '$vcsProgress' : ''"
                  tooltip="PRIMARY BUTTON"
                >
                  PRIMARY
                </VcsButton>
              </v-card-actions>
            </v-card>
          </v-col>
          <v-col>
            <v-card>
              <v-card-title>SECONDARY</v-card-title>
              <v-card-actions>
                <VcsButton
                  @click="toggle"
                  :active="active"
                  :disabled="disabled"
                  :has-update="update"
                  tooltip="SECONDARY BUTTON"
                >
                  SECONDARY
                </VcsButton>
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
          &ltVcsButton large/&gt (e.g. Navbar)
        </v-list-item-title>
        <v-row>
          <v-col>
            <v-card>
              <v-card-title>STANDARD</v-card-title>
              <v-card-actions>
                <VcsButton
                  @click="toggle"
                  :active="active"
                  :disabled="disabled"
                  :has-update="update"
                  :icon="loading ? '$vcsProgress' : '$vcs3d'"
                  tooltip="ButtonClass large"
                  large
                />
              </v-card-actions>
            </v-card>
          </v-col>
          <v-col>
            <v-card>
              <v-card-title>OVERFLOW</v-card-title>
              <v-card-actions>
                <VcsActionButtonList
                  :actions="[
                    { name: 'Tool 1', title: 'Overflow Button with active state', callback: toggle, active },
                    { name: 'Tool 2', title: 'Overflow Button without state', callback: toggle },
                  ]"
                  :overflow-count="0"
                  button-class="large"
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
          &ltVcsButton small/&gt
        </v-list-item-title>
        <v-row>
          <v-col>
            <v-card>
              <v-card-title>STANDARD</v-card-title>
              <v-card-actions>
                <VcsButton
                  @click="toggle"
                  :active="active"
                  :disabled="disabled"
                  :icon="loading ? '$vcsProgress' : '$vcsColorSwatch'"
                  tooltip="ACTION BUTTON"
                  small
                />
              </v-card-actions>
            </v-card>
          </v-col>
          <v-col>
            <v-card>
              <v-card-title>OVERFLOW</v-card-title>
              <v-card-actions>
                <VcsActionButtonList
                  :actions="[
                    { name: 'Action 1', title: 'Overflow Button with active state', callback: toggle, active },
                    { name: 'Action 2', title: 'Overflow Button without state', callback: toggle },
                  ]"
                  :overflow-count="0"
                  small
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
  import { VcsButton, VcsActionButtonList } from '@vcmap/ui';

  export default {
    name: 'ButtonExamples',
    components: { VcsButton, VcsActionButtonList },
    setup() {
      return {
        active: false,
        disabled: false,
        update: false,
        loading: false,
        toggle() {
          this.active = !this.active;
        },
      };
    },
  };
</script>
