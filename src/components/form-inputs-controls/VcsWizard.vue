<template>
  <v-stepper
    vertical
    :value="value"
    @change="(newValue) => $emit('input', newValue)"
    class="rounded-0"
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
   * @vue-prop {number} value - The current step of the stepper.
   * @vue-data {slot} [#default] - Slot to add VcsWizardSteps.
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
  };
</script>
<style scoped lang="scss">
  @import '../../styles/shades.scss';
  .v-stepper {
    &.theme--light {
      ::v-deep {
        .v-stepper__step {
          .v-stepper__label {
            color: map-get($shades, 'black');
          }
          &--active {
            background-color: rgba(34, 34, 34, 0.1);
            .v-stepper__label {
              color: var(--v-primary-base);
            }
          }
          &--complete {
            .v-stepper__label {
              color: map-get($shades, 'black');
            }
          }
          .v-stepper__step__step::before {
            color: map-get($shades, 'white');
          }
        }
        .step-border:not(:last-child) > .v-stepper__content {
          border-left: 2px solid rgba(0, 0, 0, 0.12);
        }
      }
    }
    &.theme--dark {
      background: map-get($shades, 'black');
      ::v-deep {
        .v-stepper__step {
          .v-stepper__label {
            color: map-get($shades, 'white');
          }
          &--active {
            background-color: rgba(255, 255, 255, 0.17);
            .v-stepper__label {
              color: var(--v-primary-base);
            }
          }
          &--complete {
            .v-stepper__label {
              color: map-get($shades, 'white');
            }
          }
          .v-stepper__step__step {
            .v-icon {
              color: transparent;
            }
            &:before {
              color: map-get($shades, 'black');
            }
          }
          &.v-stepper__step--error {
            .v-stepper__label {
              color: var(--v-error-darken2);
            }
            .v-stepper__step__step {
              background-color: var(--v-error-darken1);
            }
          }
        }
        .step-border:not(:last-child) > .v-stepper__content {
          border-left: 2px solid rgba(255, 255, 255, 0.8);
        }
      }
    }
    ::v-deep {
      .v-stepper__step {
        padding-top: 0;
        padding-bottom: 0;
        .v-stepper__label {
          font-weight: 700;
          text-shadow: none !important;
        }
        .v-stepper__step__step {
          color: transparent;
          position: relative;
          margin-top: 1px;
          margin-right: 5px;
          &:before {
            content: '\25cf';
            font-size: 18px;
            position: absolute;
            top: -9px;
          }
        }
        &.v-stepper__step--error {
          .v-stepper__step__step {
            background-color: var(--v-error-base);
          }
          .v-stepper__label {
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
