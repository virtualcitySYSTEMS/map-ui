<template>
  <v-menu
    v-model="menuOpen"
    :close-on-content-click="false"
    transition="scale-transition"
    offset-y
    max-width="290px"
    min-width="290px"
  >
    <template #activator="{ on, attrs }">
      <v-text-field
        v-model="formattedDate"
        :placeholder="formatDate(new Date().toISOString())"
        v-bind="{ ...$attrs, ...attrs }"
        v-on="{ ...$listeners, ...on }"
        :prepend-icon="icon"
        :dense="isDense"
        readonly
        hide-details
        class="ma-0 py-1"
        :class="{
          'input--dense': isDense,
          'input--not-dense': !isDense,
        }"
      />
    </template>
    <v-date-picker
      v-model="date"
      no-title
      @input="menuOpen = false"
      :locale="locale"
      color="primary"
    >
      <v-btn color="primary" @click="goToToday">
        {{ $t('datePicker.today') }}
      </v-btn>
    </v-date-picker>
  </v-menu>
</template>
<style lang="scss" scoped>
  ::v-deep {
    .v-input__control {
      padding: 0 4px;
    }
    .v-input__prepend-outer {
      margin-right: 4px;
    }
    .v-icon {
      font-size: 16px;
    }
  }
</style>
<script>
  import {
    computed,
    ref,
    watch,
    inject,
    onUnmounted,
    onBeforeMount,
  } from 'vue';
  import { VMenu, VTextField, VDatePicker, VBtn } from 'vuetify/lib';
  /**
   * @description stylized wrapper around {@link https://v15.vuetifyjs.com/en/components/date-pickers/#month-pickers-in-dialog-and-menu}.
   * @vue-prop {string} value - value of the date picker in {@link https://tc39.es/ecma262/#sec-date-time-string-format | Date Time String Format}
   * @vue-prop {string} icon - specify optional prepend icon, defaults to mdi-calendar
   * @vue-event {string} input - raised when calendar date is selected
   */
  export default {
    name: 'VcsDatePicker',
    props: {
      value: {
        type: String,
        default: new Date().toISOString().substring(0, 10),
      },
      icon: {
        type: String,
        default: 'mdi-calendar',
      },
    },
    components: {
      VMenu,
      VTextField,
      VDatePicker,
      VBtn,
    },
    setup(props, { emit, attrs }) {
      /**
       * @type {import("@vcmap/ui").VcsUiApp}
       */
      const app = /** @type {import("@vcmap/ui").VcsUiApp} */ (
        inject('vcsApp')
      );
      const localValue = ref(props.value);
      const menuOpen = ref(false);
      const locale = ref(app.locale);

      const isDense = computed(() => attrs.dense !== false);

      const isValid = (date) => !Number.isNaN(new Date(date).getTime());
      const setFromValue = () => {
        if (isValid(props.value)) {
          localValue.value = props.value;
        } else if (localValue.value) {
          // eslint-disable-next-line no-console
          console.error('Invalid date provided: ', props.value);
        }
      };
      onBeforeMount(() => setFromValue());
      const destroyLocaleChanged = app.localeChanged.addEventListener(() => {
        locale.value = app.locale;
      });
      onUnmounted(() => destroyLocaleChanged());

      const formatDate = (date) => {
        if (date) {
          return new Intl.DateTimeFormat(locale.value, {
            dateStyle: 'short',
          }).format(Date.parse(date));
        }
        return '';
      };
      const goToToday = () => {
        localValue.value = new Date(Date.now()).toISOString().substring(0, 10);
        menuOpen.value = false;
      };
      watch(
        () => props.value,
        () => setFromValue(),
      );
      const formattedDate = computed({
        get: () => {
          return formatDate(localValue.value);
        },
        set: () => {},
      });
      const date = computed({
        get: () => localValue.value,
        set: (nv) => {
          localValue.value = nv;
          emit('input', localValue.value);
        },
      });

      return {
        formattedDate,
        date,
        isDense,
        menuOpen,
        formatDate,
        locale,
        goToToday,
      };
    },
  };
</script>
