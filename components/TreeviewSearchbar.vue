<template>
  <div class="pa-2 accent position-relative d-flex flex-row justify-space-between align-center">
    <slot name="prepend">
      <v-icon
        class="search-icon my-0 ml-1"
        v-text="'$vcsSearch'"
        slot="prepend"
        size="12"
      />
    </slot>

    <slot>
      <v-text-field
        solo
        dense
        hide-details
        class="searchbar outlined rounded-xl align-center d-flex justify-center white pa-1 pl-6"
        :placeholder="(placeholder || 'search.title') | translate"
        :value="value"
        @input="$event => sub.next($event)"
        clearable
      />
    </slot>

    <slot name="append">
      <v-icon v-if="hasFilter" v-text="'$vcsFilter'" class="ml-2" size="16" />
    </slot>
  </div>
</template>

<style lang="scss" scoped>
  .input-container {
    position: relative;
  }

  .search-icon {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    left: 12px;
  }

  input {
    border-radius: 9999rem;
    outline-style: none;
    font-size: 12px;
    box-shadow: 0 0 0 1px #dedede;

    &:focus {
      box-shadow: 0 0 0 1px var(--v-primary-base);
    }
  }

  ::v-deep {
    .v-input__slot {
      background-color: transparent !important;
    }

    .v-input__append-inner {
      height: 20px;
      display: flex;
      justify-content: center;
      align-items: center;

      .v-icon {
        width: 20px;
        height: 20px;
        font-size: 16px;
      }
    }

    .v-text-field.v-text-field--solo.v-input--dense > .v-input__control {
      min-height: unset;
    }

    .v-text-field.v-text-field--enclosed:not(.v-text-field--rounded) > .v-input__control > .v-input__slot,
    .v-text-field.v-text-field--enclosed .v-text-field__details {
      padding-right: 0;
    }

    .v-input.outlined {
      outline-style: none;
      font-size: 12px;
      box-shadow: 0 0 0 1px #dedede;

      &:focus,
      &.v-input--is-focused {
        box-shadow: 0 0 0 1px var(--v-primary-base);
      }
    }

    .v-text-field.v-input--dense:not(.v-text-field--outlined) .v-text-field__prefix,
    .v-text-field.v-input--dense:not(.v-text-field--outlined) .v-text-field__suffix,
    .v-text-field.v-input--dense:not(.v-text-field--outlined) input {
      padding: 0;
    }

    .v-text-field.v-text-field--solo:not(.v-text-field--solo-flat) > .v-input__control > .v-input__slot {
      box-shadow: none;
      border-radius: 0;
    }
  }
</style>


<script>
  import { Subject } from 'rxjs';
  import { debounceTime } from 'rxjs/operators';
  import Vue from 'vue';

  /**
   * @description Stylized wrapper around vuetify divider
   * @vue-prop {number}   height - Height of the component.
   */
  export default Vue.extend({
    name: 'VcsTreeviewSearchbar',
    props: {
      placeholder: {
        type: String,
        default: '',
      },
      customClasses: {
        type: Array,
        default: () => ([]),
      },
      value: {
        type: String,
        default: '',
      },
      hasFilter: {
        type: Boolean,
        default: false,
      },
    },
    setup() {
      return {
        sub: new Subject(),
      };
    },
    mounted() {
      this.sub.pipe(debounceTime(330)).subscribe(
        (value) => {
          this.$emit('input', value);
        },
      );
    },
  });
</script>
