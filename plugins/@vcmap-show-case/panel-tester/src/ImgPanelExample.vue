<template>
  <div class="pa-1 h-full">
    <h1>{{ $attrs['panel-state'].location }}</h1>
    <p>{{ $attrs['panel-state'].id }}</p>
    <div class="d-flex pa-1">
      <img
        src="https://vc.systems/wp-content/uploads/2020/07/vcs_logo.png"
        alt="logo"
      />
    </div>
  </div>
</template>

<script>
  export default {
    name: 'ImgPanelExample',
  };
</script>
<style scoped></style>
