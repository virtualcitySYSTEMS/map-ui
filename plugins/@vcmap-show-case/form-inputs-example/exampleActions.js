import { reactive, ref } from 'vue';

export default function createExampleActions() {
  const dense = ref(false);
  const showSection = ref(true);

  const actions = [
    reactive({
      name: 'denseSelection',
      title: 'change row height',
      icon: dense.value
        ? 'mdi-arrow-split-horizontal'
        : 'mdi-arrow-collapse-vertical',
      callback() {
        dense.value = !dense.value;
        this.icon = dense.value
          ? 'mdi-arrow-split-horizontal'
          : 'mdi-arrow-collapse-vertical';
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

  return { actions, dense, showSection };
}
