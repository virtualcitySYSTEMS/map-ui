// @ts-nocheck
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { reactive, ref } from 'vue';
import {
  InsertMode,
  moveDraggableItems,
  setupDraggableListOrTree,
} from '../../../../src/components/lists/dragHelper.js';

function createListItems() {
  const selectionChanged = vi.fn();
  return [
    {
      name: 'foo',
    },
    {
      name: 'bar',
      selectionChanged,
    },
    {
      name: 'baz',
    },
  ];
}

function createTreeItems() {
  return [
    { name: 'foo' },
    { name: 'bar' },
    {
      name: 'node',
      children: [
        { name: 'child' },
        { name: 'child node', children: [{ name: 'child child' }] },
      ],
    },
    { name: 'empty node', children: [] },
  ];
}

function createDropTarget(width = 320, height = 32) {
  const target = document.createElement('div');
  // Mock getBoundingClientRect for testing
  target.getBoundingClientRect = () => new DOMRect(0, 0, width, height);
  return target;
}

/**
 * @param {string} type
 * @param {MouseEventInit} options
 * @returns {MouseEvent}
 */
function createMouseEvent(type, options = {}) {
  const event = new MouseEvent(type, options);
  event.dataTransfer = {
    effectAllowed: 'uninitialized',
    dropEffect: 'none',
  };
  const target = document.createElement('div');
  // Override the read-only property for testing
  Object.defineProperty(event, 'currentTarget', {
    value: target,
  });
  return event;
}

function doDragStart(items, draggableSetup) {
  const event = createMouseEvent('dragstart');
  draggableSetup.dragStart(event, items[0]);
  return event;
}

function doDragOver(
  items,
  draggableSetup,
  clientY,
  item = items[1],
  dropTarget = createDropTarget(),
  dropTargetZones = true,
  isOpen = false,
) {
  const event = createMouseEvent('dragover', {
    clientY,
  });
  draggableSetup.dragOver(event, item, dropTarget, dropTargetZones, isOpen);
  return event;
}

function doDrop(items, draggableSetup) {
  const event = createMouseEvent('drop');
  draggableSetup.drop(event, items[1]);
  return event;
}

function doDragEnd(draggableSetup) {
  const event = createMouseEvent('dragend');
  draggableSetup.dragEnd(event);
  return event;
}

