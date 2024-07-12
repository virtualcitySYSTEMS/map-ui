<template>
  <v-card>
    <div class="px-2 pt-2 pb-1">
      <v-card-text>
        <VcsMarkdown :content="customScreenText"></VcsMarkdown>
      </v-card-text>
    </div>
  </v-card>
</template>

<script>
  import { VCard, VCardText } from 'vuetify/components';

  import { computed, getCurrentInstance } from 'vue';
  import VcsMarkdown from '../components/form-output/VcsMarkdown.vue';

  export default {
    name: 'VcsCustomScreen',
    components: {
      VcsMarkdown,
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
        return vm.$st(props.content);
      });

      return {
        dialog,
        customScreenText,
      };
    },
  };
</script>

<style scoped lang="scss"></style>
