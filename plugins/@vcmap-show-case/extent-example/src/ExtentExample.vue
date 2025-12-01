<template>
  <v-container class="pa-0">
    <VcsExtentEditor
      heading="Default WGS84 projection"
      v-model="wgs84Extent"
      show-extent-on-startup
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

      return { wgs84Extent, mercatorExtent };
    },
  };
</script>
<style lang="scss" scoped></style>
