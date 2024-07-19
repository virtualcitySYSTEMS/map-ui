import { reactive, ref } from 'vue';

export default function createExampleActions() {
  const disabled = ref(false);
  const showSection = ref(true);

  const actions = [
    reactive({
      name: 'disabledSelection',
      title: 'Changed Disabled',
      icon: disabled.value ? 'mdi-airplane' : 'mdi-airplane-off',
      callback() {
        disabled.value = !disabled.value;
        this.icon = disabled.value ? 'mdi-airplane' : 'mdi-airplane-off';
      },
    }),
    {
      name: 'noIcon',
      title: 'another action without icon',
      callback: () => {},
    },
    {
      name: 'alert',
      icon: 'mdi-message-text',
      callback() {
        alert('alert');
      },
    },
  ];

  return { actions, disabled, showSection };
}
