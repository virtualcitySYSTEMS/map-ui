<template>
  <div class="d-flex flex-row mr-4" v-if="item">
    <span class="mr-2" v-if="item.icon">
      <v-icon
        v-if="iconType === iconTypes.string"
        v-text="item.icon"
        :size="16"
      />
      <span ref="imgContainer" />
    </span>

    <div class="position-relative">
      <span>{{ label }}</span>
      <Badge
        v-if="item.hasUpdate"
        class="update-badge position-absolute"
      />
    </div>


    <span class="ml-auto d-flex flex-row justify-center align-center">
      <v-icon
        v-for="action of firstTwo"
        :key="action.title"
        size="16"
        @click="() => onIconButtonClick(action)"
        class="mr-2"
        v-text="action.icon"
      />
      <v-menu
        right
        v-if="remaining && remaining.length"
        :close-on-content-click="true"
      >
        <template v-slot:activator="{ on, attrs }">
          <v-icon
            v-text="'mdi-dots-vertical'"
            v-bind="attrs"
            v-on="on"
            size="16"
          />
        </template>

        <v-list>
          <v-list-item
            v-for="(menuItem, index) in remaining"
            :key="index"
            @click="() => onMenuItemClick(menuItem)"
          >
            <v-icon
              v-if="menuItem.icon"
              v-text="menuItem.icon"
              size="16"
              class="mr-2"
            />
            <v-list-item-title>{{ menuItem.id }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </span>
  </div>
</template>

<style lang="scss">
  .update-badge {
    right: -16px;
    bottom: 50%;
    transform: translateY(50%);
  }
</style>

<script>
  import VueCompositionAPI, {
    defineComponent, inject, onMounted, computed, ref, provide,
  } from '@vue/composition-api';
  import Vue from 'vue';

  import Badge from '@vcsuite/uicomponents/Badge.vue';

  Vue.use(VueCompositionAPI);

  const iconTypes = {
    image: 'HTMLImageElement',
    canvas: 'HTMLCanvasElement',
    string: 'StringIcon',
  };

  /**
   * @description
   * Injects: ['language']
   * Templaate for a treeview leaf, see: https://vuetifyjs.com/en/api/v-treeview/
   */
  export default defineComponent({
    components: { Badge },
    props: {
      item: {
        type: Object,
        default: undefined,
      },
      selectable: {
        type: Boolean,
        default: false,
      },
      leaf: {
        type: Boolean,
        default: false,
      },
    },
    setup(props, context) {
      const [iconType, imgContainer] = [ref(), ref()];
      const [language, tree] = [inject('language'), inject('tree')];

      onMounted(() => {
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

      const firstTwo = computed(() => props.item.actions && props.item.actions.slice(0, 2));
      const remaining = computed(() => props.item.actions && props.item.actions.length && props.item.actions.slice(2));
      const label = (props.item.title && props.item.title[language]) || props.item.name || props.item.title;

      /**
       * @function
       * @param {AbstractTreeNode} item
       * @returns {Promise<any>} promise
       */
      const onIconButtonClick = async (item) => {
        const action = await item.action(tree.value);
        console.log('Action clicked, ', item);
        context.emit('action-clicked', action);
      };
      /**
       * @function
       * @param {string} id
       */
      const onMenuItemClick = (id) => {
        context.emit('menu-item-clicked', id);
      };

      return {
        iconTypes,
        iconType,
        firstTwo,
        remaining,
        label,
        imgContainer,
        onIconButtonClick,
        onMenuItemClick,
      };
    },
  });
</script>

