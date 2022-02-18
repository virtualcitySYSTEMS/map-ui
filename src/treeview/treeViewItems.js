import { VcsClassRegistry } from '@vcmap/core';
import LayerTreeViewItem from './LayerTreeViewItem.js';
import NodeTreeViewItem from './NodeTreeViewItem.js';
import GroupTreeViewItem from './GroupTreeViewItem.js';

VcsClassRegistry.registerClass(LayerTreeViewItem.className, LayerTreeViewItem);
VcsClassRegistry.registerClass(NodeTreeViewItem.className, NodeTreeViewItem);
VcsClassRegistry.registerClass(GroupTreeViewItem.className, GroupTreeViewItem);
