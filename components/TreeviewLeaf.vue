<template>
  <div v-if="item">
    <slot v-if="item.icon" name="prepend">
      <v-icon
        v-if="iconType === iconTypes.string"
        v-text="item.icon"
        :size="16"
      />
      <span ref="img-container" />
    </slot>

    <slot name="label">
      <!-- TODO: proper translations -->
      <span @click="clicked">{{ item.name || item.title.de || item.title }}</span>
      <Badge
        v-if="item.hasUpdate"
        class="update-badge position-absolute"
      />
    </slot>

    <slot name="append">
      <v-icon
        v-for="action of item.actions"
        :key="action.title"
        size="16"
        @click="() => onIconButtonClick(action.title)"
        class="mr-2"
        v-text="action.icon"
      />

      <v-menu
        right
        v-if="item.menuItems"
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
            v-for="(menuItem, index) in item.menuItems"
            :key="index"
            @click="() => onMenuItemClick(menuItem)"
          >
            <v-icon
              v-if="menuItem.icon"
              v-text="menuItem.icon"
              size="16"
              class="mr-2"
            />
            <v-list-item-title>{{ menuItem.title }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </slot>
  </div>
</template>

<script>
  import Badge from '@vcsuite/uicomponents/Badge.vue';

  const iconTypes = {
    image: 'HTMLImageElement',
    canvas: 'HTMLCanvasElement',
    string: 'StringIcon',
  };

  export default {
    components: { Badge },
    props: {
      item: {
        type: Object,
        default: undefined,
      },
    },
    setup() {
      return {
        iconTypes,
        iconType: undefined,
        clicked() {
          console.log(this.item);
          this.item.clicked();
        },
      };
    },
    mounted() {
      const { icon } = this.item;
      if (icon) {
        if (icon instanceof HTMLImageElement || icon instanceof HTMLCanvasElement) {
          this.$refs['img-container'].appendChild(icon);
        }
        if (typeof icon === 'string') {
          this.iconType = iconTypes.string;
        }
      }
    },
  };
</script>

