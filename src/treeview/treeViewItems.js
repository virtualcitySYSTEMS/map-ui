import { VcsClassRegistry } from '@vcmap/core';
import LayerTreeViewItem from '@/treeview/LayerTreeViewItem.js';
import NodeTreeViewItem from '@/treeview/NodeTreeViewItem.js';
import GroupTreeViewItem from '@/treeview/GroupTreeViewItem.js';

VcsClassRegistry.registerClass(LayerTreeViewItem.className, LayerTreeViewItem);
VcsClassRegistry.registerClass(NodeTreeViewItem.className, NodeTreeViewItem);
VcsClassRegistry.registerClass(GroupTreeViewItem.className, GroupTreeViewItem);
