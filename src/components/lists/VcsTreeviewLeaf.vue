<template>
  <div
    class="d-flex flex-row align-center"
    v-if="item"
  >
    <span v-if="item.icon" class="d-flex align-center">
      <v-icon
        v-if="iconType === iconTypes.string"
        v-text="item.icon"
        :size="16"
        class="mr-1"
      />
      <span ref="imgContainer" />
    </span>

    <div class="position-relative col-8 pa-0 d-flex align-center">
      <span>{{ $t(item.title) }}</span>
    </div>
    <VcsActionButtonList
      v-if="item.actions.length > 0"
      :actions="item.actions"
      :block-overflow="true"
      :overflow-count="3"
      small
      right
      class="col-4 pa-0 d-flex align-center"
    />
  </div>
</template>

<script>
  import
  {
    computed,
    onMounted,
    ref,
  } from '@vue/composition-api';

  import VcsActionButtonList from '../buttons/VcsActionButtonList.vue';


  const iconTypes = {
    image: 'HTMLImageElement',
    canvas: 'HTMLCanvasElement',
    string: 'StringIcon',
  };

  /**
   * @description
   * Template for a treeview leaf, see: https://vuetifyjs.com/en/api/v-treeview/
   */
  export default {
    components: { VcsActionButtonList },
    props: {
      item: {
        type: Object,
        default: undefined,
      },
    },
    setup(props) {
      const iconType = ref();
      const imgContainer = ref();

      const leaf = computed(() => props.item.children.length === 0);

      onMounted(() => { // TODO make icon reactive
        const { icon } = props.item;
        if (icon) {
          if (icon instanceof HTMLImageElement) {
            imgContainer.value.appendChild(icon);
            iconType.value = iconTypes.image;
          }
          if (icon instanceof HTMLCanvasElement) {
            imgContainer.value.appendChild(icon);
            iconType.value = iconTypes.canvas;
          }
          if (typeof icon === 'string') {
            iconType.value = iconTypes.string;
          }
        }
      });

      return {
        iconTypes,
        iconType,
        imgContainer,
        leaf,
      };
    },
  };
</script>
