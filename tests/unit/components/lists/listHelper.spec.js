import { describe, it, expect, vi, beforeAll } from 'vitest';
import { computed, reactive } from 'vue';
import { setupSelectableList } from '../../../../src/components/lists/listHelper.ts';

describe('list helper', () => {
  describe('setupSelectableList', () => {
    describe('selecting a single item', () => {
      describe('selecting an item', () => {
        let selectableList;
        let items;
        let modelValue;
        let selectionChanged;
        let emit;

        beforeAll(() => {
          emit = vi.fn();
          selectionChanged = vi.fn();
          items = reactive([
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
          ]);
          modelValue = reactive([]);
          selectableList = setupSelectableList(
            reactive({ items, modelValue, selectable: true }),
            computed(() => items),
            emit,
          );
          selectableList.select(items[1], {});
        });

        it('should emit a new modelValue, selecting the item', () => {
          expect(emit.mock.calls.length).toBe(1);
          const [eventName, value] = emit.mock.calls[0];
          expect(eventName).toBe('update:modelValue');
          expect(value).to.be.an('array').and.have.lengthOf(1);
          expect(value).not.to.equal(modelValue);
          expect(value[0]).to.have.property('name', items[1].name);
        });

        it('should call selectionChanged on the item', () => {
          expect(selectionChanged).toHaveBeenCalledWith(true);
        });
      });

      describe('selecting an item a unselectable list', () => {
        let selectableList;
        let items;
        let modelValue;
        let selectionChanged;
        let emit;

        beforeAll(() => {
          emit = vi.fn();
          selectionChanged = vi.fn();
          items = reactive([
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
          ]);
          modelValue = reactive([]);
          selectableList = setupSelectableList(
            reactive({ items, modelValue, selectable: false }),
            computed(() => items),
            emit,
          );
          selectableList.select(items[1], {});
        });

        it('should not emit a new modelValue', () => {
          expect(emit).not.toHaveBeenCalled();
        });

        it('should not call selectionChanged on the item', () => {
          expect(selectionChanged).not.toHaveBeenCalled();
        });
      });

      describe('selecting an item, with another item selected', () => {
        let selectableList;
        let items;
        let modelValue;
        let selectionChanged1;
        let selectionChanged2;
        let emit;

        beforeAll(() => {
          emit = vi.fn();
          selectionChanged1 = vi.fn();
          selectionChanged2 = vi.fn();
          items = reactive([
            {
              name: 'foo',
            },
            {
              name: 'bar',
              selectionChanged: selectionChanged1,
            },
            {
              name: 'baz',
              selectionChanged: selectionChanged2,
            },
          ]);
          modelValue = reactive([items[1]]);
          selectableList = setupSelectableList(
            reactive({ items, modelValue, selectable: true }),
            computed(() => items),
            emit,
          );
          selectableList.select(items[2], {});
        });

        it('should emit a new value, with the new item selected', () => {
          expect(emit.mock.calls.length).toBe(1);
          const [eventName, value] = emit.mock.calls[0];
          expect(eventName).toBe('update:modelValue');
          expect(value).to.be.an('array').and.have.lengthOf(1);
          expect(value).not.to.equal(modelValue);
          expect(value[0]).to.have.property('name', items[2].name);
        });

        it('should call selectionChanged on the item', () => {
          expect(selectionChanged2).toHaveBeenCalledWith(true);
        });

        it('should call selectionChanged on the other item', () => {
          expect(selectionChanged1).toHaveBeenCalledWith(false);
        });
      });

      describe('selecting an item, with the same item selected', () => {
        let selectableList;
        let items;
        let modelValue;
        let selectionChanged;
        let emit;

        beforeAll(() => {
          emit = vi.fn();
          selectionChanged = vi.fn();
          items = reactive([
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
          ]);
          modelValue = reactive([items[1]]);
          selectableList = setupSelectableList(
            reactive({ items, modelValue, selectable: true }),
            computed(() => items),
            emit,
          );
          selectableList.select(items[1], {});
        });

        it('should deselect the item, emitting a new value with no selection', () => {
          expect(emit.mock.calls.length).toBe(1);
          const [eventName, value] = emit.mock.calls[0];
          expect(eventName).toBe('update:modelValue');
          expect(value).to.be.an('array').and.have.lengthOf(0);
          expect(value).not.to.equal(modelValue);
        });

        it('should call selectionChanged on the item with its selection state', () => {
          expect(selectionChanged).toHaveBeenCalledWith(false);
        });
      });

      describe('selecting an item, with the same item & another item selected', () => {
        let selectableList;
        let items;
        let modelValue;
        let selectionChanged1;
        let selectionChanged2;
        let emit;

        beforeAll(() => {
          emit = vi.fn();
          selectionChanged1 = vi.fn();
          selectionChanged2 = vi.fn();
          items = reactive([
            {
              name: 'foo',
            },
            {
              name: 'bar',
              selectionChanged: selectionChanged1,
            },
            {
              name: 'baz',
              selectionChanged: selectionChanged2,
            },
          ]);
          modelValue = [items[1], items[2]];
          selectableList = setupSelectableList(
            reactive({ items, modelValue, selectable: true }),
            computed(() => items),
            emit,
          );
          selectableList.select(items[2], {});
        });

        it('should emit a new value, with the new item selected', () => {
          expect(emit.mock.calls.length).toBe(1);
          const [eventName, value] = emit.mock.calls[0];
          expect(eventName).toBe('update:modelValue');
          expect(value).to.be.an('array').and.have.lengthOf(1);
          expect(value).not.to.equal(modelValue);
          expect(value[0]).to.have.property('name', items[2].name);
        });

        it('should not call selectionChanged on the item', () => {
          expect(selectionChanged2).not.toHaveBeenCalled();
        });

        it('should call selectionChanged on the other item', () => {
          expect(selectionChanged1).toHaveBeenCalledWith(false);
        });
      });
    });

    describe('selecting all items', () => {
      let selectableList;
      let items;
      let modelValue;
      let selectionChangedFoo;
      let selectionChangedBar;
      let selectionChangedBaz;
      let emit;

      beforeAll(() => {
        emit = vi.fn();
        selectionChangedFoo = vi.fn();
        selectionChangedBar = vi.fn();
        selectionChangedBaz = vi.fn();
        items = reactive([
          {
            name: 'foo',
            selectionChanged: selectionChangedFoo,
          },
          {
            name: 'bar',
            selectionChanged: selectionChangedBar,
          },
          {
            name: 'baz',
            selectionChanged: selectionChangedBaz,
          },
        ]);
        modelValue = [items[0]];
        selectableList = setupSelectableList(
          reactive({ items, modelValue, selectable: true }),
          computed(() => items),
          emit,
        );
        // Select All Action
        selectableList.selectionActions[0].callback();
      });

      it('should emit a new value, selecting all items', () => {
        expect(emit.mock.calls.length).toBe(1);
        const [eventName, value] = emit.mock.calls[0];
        expect(eventName).toBe('update:modelValue');
        expect(value).to.be.an('array').and.have.lengthOf(items.length);
        expect(value).not.to.equal(modelValue);
        value.forEach((selected, idx) =>
          expect(selected).to.have.property('name', items[idx].name),
        );
      });

      it('should call selectionChanged on previously unselected items', () => {
        expect(selectionChangedFoo).not.toHaveBeenCalled();
        expect(selectionChangedBar).toHaveBeenCalledWith(true);
        expect(selectionChangedBaz).toHaveBeenCalledWith(true);
      });
    });

    describe('selecting an item with CTRL', () => {
      describe('selecting an item', () => {
        let selectableList;
        let items;
        let modelValue;
        let selectionChanged;
        let emit;

        beforeAll(() => {
          emit = vi.fn();
          selectionChanged = vi.fn();
          items = reactive([
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
          ]);
          modelValue = reactive([]);
          selectableList = setupSelectableList(
            reactive({ items, modelValue, selectable: true }),
            computed(() => items),
            emit,
          );
          selectableList.select(items[1], { ctrlKey: true });
        });

        it('should emit a new value, with the new item selected', () => {
          expect(emit.mock.calls.length).toBe(1);
          const [eventName, value] = emit.mock.calls[0];
          expect(eventName).toBe('update:modelValue');
          expect(value).to.be.an('array').and.have.lengthOf(1);
          expect(value).not.to.equal(modelValue);
          expect(value[0]).to.have.property('name', items[1].name);
        });

        it('should call selectionChanged on the item', () => {
          expect(selectionChanged).toHaveBeenCalledWith(true);
        });
      });

      describe('selecting an item a unselectable list', () => {
        let selectableList;
        let items;
        let modelValue;
        let selectionChanged;
        let emit;

        beforeAll(() => {
          emit = vi.fn();
          selectionChanged = vi.fn();
          items = reactive([
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
          ]);
          modelValue = reactive([]);
          selectableList = setupSelectableList(
            reactive({ items, modelValue, selectable: false }),
            computed(() => items),
            emit,
          );
          selectableList.select(items[1], { ctrlKey: true });
        });

        it('should not emit a new modelValue', () => {
          expect(emit).not.toHaveBeenCalled();
        });

        it('should not call selectionChanged on the item', () => {
          expect(selectionChanged).not.toHaveBeenCalled();
        });
      });

      describe('selecting an item, with another item selected', () => {
        let selectableList;
        let items;
        let modelValue;
        let selectionChanged1;
        let selectionChanged2;
        let emit;

        beforeAll(() => {
          emit = vi.fn();
          selectionChanged1 = vi.fn();
          selectionChanged2 = vi.fn();
          items = reactive([
            {
              name: 'foo',
            },
            {
              name: 'bar',
              selectionChanged: selectionChanged1,
            },
            {
              name: 'baz',
              selectionChanged: selectionChanged2,
            },
          ]);
          modelValue = reactive([items[1]]);
          selectableList = setupSelectableList(
            reactive({ items, modelValue, selectable: true }),
            computed(() => items),
            emit,
          );
          selectableList.select(items[2], { ctrlKey: true });
        });

        it('should emit a new value, with both items selected', () => {
          expect(emit.mock.calls.length).toBe(1);
          const [eventName, value] = emit.mock.calls[0];
          expect(eventName).toBe('update:modelValue');
          expect(value).to.be.an('array').and.have.lengthOf(2);
          expect(value).not.to.equal(modelValue);
          expect(value[0]).to.have.property('name', items[1].name);
          expect(value[1]).to.have.property('name', items[2].name);
        });

        it('should call selectionChanged on the item', () => {
          expect(selectionChanged2).toHaveBeenCalledWith(true);
        });

        it('should not call selectionChanged on the other item', () => {
          expect(selectionChanged1).not.toHaveBeenCalled();
        });
      });

      describe('selecting an item, with another item selected and a single select list', () => {
        let selectableList;
        let items;
        let modelValue;
        let selectionChanged1;
        let selectionChanged2;
        let emit;

        beforeAll(() => {
          emit = vi.fn();
          selectionChanged1 = vi.fn();
          selectionChanged2 = vi.fn();
          items = reactive([
            {
              name: 'foo',
            },
            {
              name: 'bar',
              selectionChanged: selectionChanged1,
            },
            {
              name: 'baz',
              selectionChanged: selectionChanged2,
            },
          ]);
          modelValue = [items[1]];
          selectableList = setupSelectableList(
            reactive({
              items,
              modelValue,
              selectable: true,
              singleSelect: true,
            }),
            computed(() => items),
            emit,
          );
          selectableList.select(items[2], { ctrlKey: true });
        });

        it('should emit a new value, with the new item selected', () => {
          expect(emit.mock.calls.length).toBe(1);
          const [eventName, value] = emit.mock.calls[0];
          expect(eventName).toBe('update:modelValue');
          expect(value).to.be.an('array').and.have.lengthOf(1);
          expect(value).not.to.equal(modelValue);
          expect(value[0]).to.have.property('name', items[2].name);
        });

        it('should call selectionChanged on the item', () => {
          expect(selectionChanged2).toHaveBeenCalledWith(true);
        });

        it('should call selectionChanged on the other item', () => {
          expect(selectionChanged1).toHaveBeenCalledWith(false);
        });
      });

      describe('selecting an item, with the same item selected', () => {
        let selectableList;
        let items;
        let modelValue;
        let selectionChanged;
        let emit;

        beforeAll(() => {
          emit = vi.fn();
          selectionChanged = vi.fn();
          items = reactive([
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
          ]);
          modelValue = reactive([items[1]]);
          selectableList = setupSelectableList(
            reactive({
              items,
              modelValue,
              selectable: true,
            }),
            computed(() => items),
            emit,
          );
          selectableList.select(items[1], { ctrlKey: true });
        });

        it('should emit a new value, without a selection', () => {
          expect(emit.mock.calls.length).toBe(1);
          const [eventName, value] = emit.mock.calls[0];
          expect(eventName).toBe('update:modelValue');
          expect(value).to.be.an('array').and.have.lengthOf(0);
          expect(value).not.to.equal(modelValue);
        });

        it('should call selectionChanged on the other item', () => {
          expect(selectionChanged).toHaveBeenCalledWith(false);
        });
      });

      describe('selecting an item, with the same item & another item selected', () => {
        let selectableList;
        let items;
        let modelValue;
        let selectionChanged1;
        let selectionChanged2;
        let emit;

        beforeAll(() => {
          emit = vi.fn();
          selectionChanged1 = vi.fn();
          selectionChanged2 = vi.fn();
          items = reactive([
            {
              name: 'foo',
            },
            {
              name: 'bar',
              selectionChanged: selectionChanged1,
            },
            {
              name: 'baz',
              selectionChanged: selectionChanged2,
            },
          ]);
          modelValue = [items[1], items[2]];
          selectableList = setupSelectableList(
            reactive({
              items,
              modelValue,
              selectable: true,
            }),
            computed(() => items),
            emit,
          );
          selectableList.select(items[2], { ctrlKey: true });
        });

        it('should emit a new value, without the new value', () => {
          expect(emit.mock.calls.length).toBe(1);
          const [eventName, value] = emit.mock.calls[0];
          expect(eventName).toBe('update:modelValue');
          expect(value).to.be.an('array').and.have.lengthOf(1);
          expect(value).not.to.equal(modelValue);
          expect(value[0]).to.have.property('name', items[1].name);
        });

        it('should call selectionChanged on the item', () => {
          expect(selectionChanged2).toHaveBeenCalledWith(false);
        });

        it('should not call selectionChanged on the other item', () => {
          expect(selectionChanged1).not.toHaveBeenCalled();
        });
      });
    });
  });

  describe('selecting ranges with SHIFT', () => {
    describe('with no other item previously selected', () => {
      let selectableList;
      let items;
      let modelValue;
      let emit;

      beforeAll(() => {
        emit = vi.fn();
        items = reactive([
          {
            name: 'foo',
            selectionChanged: vi.fn(),
          },
          {
            name: 'bar',
            selectionChanged: vi.fn(),
          },
          {
            name: 'baz',
            selectionChanged: vi.fn(),
          },
          {
            name: 'foobar',
            selectionChanged: vi.fn(),
          },
          {
            name: 'foobaz',
            selectionChanged: vi.fn(),
          },
        ]);
        modelValue = reactive([]);
        selectableList = setupSelectableList(
          reactive({
            items,
            modelValue,
            selectable: true,
          }),
          computed(() => items),
          emit,
        );
        selectableList.select(items[2], { shiftKey: true });
      });

      it('should emit a new value, selecting the range from 0', () => {
        expect(emit.mock.calls.length).toBe(1);
        const [eventName, value] = emit.mock.calls[0];
        expect(eventName).toBe('update:modelValue');
        expect(value).to.be.an('array').and.have.lengthOf(3);
        expect(value).not.to.equal(modelValue);
        expect(value[0]).to.have.property('name', items[0].name);
        expect(value[1]).to.have.property('name', items[1].name);
        expect(value[2]).to.have.property('name', items[2].name);
      });

      it('should call selectionChanged on the new range', () => {
        items.slice(0, 2).forEach((i) => {
          expect(i.selectionChanged).toHaveBeenCalledWith(true);
        });
      });
    });

    describe('with no other item previously selected and an unselectable list', () => {
      let selectableList;
      let items;
      let modelValue;
      let emit;

      beforeAll(() => {
        emit = vi.fn();
        items = reactive([
          {
            name: 'foo',
            selectionChanged: vi.fn(),
          },
          {
            name: 'bar',
            selectionChanged: vi.fn(),
          },
          {
            name: 'baz',
            selectionChanged: vi.fn(),
          },
          {
            name: 'foobar',
            selectionChanged: vi.fn(),
          },
          {
            name: 'foobaz',
            selectionChanged: vi.fn(),
          },
        ]);
        modelValue = reactive([]);
        selectableList = setupSelectableList(
          reactive({
            items,
            modelValue,
            selectable: false,
          }),
          computed(() => items),
          emit,
        );
        selectableList.select(items[2], { shiftKey: true });
      });

      it('should not emit a new value', () => {
        expect(emit).not.toHaveBeenCalled();
      });

      it('should not call selectionChanged on the new range', () => {
        items.forEach((i) => {
          expect(i.selectionChanged).not.toHaveBeenCalled();
        });
      });
    });

    describe('with another item selected', () => {
      let selectableList;
      let items;
      let modelValue;
      let emit;

      beforeAll(() => {
        emit = vi.fn();
        items = reactive([
          {
            name: 'foo',
            selectionChanged: vi.fn(),
          },
          {
            name: 'bar',
            selectionChanged: vi.fn(),
          },
          {
            name: 'baz',
            selectionChanged: vi.fn(),
          },
          {
            name: 'foobar',
            selectionChanged: vi.fn(),
          },
          {
            name: 'foobaz',
            selectionChanged: vi.fn(),
          },
        ]);
        modelValue = reactive([]);
        selectableList = setupSelectableList(
          reactive({
            items,
            modelValue,
            selectable: true,
          }),
          computed(() => items),
          emit,
        );
        selectableList.select(items[4], {});
        selectableList.select(items[2], { shiftKey: true });
      });

      it('should emit a new value, selecting the range from the first selection', () => {
        expect(emit.mock.calls.length).toBe(2);
        const [eventName, value] = emit.mock.calls[1];
        expect(eventName).toBe('update:modelValue');
        expect(value).to.be.an('array').and.have.lengthOf(3);
        expect(value).not.to.equal(modelValue);
        expect(value[0]).to.have.property('name', items[2].name);
        expect(value[1]).to.have.property('name', items[3].name);
        expect(value[2]).to.have.property('name', items[4].name);
      });

      it('should call selectionChanged on the new range', () => {
        expect(items[2].selectionChanged).toHaveBeenCalledWith(true);
        expect(items[3].selectionChanged).toHaveBeenCalledWith(true);
      });

      it('should not call selectionChanged on the first item again', () => {
        expect(items[4].selectionChanged).toHaveBeenCalledWith(true);
        expect(items[4].selectionChanged).toHaveBeenCalledOnce();
      });
    });

    describe('with another item selected and a single select list', () => {
      let selectableList;
      let items;
      let modelValue;
      let emit;

      beforeAll(() => {
        emit = vi.fn();
        items = reactive([
          {
            name: 'foo',
            selectionChanged: vi.fn(),
          },
          {
            name: 'bar',
            selectionChanged: vi.fn(),
          },
          {
            name: 'baz',
            selectionChanged: vi.fn(),
          },
          {
            name: 'foobar',
            selectionChanged: vi.fn(),
          },
          {
            name: 'foobaz',
            selectionChanged: vi.fn(),
          },
        ]);
        modelValue = reactive([]);
        selectableList = setupSelectableList(
          reactive({
            items,
            modelValue,
            selectable: true,
            singleSelect: true,
          }),
          computed(() => items),
          emit,
        );
        selectableList.select(items[4], {});
        selectableList.select(items[2], { shiftKey: true });
      });

      it('should emit a new value, selecting the range from the first selection', () => {
        expect(emit.mock.calls.length).toBe(2);
        const [eventName, value] = emit.mock.calls[1];
        expect(eventName).toBe('update:modelValue');
        expect(value).to.be.an('array').and.have.lengthOf(1);
        expect(value).not.to.equal(modelValue);
        expect(value[0]).to.have.property('name', items[2].name);
      });

      it('should call selectionChanged on the new range', () => {
        expect(items[4].selectionChanged).toHaveBeenCalledWith(false);
      });

      it('should not call selectionChanged on the first item again', () => {
        expect(items[2].selectionChanged).toHaveBeenCalledWith(true);
      });
    });

    describe('with another range selected', () => {
      let selectableList;
      let items;
      let modelValue;
      let emit;

      beforeAll(() => {
        emit = vi.fn();
        items = reactive([
          {
            name: 'foo',
            selectionChanged: vi.fn(),
          },
          {
            name: 'bar',
            selectionChanged: vi.fn(),
          },
          {
            name: 'baz',
            selectionChanged: vi.fn(),
          },
          {
            name: 'foobar',
            selectionChanged: vi.fn(),
          },
          {
            name: 'foobaz',
            selectionChanged: vi.fn(),
          },
        ]);
        modelValue = reactive([]);
        selectableList = setupSelectableList(
          reactive({
            items,
            modelValue,
            selectable: true,
          }),
          computed(() => items),
          emit,
        );
        selectableList.select(items[2], {});
        selectableList.select(items[0], { shiftKey: true });
        selectableList.select(items[4], { shiftKey: true });
      });

      it('should emit a new value, selecting the range from the first selection', () => {
        expect(emit.mock.calls.length).toBe(3);
        const [eventName, value] = emit.mock.calls[2];
        expect(eventName).toBe('update:modelValue');
        expect(value).to.be.an('array').and.have.lengthOf(3);
        expect(value).not.to.equal(modelValue);
        expect(value[0]).to.have.property('name', items[2].name);
        expect(value[1]).to.have.property('name', items[3].name);
        expect(value[2]).to.have.property('name', items[4].name);
      });

      it('should call selectionChanged on the old range', () => {
        expect(items[0].selectionChanged).toHaveBeenCalledWith(false);
        expect(items[1].selectionChanged).toHaveBeenCalledWith(false);
      });

      it('should call selectionChanged on the new range', () => {
        expect(items[3].selectionChanged).toHaveBeenCalledWith(true);
        expect(items[4].selectionChanged).toHaveBeenCalledWith(true);
      });

      it('should not call selectionChanged on the first item again', () => {
        expect(items[2].selectionChanged).toHaveBeenCalledWith(true);
        expect(items[2].selectionChanged).toHaveBeenCalledOnce();
      });
    });

    describe('with another selection set selected', () => {
      let selectableList;
      let items;
      let modelValue;
      let emit;

      beforeAll(() => {
        emit = vi.fn();
        items = reactive([
          {
            name: 'foo',
            selectionChanged: vi.fn(),
          },
          {
            name: 'bar',
            selectionChanged: vi.fn(),
          },
          {
            name: 'baz',
            selectionChanged: vi.fn(),
          },
          {
            name: 'foobar',
            selectionChanged: vi.fn(),
          },
          {
            name: 'foobaz',
            selectionChanged: vi.fn(),
          },
        ]);
        modelValue = reactive([]);
        selectableList = setupSelectableList(
          reactive({
            items,
            modelValue,
            selectable: true,
          }),
          computed(() => items),
          emit,
        );
        selectableList.select(items[2], {});
        selectableList.select(items[0], { ctrlKey: true });
        selectableList.select(items[4], { shiftKey: true });
      });

      it('should emit a new value, selecting the range from the first selection', () => {
        expect(emit.mock.calls.length).toBe(3);
        const [eventName, value] = emit.mock.calls[2];
        expect(eventName).toBe('update:modelValue');
        expect(value).to.be.an('array').and.have.lengthOf(3);
        expect(value).not.to.equal(modelValue);
        expect(value[0]).to.have.property('name', items[2].name);
        expect(value[1]).to.have.property('name', items[3].name);
        expect(value[2]).to.have.property('name', items[4].name);
      });

      it('should call selectionChanged on the old range', () => {
        expect(items[0].selectionChanged).toHaveBeenCalledWith(false);
      });

      it('should call selectionChanged on the new range', () => {
        expect(items[3].selectionChanged).toHaveBeenCalledWith(true);
        expect(items[4].selectionChanged).toHaveBeenCalledWith(true);
      });

      it('should not call selectionChanged on the first item again', () => {
        expect(items[3].selectionChanged).toHaveBeenCalledWith(true);
        expect(items[3].selectionChanged).toHaveBeenCalledOnce();
      });
    });

    describe('with an in range invisible item', () => {
      let selectableList;
      let items;
      let modelValue;
      let emit;

      beforeAll(() => {
        emit = vi.fn();
        items = reactive([
          {
            name: 'foo',
            selectionChanged: vi.fn(),
          },
          {
            name: 'bar',
            selectionChanged: vi.fn(),
            visible: false,
          },
          {
            name: 'baz',
            selectionChanged: vi.fn(),
          },
          {
            name: 'foobar',
            selectionChanged: vi.fn(),
          },
          {
            name: 'foobaz',
            selectionChanged: vi.fn(),
          },
        ]);
        modelValue = reactive([]);
        selectableList = setupSelectableList(
          reactive({
            items,
            modelValue,
            selectable: true,
          }),
          computed(() => items.filter((i) => i.visible !== false)),
          emit,
        );
        selectableList.select(items[2], { shiftKey: true });
      });

      it('should emit a new value, selecting the range from 0', () => {
        expect(emit.mock.calls.length).toBe(1);
        const [eventName, value] = emit.mock.calls[0];
        expect(eventName).toBe('update:modelValue');
        expect(value).to.be.an('array').and.have.lengthOf(2);
        expect(value).not.to.equal(modelValue);
        expect(value[0]).to.have.property('name', items[0].name);
        expect(value[1]).to.have.property('name', items[2].name);
      });

      it('should call selectionChanged on the new range', () => {
        expect(items[0].selectionChanged).toHaveBeenCalledWith(true);
        expect(items[2].selectionChanged).toHaveBeenCalledWith(true);
      });
    });
  });
});
