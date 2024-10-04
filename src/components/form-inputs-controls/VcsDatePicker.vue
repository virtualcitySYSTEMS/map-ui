<template>
  <VcsTextField
    :prepend-icon="icon"
    class="vcs-date-picker"
    readonly
    v-bind="$attrs"
    v-model="formattedDate"
  >
    <v-menu
      activator="parent"
      v-model="menuOpen"
      :close-on-content-click="false"
      transition="scale-transition"
      max-width="290px"
      min-width="290px"
    >
      <v-date-picker
        v-model="localValue"
        hide-header
        @update:model-value="menuOpen = false"
        color="primary"
      >
        <template #actions>
          <v-btn color="primary" @click="goToToday">
            {{ $t('datePicker.today') }}
          </v-btn>
        </template>
      </v-date-picker>
    </v-menu>
  </VcsTextField>
</template>
<style lang="scss" scoped></style>
<script>
  import { computed, ref, watch } from 'vue';
  import { VMenu, VDatePicker, VBtn } from 'vuetify/components';
  import { useI18n } from 'vue-i18n';
  import VcsTextField from './VcsTextField.vue';

  /**
   * @description stylized wrapper around {@link https://vuetifyjs.com/en/components/date-pickers/#internationalization}.
   * @vue-prop {Date} modelValue - value of the date picker as a Date (changes to the Date Object are not tracked, handled as atomic value)
   * @vue-prop {string} [icon] - specify optional prepend icon, defaults to mdi-calendar
   */
  export default {
    name: 'VcsDatePicker',
    props: {
      modelValue: {
        type: Date,
        default: new Date(),
      },
      icon: {
        type: String,
        default: 'mdi-calendar',
      },
    },
    components: {
      VMenu,
      VcsTextField,
      VDatePicker,
      VBtn,
    },
    emits: ['update:modelValue'],
    setup(props, { emit }) {
      const i18n = useI18n();
      const menuOpen = ref(false);
      const internal = ref(props.modelValue);

      watch(
        () => props.modelValue,
        (newValue) => {
          if (!menuOpen.value) {
            internal.value = newValue;
          }
        },
      );

      const localValue = computed({
        get() {
          return internal.value;
        },
        set(newValue) {
          if (internal.value?.getTime() !== newValue?.getTime()) {
            internal.value = newValue;
            emit('update:modelValue', newValue);
          }
        },
      });

      const formatDate = (date) => {
        if (date) {
          return new Intl.DateTimeFormat(i18n.locale.value, {
            dateStyle: 'short',
          }).format(date);
        }
        return '';
      };
      const goToToday = () => {
        localValue.value = new Date();
        menuOpen.value = false;
      };
      const formattedDate = computed({
        get: () => {
          return formatDate(localValue.value);
        },
        set: () => {},
      });

      return {
        formattedDate,
        localValue,
        menuOpen,
        formatDate,
        goToToday,
      };
    },
  };
</script>
