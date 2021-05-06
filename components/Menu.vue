<template>
  <v-menu
    v-bind="{...$props, ...$attrs}"
  >
    <template v-slot:activator="{ on, attrs }">
      <slot :on="on" name="activator">
        <v-btn
          v-bind="attrs"
          v-on="on"
          elevation="0"
        >
          <v-icon
            v-if="icon"
            v-text="icon"
            :class="{ 'mr-2': !!$slots.default }"
          />
        </v-btn>
      </slot>
    </template>

    <v-list dense>
      <v-list-item v-for="item of items" :key="item.title">
        <v-menu :close-on-content-click="true">
          <template v-slot:activator="{on, attrs}">
            <v-list-item-icon v-if="item.iconPrepend" class="cursor-pointer d-flex align-center">
              <v-icon
                v-text="item.iconPrepend.name"
                :size="item.iconPrepend.size || 12"
              />
            </v-list-item-icon>
            <v-list-item-title
              class="cursor-pointer"
              v-bind="attrs"
              v-on="on"
            >
              {{ item.title }}
            </v-list-item-title>

            <v-icon
              class="append"
              v-if="item.iconAppend"
              v-text="item.iconAppend.name"
              :size="item.iconAppend.size || 24"
              v-on="on"
            />
          </template>
          <v-list v-if="item.children" dense>
            <v-list-item v-for="child of item.children" :key="child.title">
              <v-list-item-icon
                v-if="item.iconPrepend"
                class="cursor-pointer d-flex align-center"
              >
                <v-icon
                  v-text="item.iconPrepend.name"
                  :size="item.iconPrepend.size || 16"
                />
              </v-list-item-icon>
              <v-list-item-title class="cursor-pointer">
                {{ child.title }}
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<style lang="scss" scoped>
  .v-list-item--dense .v-list-item__icon,
  .v-list--dense .v-list-item .v-list-item__icon {
    height: 16px;
    margin-right: 8px;
    margin-bottom: 4px;
    margin-top: 4px;
    align-self: center;
    width: 16px;
    min-width: 16px;
  }

  ::v-deep {
    .v-list-item {
      padding: 0 16px 0 8px;

      &:hover {
        .v-list-item__title,
        .v-icon {
          color: var(--v-primary-base);
        }
      }
    }

    .v-icon.append {
      margin-left: auto;
      position: absolute;
      right: 0;
      top: 50%;
      transform: translateY(-50%);
    }
  }
</style>

<script>
  import Vue from 'vue';

  /**
   *
   * @typedef MenuItem
   * @type {Object}
   * @property {string} title
   * @property {string} iconAppend
   * @property {string} iconPrepend
   * @property {MenuItem[]} children
   * @memberof module:Menu
   *
   */

  /**
   * @description extends API of https://vuetifyjs.com/en/api/v-menu/
   * To use custom activator slot:
   *
   * @example
   *  // Use custom activator slot
   *  <template v-slot:activator="{ on }">
   *     <button v-on="on">
   *       Menu
   *     </button>
   *  </template>
   *
   * @vue-prop {MenuItem[]} items - Menuitems to be shown
   * @vue-prop {string} icon      - Icon to used to activate menu.
   */
  export default Vue.extend({
    name: 'VcsMenu',
    props: {
      items: {
        type: Array,
        default: () => ([]),
      },
      icon: {
        type: String,
        default: undefined,
      },
    },
  });
</script>
