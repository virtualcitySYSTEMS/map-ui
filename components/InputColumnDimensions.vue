<!-- eslint-disable max-len -->

<template>
  <div class="w-full d-flex flex-row">
    <div class="mr-2 flex-grow-1">
      <TextField label="W" type="number" :value="10" dense hide-details />
      <TextField label="H" type="number" :value="10" dense hide-details />
      <TextField label="L" type="number" :value="10" dense hide-details />
    </div>
    <div class="d-flex align-center">
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="65" viewBox="0 0 12 65">
        <g id="Group_1388" data-name="Group 1388" transform="translate(0 0.5)">
          <path id="Path_512" data-name="Path 512" d="M3.2,3.31h.261V2.352a2.352,2.352,0,0,1,4.6-.676.435.435,0,1,1-.834.25h0a1.481,1.481,0,0,0-2.9.426v.784A.174.174,0,0,0,4.5,3.31H8.422a.7.7,0,0,1,.7.7V7.665a.7.7,0,0,1-.7.7H3.2a.7.7,0,0,1-.7-.7V4.007A.7.7,0,0,1,3.2,3.31Z" transform="translate(2.881 28.03)" fill="#585858" />
          <g id="Group_1387" data-name="Group 1387" transform="translate(0 0)">
            <path
              id="Path_513"
              data-name="Path 513"
              d="M-8645-12145.311h8V-12135"
              transform="translate(8645 12145.311)"
              fill="none"
              stroke="#dedede"
              stroke-width="1"
            />
            <path
              id="Path_514"
              data-name="Path 514"
              d="M-8645-12113.231h8v-9.727"
              transform="translate(8645 12177.231)"
              fill="none"
              stroke="#dedede"
              stroke-width="1"
            />
          </g>
        </g>
      </svg>
    </div>
  </div>
</template>

<script>
  import TextField from '@vcsuite/uicomponents/TextField.vue';
  import Vue from 'vue';

  export default Vue.extend({
    components: {
      TextField,
    },
  });
</script>
