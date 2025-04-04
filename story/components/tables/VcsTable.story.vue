<script setup>
  import { reactive } from 'vue';
  import { getStoryState } from '../../setup.js';
  import VcsTable from '../../../src/components/tables/VcsTable.vue';
  import GlobalControls from '../../controls/GlobalControls.vue';

  const state = getStoryState();

  const attributes = reactive({
    externalObjectNameWhichisVeryLong: 'DEBE01YYK0001xqy',
    measuredHeight: undefined,
    Address: {
      Country: 'Germany',
      City: 'Berlin',
    },
    singleLine: 'oneVeryLongSingelLineWordThatCanNotBeBroken',
    multiLine:
      'A long attribute consisting of multiple words that can be broken',
    featureId: 'DEBE01YYK0001xqy',
  });
</script>

<template>
  <Story title="VcsTable" :meta="{ wrapper: { ...state.wrapper } }">
    <VcsTable :attributes="attributes" v-bind="{ ...state.bind }" />
    <template #controls>
      <GlobalControls v-model="state"></GlobalControls>
    </template>
  </Story>
</template>

<docs lang="md">
# VcsTable

A table view for feature attributes using VcsDataTable.
It ensures text overflow for keys and values.

Values can be displayed inside a HTML tag.
Simply provide `tags` prop with an object defining the key, the html tag as type and optionally some html tag properties.
Supported tags are:

- [a](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a)

```json
{
  "gemeinde": {
    "tag": "a",
    "href": "https://de.wikipedia.org/wiki/${value}"
  }
}
```

- [audio](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio)

```json
{
  "someKey": {
    "tag": "audio",
    "src": "https://www.w3schools.com/TAgs/horse.mp3"
  }
}
```

- [b](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/b)
- [i](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/i)
- [iframe](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe)
- [img](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img)
- [meter](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meter)
- [progress](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/progress)
- [s](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/s)
- [strong](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/strong)
- [video](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video)

## Vuetify API Reference

- [v-data-table](https://vuetifyjs.com/en/api/v-data-table/)
</docs>
