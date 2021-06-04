<template>
  <div v-if="item">
    <slot name="prepend">
      <v-icon
        v-if="item.iconPrepend"
        v-text="item.iconPrepend.name"
        :size="item.iconPrepend.size || 16"
      />
    </slot>

    <slot name="label">
      <!-- TODO: proper translations -->
      <span>{{ item.name || item.title.de || item.title }}</span>
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
  import { defineComponent } from '@vue/composition-api';

  export default defineComponent({
    setup() {

    },
    mounted() {
      console.log(this.item);
    },
    props: ['item'],
  });
</script>

