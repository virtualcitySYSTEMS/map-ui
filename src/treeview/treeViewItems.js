import { VcsClassRegistry } from '@vcmap/core';
import LayerTreeViewItem from '@/treeview/LayerTreeViewItem';
import NodeTreeViewItem from '@/treeview/NodeTreeViewItem';
import GroupTreeViewItem from '@/treeview/GroupTreeViewItem';

VcsClassRegistry.registerClass(LayerTreeViewItem.className, LayerTreeViewItem);
VcsClassRegistry.registerClass(NodeTreeViewItem.className, NodeTreeViewItem);
VcsClassRegistry.registerClass(GroupTreeViewItem.className, GroupTreeViewItem);
