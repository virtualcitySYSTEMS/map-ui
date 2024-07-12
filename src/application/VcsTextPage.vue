<template>
  <v-sheet>
    <v-container>
      <VcsMarkdown :content="markedHtml"></VcsMarkdown>
    </v-container>
  </v-sheet>
</template>

<style lang="scss" scoped>
  @import '../styles/shades.scss';

  .theme--light {
    a {
      color: map-get($shades, 'black');
    }
  }
  .theme--dark {
    a {
      color: map-get($shades, 'white');
    }
  }
  a {
    &:hover {
      color: var(--v-primary-base);
    }
    &:before {
      content: '\00a9';
    }
  }
</style>

<script>
  import { computed, getCurrentInstance } from 'vue';
  import { VContainer, VSheet } from 'vuetify/components';
  import VcsMarkdown from '../components/form-output/VcsMarkdown.vue';

  /**
   * @description Is a component to render and sanitize a String
   * @vue-prop {string} content - The markdown content to be rendered. Is translatable and will be sanitized.
   */
  export default {
    name: 'VcsTextPage',
    components: {
      VSheet,
      VContainer,
      VcsMarkdown,
    },
    props: {
      content: {
        type: String,
        default: () => '',
      },
    },
    setup(props) {
      const vm = getCurrentInstance().proxy;
      const markedHtml = computed(() => {
        return vm.$st(props.content);
      });

      return {
        markedHtml,
      };
    },
  };
</script>
