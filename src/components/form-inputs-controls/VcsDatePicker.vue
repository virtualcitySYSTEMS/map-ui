<template>
  <v-menu
    v-model="menuOpen"
    :close-on-content-click="false"
    transition="scale-transition"
    max-width="290px"
    min-width="290px"
  >
    <template #activator="{ props }">
      <VcsTextField
        :placeholder="formatDate(new Date().toISOString())"
        :prepend-icon="icon"
        readonly
        hide-details
        class="ma-0 py-1"
        v-bind="props"
        v-model="formattedDate"
      />
    </template>
    <v-date-picker
      v-model="date"
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
</template>
<style lang="scss" scoped></style>
<script>
  import { computed, ref, watch, onBeforeMount } from 'vue';
  import { VMenu, VDatePicker, VBtn } from 'vuetify/components';
  import { useI18n } from 'vue-i18n';
  import { getLogger } from '@vcsuite/logger';
  import VcsTextField from './VcsTextField.vue';

  /**
   * @description stylized wrapper around {@link https://v15.vuetifyjs.com/en/components/date-pickers/#month-pickers-in-dialog-and-menu}.
   * @vue-prop {string} modelValue - value of the date picker in {@link https://tc39.es/ecma262/#sec-date-time-string-format | Date Time String Format}
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
      const localValue = ref(props.modelValue);
      const menuOpen = ref(false);

      const isValid = (date) => !Number.isNaN(date.getTime());
      const setFromValue = () => {
        if (isValid(props.modelValue)) {
          localValue.value = props.modelValue;
        } else if (localValue.value) {
          getLogger('VcsDatePicker').error(
            'Invalid date provided: ',
            props.modelValue,
          );
        }
      };
      onBeforeMount(() => setFromValue());

      const formatDate = (date) => {
        if (date) {
          return new Intl.DateTimeFormat(i18n.locale.value, {
            dateStyle: 'short',
          }).format(Date.parse(date));
        }
        return '';
      };
      const goToToday = () => {
        localValue.value = new Date();
        menuOpen.value = false;
      };
      watch(
        () => props.modelValue,
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
          emit('update:modelValue', localValue.value);
        },
      });

      return {
        formattedDate,
        date,
        menuOpen,
        formatDate,
        goToToday,
      };
    },
  };
</script>
