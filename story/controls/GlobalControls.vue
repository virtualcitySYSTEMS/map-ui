<script setup>
  import { computed } from 'vue';
  import Icons from '../../src/components/icons/+all.js';
  import WrapperControls from './WrapperControls.vue';

  const model = defineModel({ type: Object, default: () => ({}) });

  defineProps({
    withIcon: {
      type: Boolean,
      default: false,
    },
  });

  const iconValues = Object.keys(Icons).map((k) => `$${k}`);

  const preset = computed({
    get() {
      return null;
    },
    set(value) {
      if (value === 'large') {
        model.value.itemHeight = '48px';
        model.value.fontSize = '15px';
      } else {
        model.value.itemHeight = '32px';
        model.value.fontSize = '13px';
        model.value.fontFamily = 'Titillium Web';
        model.value.primaryColor = '#27B97C';
      }
    },
  });
</script>
<template>
  <div>
    <h1 class="ma-2">Global App Controls</h1>
    <HstSelect
      v-model="model.icon"
      :options="iconValues"
      title="Icon"
      v-if="withIcon"
    />
    <HstColorSelect v-model="model.primaryColor" title="Primary Color" />
    <HstCheckbox type="checkbox" v-model="model.darkMode" title="Dark Mode" />
    <HstButtonGroup
      v-model="preset"
      title="Presets"
      :options="['default', 'large']"
    />
    <HstText v-model="model.itemHeight" title="Item Height" />
    <HstText v-model="model.fontSize" title="Font Size" />
    <HstSelect
      v-model="model.fontFamily"
      title="Font Family"
      :options="[
        { label: 'Default', value: 'Titillium Web' },
        { label: 'Helvetica', value: 'Helvetica' },
        { label: 'Georgia', value: 'Georgia' },
        { label: 'Courier New', value: 'Courier New' },
      ]"
    />
    <HstJson title="v-bind" v-model="model.bind" />
    <WrapperControls v-if="model.wrapper" v-model="model.wrapper" />
    <h1 class="ma-2">Attrs Controls</h1>
    <slot><span class="ma-2">No controls defined</span></slot>
  </div>
</template>
