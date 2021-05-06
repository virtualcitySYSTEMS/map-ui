<template>
  <v-sheet
    :id="elementId"
    class="vcs-context-menu position-absolute rounded"
    v-click-outside="onClickOutside"
    :class="[...customClasses]"
    :style="{ opacity: hidden ? 0 : 1 }"
    elevation="2"
  >
    <ul
      class="vcs-context-menu-list pa-0"
      :style="{
        width: width ? `${width}px` : undefined
      }"
    >
      <li
        v-for="(option) of options"
        :key="option.name"
        class="vcs-context-menu-list-item position-relative px-2 d-flex flex-row"
        :class="{
          'py-1': dense,
          'py-2': !dense,
          'text--disabled': option.disabled,
          'cursor-not-allowed': option.disabled
        }"
      >
        <div
          class="vcs-context-menu-list-item__background position-absolute pos-a-0 primary"
        />
        <v-icon
          v-if="option.iconPrepend"
          v-text="option.iconPrepend.name"
          class="mr-2 vcs-context-menu-list-item__icon-prepend"
          :size="option.iconPrepend.size || 12"
        />
        <span
          @click="$emit('option-clicked', option)"
          :class="{
            'mr-2': option.iconAppend,
            caption: dense,
            'line-height-1.2': dense,
            'line-height-1': !dense,
          }"
        >
          {{ option.name | translate }}
        </span>

        <v-icon
          v-if="option.iconAppend"
          v-text="option.iconAppend.name"
          :size="option.iconAppend.size || 16"
          class="ml-auto vcs-context-menu-list-item__icon-append"
        />
      </li>
    </ul>
  </v-sheet>
</template>

<style lang="scss" scoped>
  .vcs-context-menu {
    border: 1px solid var(--v-accent-base)
  }

  ul {
    list-style: none;

    li {
      cursor: pointer;

      .vcs-context-menu-list-item__background {
        opacity: 0;
      }

      &:not(.text--disabled) {
        &:hover {
          color: var(--v-primary-base);

          .vcs-context-menu-list-item__background {
            opacity: 0.1;
          }
        }
      }


      &:not(:last-child) {
        border-bottom: 1px solid var(--v-gray-200-base);
      }
    }
  }

  .dense {
    ::v-deep {
      ul {
        font-size: 13px;
      }

      li {
        padding-top: 3px;
        padding-bottom: 3px;
      }
    }
  }
</style>

<script>
  import Vue from 'vue';
  import ClickOutside from 'vue-click-outside';

  /**
   * @description
   * Customizable context menu.
   * Most code was taken from https://github.com/johndatserakis/vue-simple-context-menu
   * and adapted in order to show more complex templates.
   *
   * @vue-prop {Array} options          - List of options to be shown in the menu.
   * @vue-prop {boolean} dense          - Whether the component should be shrunk in size.
   * @vue-prop {Array} customClasses    - List of CSS classes which will be added to the root element.
   * @vue-prop {MouseEvent} clickEvent  - The click mouse event which triggers the context menu. Needs to be passed for displaying this component.
   * @vue-prop {number} width           - Optional width attribute for this component.
   *
   * @example
   *   <ContextMenu
   *     v-if="clickEvent"
   *     :click-event="clickEvent"
   *     :options="options"
   *     @menu-closed="clickEvent = undefined"
   *   >
   */
  export default Vue.extend({
    name: 'VcsContextMenu',
    directives: { ClickOutside },
    props: {
      options: {
        type: Array,
        default: () => ([
          { iconPrepend: { name: 'mdi-minus', size: 24 }, name: 'You', iconAppend: { name: 'mdi-plus' } },
          { name: 'Should' },
          { name: 'Set' },
          { name: 'The' },
          { name: 'Props', disabled: true },
          { name: 'Of' },
          { name: 'This' },
          { name: 'Component!' },
        ]),
      },
      dense: {
        type: Boolean,
        default: false,
      },
      customClasses: {
        type: Array,
        default: () => ([]),
      },
      clickEvent: {
        type: MouseEvent,
        default: undefined,
      },
      width: {
        type: Number,
        default: undefined,
      },
    },
    data() {
      return {
        item: null,
        menuWidth: null,
        menuHeight: null,
        elementId: 'vcs-context-menu',
        hasClipboardData: false,
        hidden: true,
      };
    },
    async mounted() {
      if (!this.clickEvent) {
        return;
      }
      this.hasClipboardData = !!(await navigator.clipboard.readText().catch(() => {}));
      this.showMenu(this.clickEvent);
      this.hidden = false;
      document.body.addEventListener('keyup', this.onEscKeyRelease);
    },
    beforeDestroy() {
      document.removeEventListener('keyup', this.onEscKeyRelease);
    },
    methods: {
      showMenu(event, item) {
        // Currently undefined, check if needed
        this.item = item;
        const menu = document.getElementById(this.elementId);
        if (!menu) {
          return;
        }
        if (!this.menuWidth || !this.menuHeight) {
          menu.style.visibility = 'hidden';
          menu.style.display = 'block';
          this.menuWidth = menu.offsetWidth;
          this.menuHeight = menu.offsetHeight;
          menu.removeAttribute('style');
        }
        if ((this.menuWidth + event.pageX) >= window.innerWidth) {
          menu.style.left = `${event.pageX - this.menuWidth + 2 }px`;
        } else {
          menu.style.left = `${event.pageX - 2 }px`;
        }
        if ((this.menuHeight + event.pageY) >= window.innerHeight) {
          menu.style.top = `${event.pageY - this.menuHeight + 2 }px`;
        } else {
          menu.style.top = `${event.pageY - 2 }px`;
        }
        menu.classList.remove('d-none');
      },
      hideContextMenu() {
        const element = document.getElementById(this.elementId);
        if (element) {
          element.classList.add('d-none');
          this.$emit('menu-closed');
        }
      },
      onClickOutside() {
        this.hideContextMenu();
      },
      optionClicked(option) {
        this.hideContextMenu();
        this.$emit('option-clicked', {
          item: this.item,
          option,
        });
      },
      onEscKeyRelease(event) {
        if (event.keyCode === 27) {
          this.hideContextMenu();
        }
      },
    },
    watch: {
      clickEvent(e) {
        this.showMenu(e);
      },
    },
  });
</script>
