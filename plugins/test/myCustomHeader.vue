<template>
  <div>
    Ha, this is a custom Header with a <span @click="clicked"> CLOSE thing </span>
  </div>
</template>

<script>

  export default {
    name: 'MyCustomHeader',
    setup(props, { emit }) {
      return {
        clicked: () => {
          emit('close');
        },
      };
    },
  };
</script>
