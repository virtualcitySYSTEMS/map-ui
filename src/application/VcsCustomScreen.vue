<template>
  <v-card>
    <div class="px-2 pt-2 pb-1">
      <v-card-text>
        <div v-html="customScreenText"></div>
      </v-card-text>
    </div>
  </v-card>
</template>

<script>
  import { VCard, VCardText } from 'vuetify/components';

  import { computed, getCurrentInstance } from 'vue';
  import { parseAndSanitizeMarkdown } from './markdownHelper.js';

  export default {
    name: 'VcsCustomScreen',
    components: {
      VCard,
      VCardText,
    },
    props: {
      content: {
        type: String,
        required: true,
      },
    },
    setup(props) {
      const vm = getCurrentInstance().proxy;
      const dialog = true;
      const customScreenText = computed(() => {
        const translatedContent = vm.$t(props.content);
        return parseAndSanitizeMarkdown(translatedContent);
      });

      return {
        dialog,
        customScreenText,
      };
    },
  };
</script>

<style scoped lang="scss"></style>