describe('drag helper', () => {
  describe('setupDraggableListOrTree', () => {
    describe('draggable VcsList', () => {
      let draggableList;
      let items;
      let query;
      let emit;

      beforeEach(() => {
        emit = vi.fn();
        items = reactive(createListItems());
        query = ref('');
        draggableList = setupDraggableListOrTree(
          { items, draggable: true },
          query,
          emit,
        );
      });

      it('should set dragging on drag start', () => {
        doDragStart(items, draggableList);
        expect(draggableList.dragging.value).to.be.true;
      });

      describe('drag over', () => {
        it('should add css drop target classes on drag over upper half', () => {
          doDragStart(items, draggableList);
          const event = doDragOver(items, draggableList, 2);
          expect(event.currentTarget.classList.contains('drop-target-before'))
            .to.be.true;
          expect(event.dataTransfer).to.have.property('dropEffect', 'move');
        });

        it('should add css drop target classes on drag over lower half', () => {
          doDragStart(items, draggableList);
          const event = doDragOver(items, draggableList, 30);
          expect(event.currentTarget.classList.contains('drop-target-after')).to
            .be.true;
          expect(event.dataTransfer).to.have.property('dropEffect', 'move');
        });

        it('should not add css classes, if no dragging happens', () => {
          const event = doDragOver(items, draggableList, 2);
          expect(draggableList.dragging.value).to.be.false;
          expect(event.currentTarget.classList.contains('drop-target-before'))
            .to.be.false;
          expect(event.currentTarget.classList.contains('drop-target-after')).to
            .be.false;
          expect(event.dataTransfer).to.have.property('dropEffect', 'none');
        });

        it('should remove css classes from first element, if dragover emitted from second element', () => {
          doDragStart(items, draggableList);
          const event = doDragOver(items, draggableList, 30);
          const { currentTarget } = event;
          expect(currentTarget.classList.contains('drop-target-after')).to.be
            .true;
          doDragOver(items, draggableList, 34);
          expect(currentTarget.classList.contains('drop-target-after')).to.be
            .false;
        });

        describe('dropTargetZones', () => {
          it('should not add css classes, if dropTargetZones returns false', () => {
            const draggableListWithDropTargetZones = setupDraggableListOrTree(
              { items, draggable: true, dropTargetZones: () => false },
              query,
              emit,
            );
            doDragStart(items, draggableListWithDropTargetZones);
            const event = doDragOver(
              items,
              draggableListWithDropTargetZones,
              2,
            );
            expect(event.currentTarget.classList.contains('drop-target-before'))
              .to.be.false;
            expect(event.currentTarget.classList.contains('drop-target-after'))
              .to.be.false;
            expect(event.dataTransfer).to.have.property('dropEffect', 'none');
          });

          it('should not add before class, if dropTargetZones returns before=false, but may add after', () => {
            const draggableListWithDropTargetZones = setupDraggableListOrTree(
              {
                items,
                draggable: true,
                dropTargetZones: () => ({
                  before: false,
                }),
              },
              query,
              emit,
            );
            doDragStart(items, draggableListWithDropTargetZones);
            const event = doDragOver(
              items,
              draggableListWithDropTargetZones,
              2,
            );
            expect(event.currentTarget.classList.contains('drop-target-before'))
              .to.be.false;
            expect(event.currentTarget.classList.contains('drop-target-after'))
              .to.be.false;
            expect(event.dataTransfer).to.have.property('dropEffect', 'none');
            const event2 = doDragOver(
              items,
              draggableListWithDropTargetZones,
              30,
            );
            expect(
              event2.currentTarget.classList.contains('drop-target-before'),
            ).to.be.false;
            expect(event2.currentTarget.classList.contains('drop-target-after'))
              .to.be.true;
            expect(event2.dataTransfer).to.have.property('dropEffect', 'move');
          });

          it('should not add after class, if dropTargetZones returns after=false, but may add before', () => {
            const draggableListWithDropTargetZones = setupDraggableListOrTree(
              {
                items,
                draggable: true,
                dropTargetZones: () => ({
                  after: false,
                }),
              },
              query,
              emit,
            );
            doDragStart(items, draggableListWithDropTargetZones);
            const event = doDragOver(
              items,
              draggableListWithDropTargetZones,
              30,
            );
            expect(event.currentTarget.classList.contains('drop-target-before'))
              .to.be.false;
            expect(event.currentTarget.classList.contains('drop-target-after'))
              .to.be.false;
            expect(event.dataTransfer).to.have.property('dropEffect', 'none');
            const event2 = doDragOver(
              items,
              draggableListWithDropTargetZones,
              2,
            );
            expect(
              event2.currentTarget.classList.contains('drop-target-before'),
            ).to.be.true;
            expect(event2.currentTarget.classList.contains('drop-target-after'))
              .to.be.false;
            expect(event2.dataTransfer).to.have.property('dropEffect', 'move');
          });
        });
      });

      it('should clear css drop target classes on drag end', () => {
        doDragStart(items, draggableList);
        const event = doDragOver(items, draggableList, 2);
        expect(event.currentTarget.classList.contains('drop-target-before')).to
          .be.true;
        doDragEnd(draggableList);
        expect(event.currentTarget.classList.contains('drop-target-before')).to
          .be.false;
        expect(event.currentTarget.classList.contains('drop-target-after')).to
          .be.false;
      });

      it('should emit itemMoved on drop over upper half', () => {
        doDragStart(items, draggableList);
        doDragOver(items, draggableList, 2);
        doDrop(items, draggableList);
        expect(emit).toHaveBeenCalledWith('itemMoved', {
          item: items[0],
          targetItem: items[1],
          position: InsertMode.BEFORE,
        });
      });

      it('should emit itemMoved on drop over lower half', () => {
        doDragStart(items, draggableList);
        doDragOver(items, draggableList, 30);
        doDrop(items, draggableList);
        expect(emit).toHaveBeenCalledWith('itemMoved', {
          item: items[0],
          targetItem: items[1],
          position: InsertMode.AFTER,
        });
      });

      it('should set dragging on drag end', () => {
        const event = new MouseEvent('dragend');
        draggableList.dragEnd(event);
        expect(draggableList.dragging.value).to.be.false;
      });
    });

    describe('draggable VcsTreeView', () => {
      let draggableTree;
      let items;
      let query;
      let emit;
      let dropTarget;

      beforeEach(() => {
        emit = vi.fn();
        items = reactive(createTreeItems());
        query = ref('');
        draggableTree = setupDraggableListOrTree(
          { items, draggable: true },
          query,
          emit,
        );
        dropTarget = createDropTarget(320, 40);
      });

      it('should set dragging on drag start', () => {
        doDragStart(items, draggableTree);
        expect(draggableTree.dragging.value).to.be.true;
      });

      describe('drag over', () => {
        it('should add css drop target classes on drag over upper quarter', () => {
          doDragStart(items, draggableTree);
          const event = doDragOver(
            items,
            draggableTree,
            2,
            items[1],
            dropTarget,
          );
          expect(event.currentTarget.classList.contains('drop-target-before'))
            .to.be.true;
          expect(event.dataTransfer).to.have.property('dropEffect', 'move');
        });

        it('should add css drop target classes on drag over center', () => {
          doDragStart(items, draggableTree);
          const event = doDragOver(
            items,
            draggableTree,
            20,
            items[1],
            dropTarget,
          );
          expect(event.currentTarget.classList.contains('drop-target-into')).to
            .be.true;
          expect(event.dataTransfer).to.have.property('dropEffect', 'copy');
        });

        it('should add css drop target classes on drag over lower quarter', () => {
          doDragStart(items, draggableTree);
          const event = doDragOver(
            items,
            draggableTree,
            38,
            items[1],
            dropTarget,
          );
          expect(event.currentTarget.classList.contains('drop-target-after')).to
            .be.true;
          expect(event.dataTransfer).to.have.property('dropEffect', 'move');
        });

        it('should not add after class, if group node is open', () => {
          doDragStart(items, draggableTree);
          const event = doDragOver(
            items,
            draggableTree,
            38,
            items[2],
            dropTarget,
            true,
            true,
          );
          expect(event.currentTarget.classList.contains('drop-target-after')).to
            .be.false;
          expect(event.dataTransfer).to.have.property('dropEffect', 'copy');
        });

        it('should not add css classes, if no dragging happens', () => {
          const event = doDragOver(
            items,
            draggableTree,
            2,
            items[1],
            dropTarget,
          );
          expect(draggableTree.dragging.value).to.be.false;
          expect(event.currentTarget.classList.contains('drop-target-into')).to
            .be.false;
          expect(event.currentTarget.classList.contains('drop-target-before'))
            .to.be.false;
          expect(event.currentTarget.classList.contains('drop-target-after')).to
            .be.false;
          expect(event.dataTransfer).to.have.property('dropEffect', 'none');
        });

        describe('dropTargetZones', () => {
          it('should not add css classes, if dropTargetZones returns false', () => {
            const draggableListWithDropTargetZones = setupDraggableListOrTree(
              { items, draggable: true, dropTargetZones: () => false },
              query,
              emit,
            );
            doDragStart(items, draggableListWithDropTargetZones);
            const event = doDragOver(
              items,
              draggableListWithDropTargetZones,
              2,
              items[1],
              dropTarget,
            );
            expect(event.currentTarget.classList.contains('drop-target-before'))
              .to.be.false;
            expect(event.currentTarget.classList.contains('drop-target-into'))
              .to.be.false;
            expect(event.currentTarget.classList.contains('drop-target-after'))
              .to.be.false;
            expect(event.dataTransfer).to.have.property('dropEffect', 'none');
          });

          it('should not add before class, if dropTargetZones returns before=false, but may add into or after', () => {
            const draggableListWithDropTargetZones = setupDraggableListOrTree(
              {
                items,
                draggable: true,
                dropTargetZones: () => ({
                  before: false,
                }),
              },
              query,
              emit,
            );
            doDragStart(items, draggableListWithDropTargetZones);
            const event = doDragOver(
              items,
              draggableListWithDropTargetZones,
              2,
              items[1],
              dropTarget,
            );
            expect(event.currentTarget.classList.contains('drop-target-before'))
              .to.be.false;
            expect(event.currentTarget.classList.contains('drop-target-into'))
              .to.be.false;
            expect(event.currentTarget.classList.contains('drop-target-after'))
              .to.be.false;
            expect(event.dataTransfer).to.have.property('dropEffect', 'none');
            const event2 = doDragOver(
              items,
              draggableListWithDropTargetZones,
              38,
              items[1],
              dropTarget,
            );
            expect(
              event2.currentTarget.classList.contains('drop-target-before'),
            ).to.be.false;
            expect(event2.currentTarget.classList.contains('drop-target-into'))
              .to.be.false;
            expect(event2.currentTarget.classList.contains('drop-target-after'))
              .to.be.true;
            expect(event2.dataTransfer).to.have.property('dropEffect', 'move');
          });

          it('should not add after class, if dropTargetZones returns after=false, but may add before or into', () => {
            const draggableListWithDropTargetZones = setupDraggableListOrTree(
              {
                items,
                draggable: true,
                dropTargetZones: () => ({
                  after: false,
                }),
              },
              query,
              emit,
            );
            doDragStart(items, draggableListWithDropTargetZones);
            const event = doDragOver(
              items,
              draggableListWithDropTargetZones,
              30,
              items[1],
              dropTarget,
            );
            expect(event.currentTarget.classList.contains('drop-target-before'))
              .to.be.false;
            expect(event.currentTarget.classList.contains('drop-target-into'))
              .to.be.false;
            expect(event.currentTarget.classList.contains('drop-target-after'))
              .to.be.false;
            expect(event.dataTransfer).to.have.property('dropEffect', 'none');
            const event2 = doDragOver(
              items,
              draggableListWithDropTargetZones,
              2,
              items[1],
              dropTarget,
            );
            expect(
              event2.currentTarget.classList.contains('drop-target-before'),
            ).to.be.true;
            expect(event2.currentTarget.classList.contains('drop-target-into'))
              .to.be.false;
            expect(event2.currentTarget.classList.contains('drop-target-after'))
              .to.be.false;
            expect(event2.dataTransfer).to.have.property('dropEffect', 'move');
          });
        });
      });

      it('should emit itemMoved on drop over upper quarter', () => {
        doDragStart(items, draggableTree);
        doDragOver(items, draggableTree, 2, items[1], dropTarget);
        doDrop(items, draggableTree);
        expect(emit).toHaveBeenCalledWith('itemMoved', {
          item: items[0],
          targetItem: items[1],
          position: InsertMode.BEFORE,
        });
      });

      it('should emit itemMoved on drop over center', () => {
        doDragStart(items, draggableTree);
        doDragOver(items, draggableTree, 20, items[1], dropTarget);
        doDrop(items, draggableTree);
        expect(emit).toHaveBeenCalledWith('itemMoved', {
          item: items[0],
          targetItem: items[1],
          position: InsertMode.INTO,
        });
      });

      it('should emit itemMoved on drop over lower quarter', () => {
        doDragStart(items, draggableTree);
        doDragOver(items, draggableTree, 38, items[1], dropTarget);
        doDrop(items, draggableTree);
        expect(emit).toHaveBeenCalledWith('itemMoved', {
          item: items[0],
          targetItem: items[1],
          position: InsertMode.AFTER,
        });
      });

      it('should set dragging on drag end', () => {
        const event = new MouseEvent('dragend');
        draggableTree.dragEnd(event);
        expect(draggableTree.dragging.value).to.be.false;
      });
    });

    describe('drag item and drop it onto itself', () => {
      let draggableList;
      let items;
      let query;
      let emit;

      beforeEach(() => {
        emit = vi.fn();
        items = reactive(createListItems());
        query = ref('');
        draggableList = setupDraggableListOrTree(
          { items, draggable: true },
          query,
          emit,
        );
      });

      it('should set dragging and draggedItem on drag start', () => {
        doDragStart(items, draggableList);
        expect(draggableList.dragging.value).to.be.true;
      });

      it('should not add css drop target classes on drag over itself', () => {
        doDragStart(items, draggableList);
        const event = doDragOver(items, draggableList, 2, items[0]);
        expect(event.currentTarget.classList.contains('drop-target-before')).to
          .be.false;
        expect(event.dataTransfer).to.have.property('dropEffect', 'none');
      });

      it('should NOT emit itemMoved on drop onto itself', () => {
        doDrop(items, draggableList);
        expect(emit).not.toHaveBeenCalled();
      });

      it('should set dragging on drag end', () => {
        const event = new MouseEvent('dragend');
        draggableList.dragEnd(event);
        expect(draggableList.dragging.value).to.be.false;
      });
    });

    describe('draggable false', () => {
      let draggableList;
      let items;
      let query;
      let emit;

      beforeAll(() => {
        emit = vi.fn();
        items = reactive(createListItems());
        query = ref('');
        draggableList = setupDraggableListOrTree(
          { items, draggable: false },
          query,
          emit,
        );
      });

      it('should return isDraggable false', () => {
        expect(draggableList.isDraggable.value).to.be.false;
      });

      it('should not emit itemMoved on drop', () => {
        const event = new MouseEvent('drop');
        draggableList.drop(event, 0);
        expect(emit).not.toHaveBeenCalled();
      });
    });
  });

  describe('move tree items', () => {
    let items;

    beforeEach(() => {
      items = reactive(createTreeItems());
    });

    describe('on same level', () => {
      it('should move item after', () => {
        const source = 2;
        const target = 0;
        const { name } = items[source];
        moveDraggableItems(items, {
          item: items[source],
          targetItem: items[target],
          position: InsertMode.AFTER,
        });
        expect(items[target + 1]).to.have.property('name', name);
      });

      it('should move item before', () => {
        const source = 2;
        const target = 1;
        const { name } = items[source];
        moveDraggableItems(items, {
          item: items[source],
          targetItem: items[target],
          position: InsertMode.BEFORE,
        });
        expect(items[target]).to.have.property('name', name);
      });

      it('should not mutate array, when moving item before neighbouring item', () => {
        const source = 0;
        const target = 1;
        const { name: sourceName } = items[source];
        const { name: targetName } = items[target];
        moveDraggableItems(items, {
          item: items[source],
          targetItem: items[target],
          position: InsertMode.BEFORE,
        });
        expect(items[source]).to.have.property('name', sourceName);
        expect(items[target]).to.have.property('name', targetName);
      });

      it('should move item from top to bottom', () => {
        const source = 0;
        const target = items.length - 1;
        const { name } = items[source];
        moveDraggableItems(items, {
          item: items[source],
          targetItem: items[target],
          position: InsertMode.AFTER,
        });
        expect(items[target]).to.have.property('name', name);
      });

      it('should move item from bottom to top', () => {
        const source = items.length - 1;
        const target = 0;
        const { name } = items[source];
        moveDraggableItems(items, {
          item: items[source],
          targetItem: items[target],
          position: InsertMode.BEFORE,
        });
        expect(items[0]).to.have.property('name', name);
      });

      it('should move child item down', () => {
        const source = [2, 0];
        const target = [2, 1];
        const { name } = items[source[0]].children[source[1]];
        moveDraggableItems(items, {
          item: items[source[0]].children[source[1]],
          targetItem: items[target[0]].children[target[1]],
          position: InsertMode.AFTER,
        });
        expect(items[target[0]].children[target[1]]).to.have.property(
          'name',
          name,
        );
      });

      it('should move child item up', () => {
        const source = [2, 1];
        const target = [2, 0];
        const { name } = items[source[0]].children[source[1]];
        moveDraggableItems(items, {
          item: items[source[0]].children[source[1]],
          targetItem: items[target[0]].children[target[1]],
          position: InsertMode.BEFORE,
        });
        expect(items[target[0]].children[target[1]]).to.have.property(
          'name',
          name,
        );
      });
    });

    describe('on different levels', () => {
      it('should move item into normal item', () => {
        const source = 0;
        const target = 1;
        const { name } = items[source];
        const { length } = items;
        moveDraggableItems(items, {
          item: items[source],
          targetItem: items[target],
          position: InsertMode.INTO,
        });
        expect(items.length).to.equal(length - 1);
        expect(items[target - 1]).to.have.property('children');
        expect(items[target - 1].children[0]).to.have.property('name', name);
      });

      it('should move item into node and place it at and of children', () => {
        const source = 0;
        const target = 2;
        const { name } = items[source];
        const { length } = items;
        moveDraggableItems(items, {
          item: items[source],
          targetItem: items[target],
          position: InsertMode.INTO,
        });
        expect(items.length).to.equal(length - 1);
        expect(items[target - 1]).to.have.property('children');
        expect(items[target - 1].children.at(-1)).to.have.property(
          'name',
          name,
        );
      });

      it('should move item before child', () => {
        const source = 0;
        const target = [2, 0];
        const { name } = items[source];
        const { length } = items;
        moveDraggableItems(items, {
          item: items[source],
          targetItem: items[target[0]].children[target[1]],
          position: InsertMode.BEFORE,
        });
        expect(items.length).to.equal(length - 1);
        expect(items[target[0] - 1]).to.have.property('children');
        expect(items[target[0] - 1].children[target[1]]).to.have.property(
          'name',
          name,
        );
      });

      it('should move item two levels into', () => {
        const source = 0;
        const target = [2, 1];
        const { name } = items[source];
        const { length } = items;
        moveDraggableItems(items, {
          item: items[source],
          targetItem: items[target[0]].children[target[1]],
          position: InsertMode.INTO,
        });
        expect(items.length).to.equal(length - 1);
        expect(items[target[0] - 1]).to.have.property('children');
        expect(items[target[0] - 1].children[target[1]]).to.have.property(
          'children',
        );
        expect(
          items[target[0] - 1].children[target[1]].children.at(-1),
        ).to.have.property('name', name);
      });

      it('should move item two levels before child child', () => {
        const source = 0;
        const target = [2, 1, 0];
        const { name } = items[source];
        const { length } = items;
        moveDraggableItems(items, {
          item: items[source],
          targetItem: items[target[0]].children[target[1]].children[target[2]],
          position: InsertMode.BEFORE,
        });
        expect(items.length).to.equal(length - 1);
        expect(items[target[0] - 1]).to.have.property('children');
        expect(items[target[0] - 1].children[target[1]]).to.have.property(
          'children',
        );
        expect(
          items[target[0] - 1].children[target[1]].children[target[2]],
        ).to.have.property('name', name);
      });

      it('should move item out', () => {
        const source = [2, 0];
        const target = 0;
        const { name } = items[source[0]].children[source[1]];
        const { length } = items;
        const childrenLength = items[source[0]].children.length;
        moveDraggableItems(items, {
          item: items[source[0]].children[source[1]],
          targetItem: items[target],
          position: InsertMode.BEFORE,
        });
        expect(items.length).to.equal(length + 1);
        expect(items[source[0] + 1].children.length).to.equal(
          childrenLength - 1,
        );
        expect(items[target]).to.have.property('name', name);
      });
    });
  });
});
