<template>
  <v-container class="pa-0">
    <VcsExtentEditor
      heading="Default WGS84 projection"
      :model-value="wgs84Extent"
      show-extent-on-startup
      @update:model-value="handleWgs84ExtentUpdate"
    />
    <VcsExtentEditor
      heading="Mercator projection example"
      v-model="mercatorExtent"
    />
  </v-container>
</template>
<script>
  import { VcsExtentEditor } from '@vcmap/ui';
  import { VContainer } from 'vuetify/components';
  import { Extent, mercatorProjection, wgs84Projection } from '@vcmap/core';

  export default {
    name: 'ExtentExample',
    components: { VcsExtentEditor, VContainer },
    setup() {
      const wgs84Extent = new Extent({ projection: wgs84Projection }).toJSON();
      const mercatorExtent = new Extent({
        projection: mercatorProjection,
      }).toJSON();

      return {
        wgs84Extent,
        mercatorExtent,
        handleWgs84ExtentUpdate(extent) {
          const loggedExtent = {
            ...extent,
            coordinates: [
              ...extent.coordinates.map((c) => Math.round(c * 100000) / 100000),
            ],
          };
          console.log(loggedExtent);
          wgs84Extent.coordinates = extent.coordinates;
        },
      };
    },
  };
</script>
<style lang="scss" scoped></style>
