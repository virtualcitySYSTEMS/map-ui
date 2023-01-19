<template>
  <v-sheet style="height: 100%">
    <v-container class="pa-2">
      <v-row
        dense
        align="center"
      >
        <v-col>
          <label> test</label>
        </v-col>
        <v-col>
          <v-text-field hide-details dense outlined />
        </v-col>
      </v-row>
      <v-row
        dense
      >
        <v-col>
          <v-text-field dense hide-details outlined class="ma-0" />
        </v-col>
        <v-col>
          <v-text-field dense hide-details class="ma-0" />
        </v-col>
        <v-col>
          <v-text-field label="test" dense hide-details outlined class="ma-0" />
        </v-col>
        <v-col>
          <v-text-field label="test" dense hide-details class="ma-0" />
        </v-col>
      </v-row>
      <v-row
        dense
      >
        <v-col>
          <v-text-field hide-details outlined />
        </v-col>
        <v-col>
          <v-text-field
            hide-details
            class="ma-0 pb-1 pt-1"
          />
        </v-col>
        <v-col>
          <v-text-field label="test" hide-details outlined />
        </v-col>
        <v-col>
          <v-text-field
            label="test"
            hide-details
            class="ma-0 pb-1 pt-1"
          />
        </v-col>
      </v-row>
      <v-row
        dense
      >
        <v-col>
          <v-text-field
            dense
            hide-details
            @mouseover="hover1 = true"
            @mouseleave="hover1 = false"
            :outlined="hover1"
            class="ma-0"
          />
        </v-col>
        <v-col>
          <v-text-field
            dense
            hide-details
            class="ma-0"
            @mouseover="hover2 = true"
            @mouseleave="hover2 = false"
            :outlined="hover2"
          />
        </v-col>
        <v-col>
          <v-text-field
            dense
            hide-details
            class="ma-0"
            label="test"
            @mouseover="hover3 = true"
            @mouseleave="hover3 = false"
            :outlined="hover3"
          />
        </v-col>
        <v-col>
          <v-text-field
            dense
            hide-details
            class="ma-0"
            label="test"
            @mouseover="hover4 = true"
            @mouseleave="hover4 = false"
            :outlined="hover4"
          />
        </v-col>
      </v-row>
    </v-container>
  </v-sheet>
</template>
<script>

  import {
    VSheet,
    VContainer,
    VRow,
    VCol,
    VTextField,
  } from 'vuetify/lib';

  export default {
    name: 'TextfieldsExample',
    components: {
      VSheet,
      VContainer,
      VRow,
      VCol,
      VTextField,
    },
    data() {
      return {
        hover1: false,
        hover2: false,
        hover3: false,
        hover4: false,
        email: 'test',
      };
    },
  };
</script>
