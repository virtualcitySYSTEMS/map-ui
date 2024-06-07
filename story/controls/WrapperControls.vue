<script setup>
  const model = defineModel({ type: Object, default: () => ({}) });

  /**
   * @typedef {Object} RowWrapper
   * @property {'row'} type
   * @property {number} [cols=6] - number of columns
   * @property {CSSStyleDeclaration} [style]
   */

  /**
   * @typedef {Object} CardWrapper
   * @property {'card'} type
   * @property {string} title - card title
   * @property {string} subtitle - card subtitle
   * @property {number} [width=320]
   * @property {number} [height=200]
   * @property {CSSStyleDeclaration} [style]
   */

  /**
   * @typedef {Object} WindowWrapper
   * @property {'window'} type
   * @property {number} [width=320]
   * @property {number} [height=200]
   * @property {CSSStyleDeclaration} [style]
   */

  /**
   * @type {RowWrapper|CardWrapper|WindowWrapper|boolean} Wrapper
   */

  /**
   *
   * @enum {{WINDOW: 'window', ROW: 'row', CARD: 'card'}}
   */
  const WrapperTypes = {
    WINDOW: 'window',
    ROW: 'row',
    CARD: 'card',
  };
</script>
<template>
  <div>
    <h1 class="ma-2">Wrapper Controls</h1>
    <HstSelect
      v-model="model.type"
      :options="Object.values(WrapperTypes)"
      title="Wrapper"
    />
    <HstText
      v-if="model.type === WrapperTypes.ROW"
      v-model.number="model.cols"
      title="Cols"
    />
    <template v-if="model.type === WrapperTypes.CARD">
      <HstText v-model="model.title" title="Title" />
      <HstText v-model="model.subtitle" title="Subtitle" />
    </template>
    <template v-if="model.type !== WrapperTypes.ROW">
      <HstText v-model.number="model.height" title="height" />
      <HstText v-model.number="model.width" title="width" />
    </template>
  </div>
</template>
