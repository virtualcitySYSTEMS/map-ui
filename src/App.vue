<template>
  <v-app class="bg-dev">
    <v-main>
      <Navbar />
      <div id="vcm_map_container" />
    </v-main>
  </v-app>
</template>


<script>

  import Vue from 'vue';

  import startup from '@/onMounted';
  import Navbar from './components/functional/navigation/Navbar.vue';


  export default Vue.extend({
    components: {
      Navbar,
    },
    mounted() {
      startup();
    },
  });
</script>

<style lang="scss">
  #vcm_map_container {
    position: absolute;
    top: 0px;
    left: 0px;
    bottom: 0px;
    right: 0px;
    overflow: hidden;
    background-color: #ffffff;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 8 8'%3E%3Cg fill='%23acacac' fill-opacity='0.4'%3E%3Cpath fill-rule='evenodd' d='M0 0h4v4H0V0zm4 4h4v4H4V4z'/%3E%3C/g%3E%3C/svg%3E");
    font-family: Arial, sans-serif;
    font-size: .9rem;
    /* line-height: 1.2rem; */
  }

  .mapElement {
    position: absolute;
    top: 0px;
    bottom : 0px;
    left: 0px;
    right:0px;
    overflow: hidden; /* Fix for iFrame content */
  }
  .cesium-widget, .cesium-widget canvas {
    width: 100%;
    height: 100%;
    touch-action: none;
  }

</style>
