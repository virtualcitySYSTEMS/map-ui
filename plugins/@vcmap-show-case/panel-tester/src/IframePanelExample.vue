<template>
  <div class="pa-1">
    <h1>{{ $attrs['panel-state'].location }}</h1>
    <p>{{ $attrs['panel-state'].id }}</p>
    <div class="d-flex flex-column overflow-hidden w-full h-full pa-1">
      <iframe src="http://localhost:8080" class="flex-grow-1" height="1000" />
    </div>
  </div>
</template>
<script>
  export default {
    name: 'IframePanelExample',
  };
</script>
<style scoped></style>
