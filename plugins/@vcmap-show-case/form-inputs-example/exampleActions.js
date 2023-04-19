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
    reactive({
      name: 'toggleSection',
      title: 'toggle section',
      icon: showSection.value ? '$vcsMinus' : '$vcsPlus',
      callback() {
        showSection.value = !showSection.value;
        this.icon = showSection.value ? '$vcsMinus' : '$vcsPlus';
      },
    }),
    reactive({
      name: 'toggleIcon',
      title: 'toggle switch textfields-example',
      icon: showSection.value ? 'mdi-toggle-switch' : 'mdi-toggle-switch-off',
      active: showSection.value,
      callback() {
        showSection.value = !showSection.value;
        this.active = showSection.value;
      },
    }),
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
