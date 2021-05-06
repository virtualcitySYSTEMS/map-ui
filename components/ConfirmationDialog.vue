<template>
  <div class="text-center">
    <v-dialog
      v-model="open"
      :width="width"
      :content-class="contentClass"
      :class="[...customClasses]"
    >
      <v-card>
        <slot name="title">
          <v-card-title
            class="header grey h-12 lighten-2 justify-center pt-5 line-height-1.2 font-size-14"
          >
            <strong>{{ title }}</strong>
          </v-card-title>
        </slot>

        <v-card-text slot class="mt-2">
          <p>
            {{ body }}
          </p>
        </v-card-text>

        <v-card-actions>
          <slot :close="close" name="secondary-action">
            <v-btn
              class="text--disabled"
              text
              @click="close"
            >
              <strong>{{ secondaryText }}</strong>
            </v-btn>
          </slot>
          <v-spacer />
          <slot :confirm="confirm" name="primary-action">
            <v-btn
              color="primary"
              text
              @click="confirm"
            >
              <strong>{{ primaryText }}</strong>
            </v-btn>
          </slot>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>


<script>
  import Vue from 'vue';

  /**
   * @description
   * Basic dialog component. Can be customized using slots.
   * @vue-prop {boolean} open - Whether the component is shown.
   * @vue-prop {number}  width - Width of the component in pixels.
   * @vue-prop {string}  title - Text for the title.
   * @vue-prop {string}  body - Text for the main content.
   * @vue-prop {string}  primaryText - Text for the primary button.
   * @vue-prop {string}  secondaryText - Text for the secondary button.
   * @vue-prop {Array}   customClasses - Array of strings which will be added as classes.
   * @vue-prop {string}  contentClass - Vuetify content-class which will be applied to the dialog.
   */
  export default Vue.extend({
    name: 'VcsConfirmationDialog',
    props: {
      open: {
        type: Boolean,
        default: false,
      },
      width: {
        type: Number,
        default: 344,
      },
      title: {
        type: String,
        default: 'Privacy Policy',
      },
      body: {
        type: String,
        default: `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore
          et dolore magna aliqua. Ut enim ad minim veniam,`,
      },
      primaryText: {
        type: String,
        default: 'Confirm',
      },
      secondaryText: {
        type: String,
        default: 'Cancel',
      },
      customClasses: {
        type: Array,
        default: () => ([]),
      },
      contentClass: {
        type: String,
        default: '',
      },
    },
    methods: {
      close() {
        this.$emit('on-dialog-close', undefined);
      },
      confirm() {
        this.$emit('on-dialog-close', true);
      },
    },
  });
</script>
