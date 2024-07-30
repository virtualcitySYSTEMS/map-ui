import { reactive } from 'vue';
/* eslint-disable no-console */

// eslint-disable-next-line import/prefer-default-export
export function createActions() {
  const toggleAction = reactive({
    name: 'toggle-action',
    title: 'toggle-action',
    icon: 'mdi-circle',
    active: true,
    disabled: false,
    callback() {
      toggleAction.active = !toggleAction.active;
      console.log('callback action1');
    },
  });

  return [
    toggleAction,
    {
      name: 'action-without-icon',
      title: 'action-without-icon',
      active: false,
      disabled: false,
      callback() {
        console.log('callback action2');
      },
    },
    {
      name: 'action-with-a-very-looooooooooooooooooooooooooong-name',
      title: 'tooltip-for-the-very-long-name',
      icon: 'mdi-arrow-left',
      active: false,
      disabled: false,
      callback() {
        console.log('callback action3');
      },
    },
    reactive({
      name: 'action4',
      title: 'title4',
      icon: 'mdi-account-group',
      active: true,
      disabled: false,
      callback() {
        this.active = !this.active;
        console.log('callback action4');
      },
    }),
  ];
}
