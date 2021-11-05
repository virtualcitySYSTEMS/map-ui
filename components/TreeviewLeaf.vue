<template>
  <div
    class="d-flex flex-row"
    :class="{ 'mr-4': selectable && leaf }"
    v-if="item"
  >
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
      <Badge v-if="item.hasUpdate" class="update-badge position-absolute" />
    </div>

    <span v-if="firstTwo && firstTwo.length" class="ml-auto d-flex flex-row justify-center align-center">
      <v-icon
        v-for="action of firstTwo"
        :key="action.title"
        size="16"
        @click="(event) => onIconButtonClick(action, event)"
        class="mr-2"
        v-text="action.icon"
      />
      <v-menu
        right
        v-if="remaining && remaining.length"
        :close-on-content-click="true"
      >
        <template #activator="{ on, attrs }">
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
  import
  {
    defineComponent,
    inject,
    onMounted,
    ref,
  } from '@vue/composition-api';

  import Badge from '@vcsuite/uicomponents/Badge.vue';


  const iconTypes = {
    image: 'HTMLImageElement',
    canvas: 'HTMLCanvasElement',
    string: 'StringIcon',
  };

  /**
   * @description
   * Injects: ['language', 'tree']
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
    },
    setup(props, context) {
      const [iconType, imgContainer] = [ref(), ref()];
      const [language, tree] = [inject('language'), inject('tree')];

      const leaf = props.item.children && !props.item.children.length;
      const firstTwo = props.item.actions && props.item.actions.slice(0, 2);
      const remaining = props.item.actions &&
        props.item.actions.length &&
        props.item.actions.slice(2);
      const label = (props.item.title && props.item.title[language]) ||
        props.item.name ||
        props.item.title;

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

      /**
       * @function
       * @param {AbstractTreeNode} item
       * @param {Event} event
       * @returns {Promise<any>} promise
       */
      const onIconButtonClick = async (item, event) => {
        const action = await item.action(tree.value);
        // eslint-disable-next-line no-console
        console.log('Action clicked, ', action);
        context.emit('action-clicked', { item, event });
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
        leaf,
      };
    },
  });
</script>
