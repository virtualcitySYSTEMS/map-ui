<template>
  <div class="map_container" :id="mapId" />
</template>

<style lang="scss" scoped>

  .map_container {
    height: 100%;
    overflow: hidden;
    position: relative;
    background-color: #fff;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 8 8'%3E%3Cg fill='%23acacac' fill-opacity='0.4'%3E%3Cpath fill-rule='evenodd' d='M0 0h4v4H0V0zm4 4h4v4H4V4z'/%3E%3C/g%3E%3C/svg%3E");
    font-family: Arial, sans-serif;
    font-size: 0.9rem;
  }

  ::v-deep {
    .mapElement {
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      right: 0;
      overflow: hidden; /* Fix for iFrame content */
    }

    .cesium-widget,
    .cesium-widget canvas {
      width: 100%;
      height: 100%;
      touch-action: none;
    }
  }

</style>

<script >
  import { obliqueCollectionCollection } from '@vcmap/core/src/vcs/vcm/globalCollections';
  import OpenStreetMap from '@vcmap/core/src/vcs/vcm/layer/openStreetMap';
  import Openlayers from '@vcmap/core/src/vcs/vcm/maps/openlayers';
  import ObliqueCollection from '@vcmap/core/src/vcs/vcm/oblique/ObliqueCollection';
  import ObliqueDataSet from '@vcmap/core/src/vcs/vcm/oblique/ObliqueDataSet';
  import Projection from '@vcmap/core/src/vcs/vcm/util/projection';
  import CesiumMap from '@vcmap/core/src/vcs/vcm/maps/cesium';
  import ObliqueMap from '@vcmap/core/src/vcs/vcm/maps/oblique';

  import { registerMapCollection } from '@/registerMapCollection';
  import Vue from 'vue';
  import ViewPoint from '@vcmap/core/src/vcs/vcm/util/viewpoint';

  export default Vue.extend({
    props: {
      mapId: {
        type: String,
        required: true,
      },
      config: {
        type: Object,
        required: true,
      },
    },
    destroy: null,
    inject: ['context'],
    async mounted() {
      await this.init();
    },
    methods: {
      /**
       * @method
       * @description Initializes the map from configuration.
       */
      async init() {
        // 1. Create layers
        const openlayers = new Openlayers(this.config.openLayersConfig);
        const osm = new OpenStreetMap(this.config.osmConfig);
        const projection = new Projection(this.config.projectionConfig);
        const oblique = new ObliqueMap(this.config.obliqueMapConfig);
        const { dataSetUrls, ...opts } = this.config.obliqueCollectionConfig;
        const obliqueCollection = new ObliqueCollection({
          ...opts,
          dataSets: dataSetUrls.map(url => new ObliqueDataSet(url, projection.proj)),
        });
        const cesium = new CesiumMap(this.config.cesiumMapConfig);

        // 2. Upate collections
        this.context.mapCollection.add(openlayers);
        this.context.mapCollection.setTarget(this.mapId);
        this.context.mapCollection.layerCollection.add(osm);
        await osm.activate();

        obliqueCollectionCollection.add(obliqueCollection);

        await oblique.setCollection(obliqueCollection);
        this.context.mapCollection.add(oblique);

        this.context.mapCollection.add(cesium);

        // 3. Register store module
        const { destroy } = registerMapCollection({
          mapCollection: this.context.mapCollection,
          moduleName: this.mapId,
          $store: this.$store,
        });
        this.$options.destroy = destroy;

        // // 4. Initialize initial view
        await this.mapCollection.setActiveMap(this.config.initialMap.activeMap);
        await openlayers.gotoViewPoint(new ViewPoint(this.config.initialMap.viewPointConfig));
      },
    },
    beforeDestroy() {
      if (this.$options.destroy) this.$options.destroy();
    },
  });
</script>
