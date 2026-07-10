<template>
  <div>
    <VcsHelp
      text="Below all config editors provided by plugins are listed. Changes made in editors are applied by removing and re-adding the plugin with the new config."
    ></VcsHelp>
    <VcsList :items="plugins" :show-title="false" />
  </div>
</template>

<script>
  import { inject, onUnmounted, ref } from 'vue';
  import { VcsList, createToggleAction, WindowSlot, VcsHelp } from '@vcmap/ui';
  import deepEqual from 'fast-deep-equal';
  import { name } from '../package.json';

  export default {
    name: 'PluginEditors',
    components: {
      VcsHelp,
      VcsList,
    },
    setup() {
      const plugins = ref([]);
      const vcsApp = /** @type {VcsUiApp} */ (inject('vcsApp'));
      const createPluginItem = (plugin) => {
        const editors = plugin.getConfigEditors?.();
        if (editors?.length > 0) {
          const actions = editors
            .filter((e) => e.component)
            .map((e, index) =>
              createToggleAction(
                {
                  name: `editor-${index + 1}`,
                  title: e.title,
                  icon: index < 9 ? `mdi-numeric-${index + 1}-box` : undefined,
                },
                {
                  id: `${plugin.name}-editor-${index}`,
                  component: e.component,
                  parentId: name,
                  slot: WindowSlot.DYNAMIC_CHILD,
                  props: {
                    getConfig: () => {
                      return vcsApp.plugins.getSerializedByKey(plugin.name);
                    },
                    async setConfig(config) {
                      if (config) {
                        const currentPlugin = vcsApp.plugins.getByKey(
                          plugin.name,
                        );
                        const oldSerialized = currentPlugin?.toJSON?.() ?? {};
                        if (currentPlugin) {
                          currentPlugin.destroy?.();
                          vcsApp.plugins.remove(currentPlugin);
                        }
                        await vcsApp.plugins.parseItems(
                          [config],
                          vcsApp.dynamicModuleId,
                        );
                        const newPlugin = vcsApp.plugins.getByKey(config.name);
                        const serialized = newPlugin?.toJSON?.() ?? {};
                        if (!deepEqual(oldSerialized, serialized)) {
                          vcsApp.notifier.add({
                            type: 'info',
                            title: plugin.name,
                            message: JSON.stringify(serialized, null, 2),
                          });
                          console.log(serialized);
                        } else {
                          vcsApp.notifier.add({
                            type: 'warning',
                            message: `${plugin.name}: no config changes were made. Did you implement toJSON correctly?`,
                          });
                        }
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
                      e.title ?? `${plugin.name} Editor ${index + 1}`,
                    infoUrlCallback: e.infoUrlCallback,
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
