<template>
  <v-stepper
    vertical
    :value="value"
    @change="(value) => emitValue(value)"
  >
    <slot />
  </v-stepper>
</template>

<script>
  import { VStepper } from 'vuetify/lib';

  /**
   * @description Stylized wrapper around {@link https://vuetifyjs.com/en/api/v-stepper/ |vuetify stepper}
   * Is always vertical.
   * Only passes the step property, all other props are ignored.
   * @vue-prop {number} step - The current step of the stepper.
   */
  export default {
    name: 'VcsWizard',
    components: {
      VStepper,
    },
    props: {
      value: {
        type: Number,
        default: undefined,
      },
    },
    setup(props, { emit }) {
      function emitValue(newValue) {
        emit('input', typeof newValue !== 'number' ? Number(newValue) : newValue);
      }

      return {
        emitValue,
      };
    },
  };
</script>
<style scoped lang="scss">
.v-stepper{
  &.theme--light {
    ::v-deep{
      .v-stepper__step {
        &--active {
          background-color: rgba(34, 34, 34, 0.1);
          .v-stepper__label {
            color: rgba(34, 34, 34, 0.8);
          }
        }
        &--complete {
          .v-stepper__label {
            color: rgba(0, 0, 0, 0.38);
          }
        }
      }
      .v-stepper__content {
        &:not(:last-child) {
          border-left: 2px solid rgba(0, 0, 0, 0.12) !important;
        }
      }
    }
  }
  &.theme--dark {
    ::v-deep{
      .v-stepper__step {
        &--active {
          background-color: rgba(255, 255, 255, 0.5);
          .v-stepper__label {
            color: rgba(255, 255, 255, 1);
          }
        }
        &--complete {
          .v-stepper__label {
            color: rgba(255, 255, 255, 0.5);
          }
        }
        .v-stepper__step__step {
          .v-icon {
            color: transparent;
          }
        }
        &.v-stepper__step--error{
          .v-stepper__label{
            color: var(--v-error-darken2);
          }
          .v-stepper__step__step{
            background-color: var(--v-error-darken1);
          }
        }
      }
      .v-stepper__content {
        &:not(:last-child) {
          border-left: 2px solid rgba(255, 255, 255, 0.8) !important;
        }
      }
    }
  }
  ::v-deep{
    .v-stepper__step {
      height: 40px;
      .v-stepper__label {
        font-weight: 700;
        text-shadow: none !important;
      }
      .v-stepper__step__step {
        color: transparent;
        position: relative;
        &:before{
          content: '\25cf';
          color: var(--v-basic-base);
          font-size: 18px;
          position: absolute;
          top: -9px;
        }
      }
      &.v-stepper__step--error {
        .v-stepper__step__step{
          background-color: var(--v-error-base);
        }
        .v-stepper__label{
          color: var(--v-error-base);
        }
      }
    }
    .v-stepper__content.v-stepper__wrapper {
        margin: 4px 0;
    }
  }
}
</style>
