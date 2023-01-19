<template>
  <div>
    <div>
      Ha, this is a custom Header with a <span @click="clicked"> CLOSE thing. </span>
    </div>
    <div>And here is '<b>{{ sample }}</b>' passed through</div>
  </div>
</template>

<script>

  export default {
    name: 'MyCustomHeader',
    props: {
      sample: {
        type: String,
      },
    },
    setup(props, { emit }) {
      return {
        clicked: () => {
          emit('close');
        },
      };
    },
  };
</script>
