<script setup>
  import { VCol, VRow, VSwitch } from 'vuetify/components';
  import { computed, shallowRef, inject, onUnmounted, ref } from 'vue';
  import { CesiumMap, from2Dto3DLayout, from3Dto2DLayout } from '@vcmap/core';
  import { HeightReference } from '@vcmap-cesium/engine';

  /**
   * @type {import("vue").ShallowRef<import("ol").Feature[]>}
   */
  const features = inject('features');
  /**
   * @type {import("@vcmap/ui").VcsUiApp}
   */
  const vcsApp = inject('vcsApp');

  const cesiumMap = shallowRef(
    vcsApp.maps.activeMap instanceof CesiumMap ? vcsApp.maps.activeMap : null,
  );

  const mapListener = vcsApp.maps.mapActivated.addEventListener((newMap) => {
    if (newMap instanceof CesiumMap) {
      cesiumMap.value = newMap;
    } else {
      cesiumMap.value = null;
    }
  });

  const localLayoutValue = ref(
    features.value[0]?.getGeometry().getLayout() ?? 'XYZ',
  );

  const heightReference = ref(HeightReference.CLAMP_TO_GROUND);

  const emit = defineEmits(['layoutChanged']);
  emit('layoutChanged', localLayoutValue.value);

  const layout = computed({
    get() {
      return localLayoutValue.value;
    },
    set(value) {
      if (value === 'XY') {
        features.value.forEach((f) => {
          from3Dto2DLayout(f.getGeometry());
        });
      } else if (cesiumMap.value) {
        features.value.forEach((f) => {
          from2Dto3DLayout(
            f.getGeometry(),
            cesiumMap.value.getScene(),
            heightReference.value,
          );
        });
      }
      localLayoutValue.value = value;
      emit('layoutChanged', localLayoutValue.value);
    },
  });

  onUnmounted(() => {
    mapListener();
  });
</script>

<template>
  <v-row no-gutters>
    <v-col cols="2" />
    <v-col>
      <v-switch
        false-value="XY"
        true-value="XYZ"
        false-icon="$vcs2d"
        true-icon="$vcs3d"
        :label="layout"
        :disabled="!cesiumMap && layout === 'XY'"
        v-model="layout"
      />
    </v-col>
    <v-col>
      <v-switch
        :false-value="HeightReference.CLAMP_TO_TERRAIN"
        :true-value="HeightReference.CLAMP_TO_GROUND"
        v-model="heightReference"
        false-icon="$vcsGlobalTerrain"
        true-icon="$vcsGlobeNature"
        :label="
          heightReference === HeightReference.CLAMP_TO_GROUND
            ? 'to Ground'
            : 'to Terrain'
        "
      />
    </v-col>
    <v-col cols="2" />
  </v-row>
</template>

<style scoped lang="scss"></style>
