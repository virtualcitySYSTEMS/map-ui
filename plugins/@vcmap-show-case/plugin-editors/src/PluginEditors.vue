<template>
  <VcsList :items="plugins" :show-title="false" />
</template>

<script>
  import { inject, onUnmounted, ref } from 'vue';
  import { VcsList, createToggleAction, WindowSlot } from '@vcmap/ui';
  import { name } from '../package.json';

  export default {
    name: 'PluginEditors',
    components: {
      VcsList,
    },
    setup() {
      const plugins = ref([]);
      const vcsApp = /** @type {VcsUiApp} */ (inject('vcsApp'));
      const createPluginItem = (plugin) => {
        const editors = plugin.getConfigEditors?.();
        if (editors?.length > 0) {
          const actions = editors
            .map((e) => e.component)
            .filter((c) => c)
            .map((component, index) =>
              createToggleAction(
                {
                  name: `editor-${index + 1}`,
                  icon: index < 9 ? `mdi-numeric-${index + 1}-box` : undefined,
                },
                {
                  id: `${plugin.name}-editor-${index}`,
                  component,
                  parentId: name,
                  slot: WindowSlot.DYNAMIC_CHILD,
                  props: {
                    getConfig: () =>
                      Promise.resolve(
                        vcsApp.plugins.getSerializedByKey(plugin.name),
                      ),
                    setConfig(config) {
                      if (config) {
                        vcsApp.notifier.add({
                          type: 'info',
                          message: `${plugin.name}: ${JSON.stringify(
                            config,
                            null,
                            2,
                          )}`,
                        });
                      } else {
                        vcsApp.notifier.add({
                          type: 'warning',
                          message: `${plugin.name}: no config set.`,
                        });
                      }
                    },
                  },
                  state: {
                    headerTitle:
                      component.title ?? `${plugin.name} Editor ${index + 1}`,
                  },
                  position: {
                    width: 500,
                  },
                },
                vcsApp.windowManager,
                name,
              ),
            );

          if (actions.length > 0) {
            return {
              title: plugin.name,
              actions: actions.map((a) => a.action),
              destroy() {
                actions.forEach((a) => a.destroy());
                actions.splice(0);
              },
            };
          }
        }
        return null;
      };

      plugins.value = [...vcsApp.plugins]
        .map(createPluginItem)
        .filter((p) => p);

      const added = vcsApp.plugins.added.addEventListener((p) => {
        const item = createPluginItem(p);
        if (item) {
          plugins.value.push(item);
        }
      });

      const removed = vcsApp.plugins.removed.addEventListener((p) => {
        const index = plugins.value.findIndex((i) => i.title === p.name);
        if (index > -1) {
          plugins.value[index].destroy();
          plugins.value.splice(index, 1);
        }
      });

      onUnmounted(() => {
        added();
        removed();
        plugins.value.forEach((p) => {
          p.destroy();
        });
      });

      return {
        plugins,
      };
    },
  };
</script>

<style scoped></style>
