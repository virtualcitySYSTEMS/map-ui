<script setup>
  import { ref } from 'vue';
  import { getStoryState } from '../../setup.js';
  import VcsCheckbox from '../../../src/components/form-inputs-controls/VcsCheckbox.vue';
  import GlobalControls from '../../controls/GlobalControls.vue';

  const state = getStoryState();
  const label = ref('Some Label');
</script>

<template>
  <Story title="VcsCheckbox" :meta="{ wrapper: { ...state.wrapper } }">
    <VcsCheckbox v-bind="{ ...state.bind }" :label="label" />
    <template #controls>
      <GlobalControls v-model="state">
        <HstText v-model="label" title="Label"></HstText>
      </GlobalControls>
    </template>
  </Story>
</template>

<docs lang="md">
# VcsCheckbox

The checkbox has always the size of its parent.
If you want to define a specific size use the `width` property:

```
<VcsCheckbox width="100" />
```

Note: The size of the checkbox has impact on the tooltip position.
</docs>
