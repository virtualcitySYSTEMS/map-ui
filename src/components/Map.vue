<template>
  <div class="map_container" :id="mapId" />
</template>

<script >
  import { onMounted } from '@/onMounted';
  import { registerMapCollection } from '@/registerMapCollection';
  import Vue from 'vue';

  export default Vue.extend({
    props: {
      mapId: {
        type: String,
        default: `vcs-map-${(Math.random() * 10000).toFixed(0)}`,
      },
    },
    data() {
      return {
        destroy: undefined,
      };
    },
    async mounted() {
      const mapCollection = await onMounted({ targetId: this.mapId });
      const { destroy } = registerMapCollection({ mapCollection, moduleName: this.mapId, $store: this.$store });
      this.destroy = destroy;
    },
    beforeDestroy() {
      this.destroy();
    },
  });
</script>
