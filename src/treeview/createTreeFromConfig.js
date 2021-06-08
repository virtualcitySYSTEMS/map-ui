import { shallowReactive } from '@vue/composition-api';

/**
 * @param {AbstractTreeViewItem.Options} config
 * @param {AbstractTreeNode} parent
 */
async function createItemFromConfig(config, parent) {
  let child;
  try {
    child = await parent.createChildItem(config);
  } catch (e) {
    console.log(`faild to create for type ${config.type}`);
    return;
  }

  if (config.items && config.items.length > 0) {
    config.items.forEach((c) => {
      createItemFromConfig(c, child);
    });
  }
}

/**
 * @param {Context} context
 * @param {Array<AbstractTreeViewItem.Options>} itemConfigs
 * @param {function(new: AbstractTree, context: Context)} Ctor
 */

export default async function createTreeFromConfig(context, itemConfigs, Ctor) {
  const treeview = new Ctor(context);
  const tree = shallowReactive(treeview);
  Object.setPrototypeOf(tree, Ctor.prototype);
  await Promise.all(itemConfigs.map(c => createItemFromConfig(c, tree)));

  return tree;
}
