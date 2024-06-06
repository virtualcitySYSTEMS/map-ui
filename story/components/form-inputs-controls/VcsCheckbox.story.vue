<script setup>
  import { ref } from 'vue';
  import { getStoryState } from '../../setup.js';
  import GlobalControls from '../../GlobalControls.vue';
  import VcsCheckbox from '../../../src/components/form-inputs-controls/VcsCheckbox.vue';

  const state = getStoryState();
  const label = ref('Some Label');
</script>

<template>
  <Story title="VcsCheckbox" :meta="{ wrapper: { type: 'row' } }">
    <VcsCheckbox :label="label" />
    <template #controls>
      <GlobalControls v-model="state"></GlobalControls>
      <HstText v-model="label" title="Label">
        <template #actions></template>
      </HstText>
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
