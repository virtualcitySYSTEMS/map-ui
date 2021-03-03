<template>
  <v-card :max-width="width">
    <TreeviewSearchbar v-if="hasSearchbar" @input="filter" />
    <v-virtual-scroll
      :height="height"
      :items="filteredSearch.length ? filteredSearch : items"
      :item-height="itemHeight"
      :bench="10"
    >
      <template #default="{item}">
        <v-list-item class="px-2" :key="item.name">
          <v-icon v-text="'$vcsSimpleCircleFilled'" size="8" class="mr-2 gray-200--text" />
          <v-list-item-content>
            <v-list-item-title class="font-size-14">
              {{ item.name }}
            </v-list-item-title>
          </v-list-item-content>
          <v-icon v-if="item.iconAppend" v-text="item.iconAppend" size="16" />
        </v-list-item>
        <v-divider />
      </template>
    </v-virtual-scroll>

    <div v-if="hasProgress" class="d-flex flex-column px-4 py-3">
      <button @click="$emit('load-more')" class="text-left mb-2">
        <strong>{{ 'endless-list.load-more' | translate }}</strong>
      </button>
      <v-progress-linear :value="percentLoaded" class="rounded" />
      <span class="caption">
        {{ 'endless-list.amount-loaded' | translate({ loaded: itemsLoaded, total: itemsTotal }) }}
      </span>
    </div>
  </v-card>
</template>

<script>
  import TreeviewSearchbar from '@vcsuite/uicomponents/TreeviewSearchbar.vue';
  import Fuse from 'fuse.js';
  import Vue from 'vue';


  // https://fusejs.io/api/options.html
  const options = {
    keys: [
      'name',
      'title',
      'children.name',
      'children.actions.title',
      'children.children.name',
    ],
  };

  /**
   * @description
   * Virtual scrolling list with optional progress bar which shows number of entries.
   * @vue-prop {Array}    items - Array of objects of items to be displayed. Objects are defined as such: { name: string, iconAppend: string }
   * @vue-prop {number}   width - Width of the list in pixels.
   * @vue-prop {boolean}  hasProgress - Whether the progress bar should be displayed.
   * @vue-prop {number}   itemsTotal - Amount of all possible items, loaded or not.
   * @vue-prop {number}   itemsLoaded - Amount of loaded items.
   * @vue-prop {number}   itemHeight - Height of each item in the list in pixels. Needed for virtual scroll.
   * @vue-prop {number}   itemsDisplayed - Number of items which should be displayed at once. Multiply this with itemHeight to get height of this list.
   * @vue-prop {boolean}  hasSearchbar - Whether the search bar should be displayed.
   */
  export default Vue.extend({
    name: 'VcsEndlessList',
    computed: {
      height() {
        return this.itemHeight * this.itemsDisplayed;
      },
      percentLoaded() {
        return (this.itemsLoaded / this.itemsTotal) * 100;
      },
    },
    mounted() {
      this.fuse = new Fuse(this.items, options);
    },
    components: { TreeviewSearchbar },
    props: {
      items: {
        type: Array,
        default: () => Array(1000).fill('').map((k, i) => ({
          name: i,
          iconAppend: '$vcsExternalLink',
        })),
      },
      width: {
        type: Number,
        default: undefined,
      },
      itemsTotal: {
        type: Number,
        default: 76,
      },
      itemsLoaded: {
        type: Number,
        default: 46,
      },
      itemHeight: {
        type: Number,
        default: 48,
      },
      itemsDisplayed: {
        type: Number,
        default: 10,
      },
      hasProgress: {
        type: Boolean,
        default: true,
      },
      hasSearchbar: {
        type: Boolean,
        default: true,
      },
    },
    methods: {
      filter(val = '') {
        this.filteredSearch = this.fuse
          .search(val)
          .map(({ item }) => { return item; });
      },
    },
    data() {
      return {
        filteredSearch: [],
        searchVal: undefined,
      };
    },
  });
</script>
