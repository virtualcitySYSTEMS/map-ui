<script setup>
  import { ref } from 'vue';
  import { getStoryState } from '../../setup.js';
  import VcsMarkdown from '../../../src/components/form-output/VcsMarkdown.vue';
  import GlobalControls from '../../controls/GlobalControls.vue';

  const state = getStoryState(undefined, 'row');
  const markdownText = ref(
    '![image](https://vc.systems/wp-content/uploads/2020/07/vcs_logo.png)\n\nSplash Screen Template\n-------------------\n\n\n\n\n\n\n\nErste Schritte\n-------------------\n\nDies ist ein <em> Beispieltext</em>, der Ihnen den Einstieg erleichtern soll. **Marked** wird verwendet, um Ihren Text <u>von Markdown nach HTML</u> zu konvertieren. Um mehr über die <u><em>korrekte Syntax</em></u>zu erfahren, besuchen Sie bitte diesen [Link](https://marked.js.org/demo/) für eine Demo.  \n\nWie man Listen hinzufügt\n\n\n\n1. Punkt 1 einer Aufzählung\n2. Punkt 2 einer Aufzählung.\n\nWenn Sie Aufzählungen nicht mögen, wie wäre es mit Aufzählungspunkten?  \n- Punkt 1: einer Liste mit Aufzählungspunkten. \n- Punkt 2: einer Aufzählungsliste.',
  );
</script>

<template>
  <Story title="VcsMarkdown" :meta="{ wrapper: { ...state.wrapper } }">
    <Variant title="Text">
      <VcsMarkdown v-bind="{ ...state.bind }" :content="markdownText">
      </VcsMarkdown>
      <template #controls>
        <GlobalControls v-model="state">
          <HstTextarea title="modelValue" v-model="markdownText"></HstTextarea>
        </GlobalControls>
      </template>
    </Variant>
  </Story>
</template>
