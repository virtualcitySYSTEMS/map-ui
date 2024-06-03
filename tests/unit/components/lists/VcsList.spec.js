import {
  describe,
  it,
  expect,
  vi,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
} from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { toRaw } from 'vue';
import {
  createSafeI18n,
  createVueI18n,
} from '../../../../src/vuePlugins/i18n.js';
import VcsList from '../../../../src/components/lists/VcsList.vue';

describe('VcsList', () => {
  describe('selecting a single item', () => {
    describe('selecting an item', () => {
      let component;
      let items;
      let value;
      let selectionChanged;

      beforeAll(() => {
        selectionChanged = vi.fn();
        items = [
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
        value = [];
        component = shallowMount(VcsList, {
          props: { items, value, selectable: true },
        });
        component.vm.select(items[1], {});
      });

      afterAll(() => {
        component.unmount();
      });

      it('should emit a new value, selecting the item', () => {
        const { 'update:modelValue': input } = component.emitted();
        expect(input).to.be.ok;
        expect(input).have.lengthOf(1);
        expect(input[0]).to.be.an('array').and.have.lengthOf(1);
        expect(input[0][0]).to.be.an('array').and.have.lengthOf(1);
        expect(input[0][0]).not.to.equal(value);
        expect(input[0][0][0]).to.have.property('name', items[1].name);
      });

      it('should call selectionChanged on the item', () => {
        expect(selectionChanged).toHaveBeenCalledWith(true);
      });
    });

    describe('selecting an item a unselectable list', () => {
      let component;
      let items;
      let value;
      let selectionChanged;

      beforeAll(() => {
        selectionChanged = vi.fn();
        items = [
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
        value = [];
        component = shallowMount(VcsList, {
          props: { items, value, selectable: false },
        });
        component.vm.select(items[1], {});
      });

      afterAll(() => {
        component.unmount();
      });

      it('should not emit a new value', () => {
        expect(component.emitted()).to.not.have.property('update:modelValue');
      });

      it('should not call selectionChanged on the item', () => {
        expect(selectionChanged).not.toHaveBeenCalled();
      });
    });

    describe('selecting an item, with another item selected', () => {
      let component;
      let items;
      let value;
      let selectionChanged1;
      let selectionChanged2;

      beforeAll(() => {
        selectionChanged1 = vi.fn();
        selectionChanged2 = vi.fn();
        items = [
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
        ];
        value = [items[1]];
        component = shallowMount(VcsList, {
          props: { items, modelValue: value, selectable: true },
        });
        component.vm.select(items[2], {});
      });

      afterAll(() => {
        component.unmount();
      });

      it('should emit a new value, with the new item selected', () => {
        const { 'update:modelValue': input } = component.emitted();
        expect(input).to.be.ok;
        expect(input).have.lengthOf(1);
        expect(input[0]).to.be.an('array').and.have.lengthOf(1);
        expect(input[0][0]).to.be.an('array').and.have.lengthOf(1);
        expect(input[0][0]).not.to.equal(value);
        expect(input[0][0][0]).to.have.property('name', items[2].name);
      });

      it('should call selectionChanged on the item', () => {
        expect(selectionChanged2).toHaveBeenCalledWith(true);
      });

      it('should call selectionChanged on the other item', () => {
        expect(selectionChanged1).toHaveBeenCalledWith(false);
      });
    });

    describe('selecting an item, with the same item selected', () => {
      let component;
      let items;
      let modelValue;
      let selectionChanged;

      beforeAll(() => {
        selectionChanged = vi.fn();
        items = [
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
        modelValue = [items[1]];
        component = shallowMount(VcsList, {
          props: { items, modelValue, selectable: true },
        });
        component.vm.select(items[1], {});
      });

      afterAll(() => {
        component.unmount();
      });

      it('should deselect the item, emitting a new value with no selection', () => {
        const { 'update:modelValue': input } = component.emitted();
        expect(input).to.be.ok;
        expect(input).have.lengthOf(1);
        expect(input[0]).to.be.an('array').and.have.lengthOf(1);
        expect(input[0][0]).to.be.an('array').and.have.lengthOf(0);
      });

      it('should call selectionChanged on the item with its selection state', () => {
        expect(selectionChanged).toHaveBeenCalledWith(false);
      });
    });

    describe('selecting an item, with the same item & another item selected', () => {
      let component;
      let items;
      let modelValue;
      let selectionChanged1;
      let selectionChanged2;

      beforeAll(() => {
        selectionChanged1 = vi.fn();
        selectionChanged2 = vi.fn();
        items = [
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
        ];
        modelValue = [items[1], items[2]];
        component = shallowMount(VcsList, {
          props: { items, modelValue, selectable: true },
        });
        component.vm.select(items[2], {});
      });

      afterAll(() => {
        component.unmount();
      });

      it('should emit a new value, with the new item selected', () => {
        const { 'update:modelValue': input } = component.emitted();
        expect(input).to.be.ok;
        expect(input).have.lengthOf(1);
        expect(input[0]).to.be.an('array').and.have.lengthOf(1);
        expect(input[0][0]).to.be.an('array').and.have.lengthOf(1);
        expect(input[0][0]).not.to.equal(modelValue);
        expect(input[0][0][0]).to.have.property('name', items[2].name);
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
    let component;
    let items;
    let modelValue;
    let selectionChangedFoo;
    let selectionChangedBar;
    let selectionChangedBaz;

    beforeAll(() => {
      selectionChangedFoo = vi.fn();
      selectionChangedBar = vi.fn();
      selectionChangedBaz = vi.fn();
      items = [
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
      ];
      modelValue = [items[0]];
      component = shallowMount(VcsList, {
        props: { items, modelValue, selectable: true },
      });
      // Select All Action
      component.vm.renderingActions[0].callback();
    });

    afterAll(() => {
      component.unmount();
    });

    it('should emit a new value, selecting all items', () => {
      const { 'update:modelValue': input } = component.emitted();
      expect(input).to.be.ok;
      expect(input).have.lengthOf(1);
      expect(input[0]).to.be.an('array').and.have.lengthOf(1);
      expect(input[0][0]).to.be.an('array').and.have.lengthOf(items.length);
      expect(input[0][0]).not.to.equal(modelValue);
      input[0][0].forEach((selected, idx) =>
        expect(selected).to.have.property('name', items[idx].name),
      );
    });

    it('should call selectionChanged on previously unselected items', () => {
      expect(selectionChangedFoo).not.toHaveBeenCalled();
      expect(selectionChangedBar).toHaveBeenCalledWith(true);
      expect(selectionChangedBaz).toHaveBeenCalledWith(true);
    });
  });

  describe('clear selection', () => {
    let component;
    let items;
    let modelValue;
    let selectionChangedFoo;
    let selectionChangedBar;
    let selectionChangedBaz;

    beforeAll(() => {
      selectionChangedFoo = vi.fn();
      selectionChangedBar = vi.fn();
      selectionChangedBaz = vi.fn();
      items = [
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
      ];
      modelValue = [items[0]];
      component = shallowMount(VcsList, {
        props: { items, modelValue, selectable: true },
      });
      // clearAll Action
      component.vm.renderingActions[1].callback();
    });

    afterAll(() => {
      component.unmount();
    });

    it('should emit a new value, clearing selection', () => {
      const { 'update:modelValue': input } = component.emitted();
      expect(input).to.be.ok;
      expect(input).have.lengthOf(1);
      expect(input[0]).to.be.an('array').and.have.lengthOf(1);
      expect(input[0][0]).to.be.an('array').and.have.lengthOf(0);
      expect(input[0][0]).not.to.equal(modelValue);
    });

    it('should call selectionChanged on previously selected items', () => {
      expect(selectionChangedFoo).toHaveBeenCalledWith(false);
      expect(selectionChangedBar).not.toHaveBeenCalled();
      expect(selectionChangedBaz).not.toHaveBeenCalled();
    });
  });

  describe('selecting an item with CTRL', () => {
    describe('selecting an item', () => {
      let component;
      let items;
      let modelValue;
      let selectionChanged;

      beforeAll(() => {
        selectionChanged = vi.fn();
        items = [
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
        modelValue = [];
        component = shallowMount(VcsList, {
          props: { items, modelValue, selectable: true },
        });
        component.vm.select(items[1], { ctrlKey: true });
      });

      afterAll(() => {
        component.unmount();
      });

      it('should emit a new value, with the new item selected', () => {
        const { 'update:modelValue': input } = component.emitted();
        expect(input).to.be.ok;
        expect(input).have.lengthOf(1);
        expect(input[0]).to.be.an('array').and.have.lengthOf(1);
        expect(input[0][0]).to.be.an('array').and.have.lengthOf(1);
        expect(input[0][0]).not.to.equal(modelValue);
        expect(input[0][0][0]).to.have.property('name', items[1].name);
      });

      it('should call selectionChanged on the item', () => {
        expect(selectionChanged).toHaveBeenCalledWith(true);
      });
    });

    describe('selecting an item a unselectable list', () => {
      let component;
      let items;
      let modelValue;
      let selectionChanged;

      beforeAll(() => {
        selectionChanged = vi.fn();
        items = [
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
        modelValue = [];
        component = shallowMount(VcsList, {
          props: { items, modelValue, selectable: false },
        });
        component.vm.select(items[1], { ctrlKey: true });
      });

      afterAll(() => {
        component.unmount();
      });

      it('should not emit a new value', () => {
        expect(component.emitted()).to.not.have.property('update:modelValue');
      });

      it('should not call selectionChanged on the item', () => {
        expect(selectionChanged).not.toHaveBeenCalled();
      });
    });

    describe('selecting an item, with another item selected', () => {
      let component;
      let items;
      let modelValue;
      let selectionChanged1;
      let selectionChanged2;

      beforeAll(() => {
        selectionChanged1 = vi.fn();
        selectionChanged2 = vi.fn();
        items = [
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
        ];
        modelValue = [items[1]];
        component = shallowMount(VcsList, {
          props: { items, modelValue, selectable: true },
        });
        component.vm.select(items[2], { ctrlKey: true });
      });

      afterAll(() => {
        component.unmount();
      });

      it('should emit a new value, with both items selected', () => {
        const { 'update:modelValue': input } = component.emitted();
        expect(input).to.be.ok;
        expect(input).have.lengthOf(1);
        expect(input[0]).to.be.an('array').and.have.lengthOf(1);
        expect(input[0][0]).to.be.an('array').and.have.lengthOf(2);
        expect(input[0][0]).not.to.equal(modelValue);
        expect(input[0][0][0]).to.have.property('name', items[1].name);
        expect(input[0][0][1]).to.have.property('name', items[2].name);
      });

      it('should call selectionChanged on the item', () => {
        expect(selectionChanged2).toHaveBeenCalledWith(true);
      });

      it('should not call selectionChanged on the other item', () => {
        expect(selectionChanged1).not.toHaveBeenCalled();
      });
    });

    describe('selecting an item, with another item selected and a single select list', () => {
      let component;
      let items;
      let modelValue;
      let selectionChanged1;
      let selectionChanged2;

      beforeAll(() => {
        selectionChanged1 = vi.fn();
        selectionChanged2 = vi.fn();
        items = [
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
        ];
        modelValue = [items[1]];
        component = shallowMount(VcsList, {
          props: {
            items,
            modelValue,
            selectable: true,
            singleSelect: true,
          },
        });
        component.vm.select(items[2], { ctrlKey: true });
      });

      afterAll(() => {
        component.unmount();
      });

      it('should emit a new value, with the new item selected', () => {
        const { 'update:modelValue': input } = component.emitted();
        expect(input).to.be.ok;
        expect(input).have.lengthOf(1);
        expect(input[0]).to.be.an('array').and.have.lengthOf(1);
        expect(input[0][0]).to.be.an('array').and.have.lengthOf(1);
        expect(input[0][0]).not.to.equal(modelValue);
        expect(input[0][0][0]).to.have.property('name', items[2].name);
      });

      it('should call selectionChanged on the item', () => {
        expect(selectionChanged2).toHaveBeenCalledWith(true);
      });

      it('should call selectionChanged on the other item', () => {
        expect(selectionChanged1).toHaveBeenCalledWith(false);
      });
    });

    describe('selecting an item, with the same item selected', () => {
      let component;
      let items;
      let modelValue;
      let selectionChanged;

      beforeAll(() => {
        selectionChanged = vi.fn();
        items = [
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
        modelValue = [items[1]];
        component = shallowMount(VcsList, {
          props: { items, modelValue, selectable: true },
        });
        component.vm.select(items[1], {});
      });

      afterAll(() => {
        component.unmount();
      });

      it('should emit a new value, without a selection', () => {
        const { 'update:modelValue': input } = component.emitted();
        expect(input).to.be.ok;
        expect(input).have.lengthOf(1);
        expect(input[0]).to.be.an('array').and.have.lengthOf(1);
        expect(input[0][0]).to.be.an('array').and.have.lengthOf(0);
      });

      it('should call selectionChanged on the other item', () => {
        expect(selectionChanged).toHaveBeenCalledWith(false);
      });
    });

    describe('selecting an item, with the same item & another item selected', () => {
      let component;
      let items;
      let modelValue;
      let selectionChanged1;
      let selectionChanged2;

      beforeAll(() => {
        selectionChanged1 = vi.fn();
        selectionChanged2 = vi.fn();
        items = [
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
        ];
        modelValue = [items[1], items[2]];
        component = shallowMount(VcsList, {
          props: { items, modelValue, selectable: true },
        });
        component.vm.select(items[2], { ctrlKey: true });
      });

      afterAll(() => {
        component.unmount();
      });

      it('should emit a new value, without the new value', () => {
        const { 'update:modelValue': input } = component.emitted();
        expect(input).to.be.ok;
        expect(input).have.lengthOf(1);
        expect(input[0]).to.be.an('array').and.have.lengthOf(1);
        expect(input[0][0]).to.be.an('array').and.have.lengthOf(1);
        expect(input[0][0]).not.to.equal(modelValue);
        expect(input[0][0][0]).to.have.property('name', items[1].name);
      });

      it('should call selectionChanged on the item', () => {
        expect(selectionChanged2).toHaveBeenCalledWith(false);
      });

      it('should not call selectionChanged on the other item', () => {
        expect(selectionChanged1).not.toHaveBeenCalled();
      });
    });
  });

  describe('selecting ranges with SHIFT', () => {
    describe('with no other item previously selected', () => {
      let component;
      let items;
      let modelValue;

      beforeAll(() => {
        items = [
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
        ];
        modelValue = [];
        component = shallowMount(VcsList, {
          props: { items, modelValue, selectable: true },
        });
        component.vm.select(items[2], { shiftKey: true });
      });

      afterAll(() => {
        component.unmount();
      });

      it('should emit a new value, selecting the range from 0', () => {
        const { 'update:modelValue': input } = component.emitted();
        expect(input).to.be.ok;
        expect(input).have.lengthOf(1);
        expect(input[0]).to.be.an('array').and.have.lengthOf(1);
        expect(input[0][0]).to.be.an('array').and.have.lengthOf(3);
        expect(input[0][0]).not.to.equal(modelValue);
        expect(input[0][0][0]).to.have.property('name', items[0].name);
        expect(input[0][0][1]).to.have.property('name', items[1].name);
        expect(input[0][0][2]).to.have.property('name', items[2].name);
      });

      it('should call selectionChanged on the new range', () => {
        items.slice(0, 2).forEach((i) => {
          expect(i.selectionChanged).toHaveBeenCalledWith(true);
        });
      });
    });

    describe('with no other item previously selected and an unselectable list', () => {
      let component;
      let items;
      let modelValue;

      beforeAll(() => {
        items = [
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
        ];
        modelValue = [];
        component = shallowMount(VcsList, {
          props: { items, modelValue, selectable: false },
        });
        component.vm.select(items[2], { shiftKey: true });
      });

      afterAll(() => {
        component.unmount();
      });

      it('should not emit a new value', () => {
        expect(component.emitted()).to.not.have.property('update:modelValue');
      });

      it('should not call selectionChanged on the new range', () => {
        items.forEach((i) => {
          expect(i.selectionChanged).not.toHaveBeenCalled();
        });
      });
    });

    describe('with another item selected', () => {
      let component;
      let items;
      let modelValue;

      beforeAll(() => {
        items = [
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
        ];
        modelValue = [];
        component = shallowMount(VcsList, {
          props: { items, modelValue, selectable: true },
        });
        component.vm.select(items[4], {});
        component.vm.select(items[2], { shiftKey: true });
      });

      afterAll(() => {
        component.unmount();
      });

      it('should emit a new value, selecting the range from the first selection', () => {
        const { 'update:modelValue': input } = component.emitted();
        expect(input).to.be.ok;
        expect(input).have.lengthOf(2);
        expect(input[1]).to.be.an('array').and.have.lengthOf(1);
        expect(input[1][0]).to.be.an('array').and.have.lengthOf(3);
        expect(input[1][0]).not.to.equal(modelValue);
        expect(input[1][0][0]).to.have.property('name', items[2].name);
        expect(input[1][0][1]).to.have.property('name', items[3].name);
        expect(input[1][0][2]).to.have.property('name', items[4].name);
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
      let component;
      let items;
      let modelValue;

      beforeAll(() => {
        items = [
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
        ];
        modelValue = [];
        component = shallowMount(VcsList, {
          props: { items, modelValue, selectable: true, singleSelect: true },
        });
        component.vm.select(items[4], {});
        component.vm.select(items[2], { shiftKey: true });
      });

      afterAll(() => {
        component.unmount();
      });

      it('should emit a new value, selecting the range from the first selection', () => {
        const { 'update:modelValue': input } = component.emitted();
        expect(input).to.be.ok;
        expect(input).have.lengthOf(2);
        expect(input[1]).to.be.an('array').and.have.lengthOf(1);
        expect(input[1][0]).to.be.an('array').and.have.lengthOf(1);
        expect(input[1][0]).not.to.equal(modelValue);
        expect(input[1][0][0]).to.have.property('name', items[2].name);
      });

      it('should call selectionChanged on the new range', () => {
        expect(items[4].selectionChanged).toHaveBeenCalledWith(false);
      });

      it('should not call selectionChanged on the first item again', () => {
        expect(items[2].selectionChanged).toHaveBeenCalledWith(true);
      });
    });

    describe('with another range selected', () => {
      let component;
      let items;
      let modelValue;

      beforeAll(() => {
        items = [
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
        ];
        modelValue = [];
        component = shallowMount(VcsList, {
          props: { items, modelValue, selectable: true },
        });
        component.vm.select(items[2], {});
        component.vm.select(items[0], { shiftKey: true });
        component.vm.select(items[4], { shiftKey: true });
      });

      afterAll(() => {
        component.unmount();
      });

      it('should emit a new value, selecting the range from the first selection', () => {
        const { 'update:modelValue': input } = component.emitted();
        expect(input).to.be.ok;
        expect(input).have.lengthOf(3);
        expect(input[2]).to.be.an('array').and.have.lengthOf(1);
        expect(input[2][0]).to.be.an('array').and.have.lengthOf(3);
        expect(input[2][0]).not.to.equal(modelValue);
        expect(input[2][0][0]).to.have.property('name', items[2].name);
        expect(input[2][0][1]).to.have.property('name', items[3].name);
        expect(input[2][0][2]).to.have.property('name', items[4].name);
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
      let component;
      let items;
      let modelValue;

      beforeAll(() => {
        items = [
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
        ];
        modelValue = [];
        component = shallowMount(VcsList, {
          props: { items, modelValue, selectable: true },
        });
        component.vm.select(items[2], {});
        component.vm.select(items[0], { ctrlKey: true });
        component.vm.select(items[4], { shiftKey: true });
      });

      afterAll(() => {
        component.unmount();
      });

      it('should emit a new value, selecting the range from the first selection', () => {
        const { 'update:modelValue': input } = component.emitted();
        expect(input).to.be.ok;
        expect(input).have.lengthOf(3);
        expect(input[2]).to.be.an('array').and.have.lengthOf(1);
        expect(input[2][0]).to.be.an('array').and.have.lengthOf(3);
        expect(input[2][0]).not.to.equal(modelValue);
        expect(input[2][0][0]).to.have.property('name', items[2].name);
        expect(input[2][0][1]).to.have.property('name', items[3].name);
        expect(input[2][0][2]).to.have.property('name', items[4].name);
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
      let component;
      let items;
      let modelValue;

      beforeAll(() => {
        items = [
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
        ];
        modelValue = [];
        component = shallowMount(VcsList, {
          props: { items, modelValue, selectable: true },
        });
        component.vm.select(items[2], { shiftKey: true });
      });

      afterAll(() => {
        component.unmount();
      });

      it('should emit a new value, selecting the range from 0', () => {
        const { 'update:modelValue': input } = component.emitted();
        expect(input).to.be.ok;
        expect(input).have.lengthOf(1);
        expect(input[0]).to.be.an('array').and.have.lengthOf(1);
        expect(input[0][0]).to.be.an('array').and.have.lengthOf(2);
        expect(input[0][0]).not.to.equal(modelValue);
        expect(input[0][0][0]).to.have.property('name', items[0].name);
        expect(input[0][0][1]).to.have.property('name', items[2].name);
      });

      it('should call selectionChanged on the new range', () => {
        expect(items[0].selectionChanged).toHaveBeenCalledWith(true);
        expect(items[2].selectionChanged).toHaveBeenCalledWith(true);
      });
    });
  });

  describe('clear selection', () => {
    let component;
    let items;
    let modelValue;
    let selectionChangedFoo;
    let selectionChangedBar;
    let selectionChangedBaz;

    beforeAll(() => {
      selectionChangedFoo = vi.fn();
      selectionChangedBar = vi.fn();
      selectionChangedBaz = vi.fn();
      items = [
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
      ];
      modelValue = items;
      component = shallowMount(VcsList, {
        props: { items, modelValue, selectable: true },
      });
      component.vm.clear();
    });

    afterAll(() => {
      component.unmount();
    });

    it('should emit a new value with empty selection', () => {
      const { 'update:modelValue': input } = component.emitted();
      expect(input).to.be.ok;
      expect(input).have.lengthOf(1);
      expect(input[0]).to.be.an('array').and.have.lengthOf(1);
      expect(input[0][0]).to.be.an('array').and.have.lengthOf(0);
      expect(input[0][0]).not.to.equal(modelValue);
    });

    it('should call selectionChanged on all items', () => {
      expect(selectionChangedFoo).toHaveBeenCalledWith(false);
      expect(selectionChangedBar).toHaveBeenCalledWith(false);
      expect(selectionChangedBaz).toHaveBeenCalledWith(false);
    });
  });

  describe('adding an item to a selection', () => {
    describe('if the item already is part of the selection', () => {
      let component;
      let items;
      let modelValue;
      let selectionChanged;

      beforeAll(() => {
        selectionChanged = vi.fn();
        items = [
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
        modelValue = [items[1]];
        component = shallowMount(VcsList, {
          props: { items, modelValue, selectable: true },
        });
        component.vm.add(items[1]);
      });

      afterAll(() => {
        component.unmount();
      });

      it('should not emit a new value', () => {
        expect(component.emitted()).to.not.have.property('update:modelValue');
      });

      it('should not call selectionChanged on the item', () => {
        expect(selectionChanged).not.toHaveBeenCalled();
      });
    });

    describe('without a current selection', () => {
      let component;
      let items;
      let modelValue;
      let selectionChanged;

      beforeAll(() => {
        selectionChanged = vi.fn();
        items = [
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
        modelValue = [];
        component = shallowMount(VcsList, {
          props: { items, modelValue, selectable: true },
        });
        component.vm.add(items[1]);
      });

      afterAll(() => {
        component.unmount();
      });

      it('should emit a new value, with the new item selected', () => {
        const { 'update:modelValue': input } = component.emitted();
        expect(input).to.be.ok;
        expect(input).have.lengthOf(1);
        expect(input[0]).to.be.an('array').and.have.lengthOf(1);
        expect(input[0][0]).to.be.an('array').and.have.lengthOf(1);
        expect(input[0][0]).not.to.equal(modelValue);
        expect(input[0][0][0]).to.have.property('name', items[1].name);
      });

      it('should call selectionChanged on the item', () => {
        expect(selectionChanged).toHaveBeenCalledWith(true);
      });
    });

    describe('with another item selected', () => {
      let component;
      let items;
      let modelValue;
      let selectionChanged1;
      let selectionChanged2;

      beforeAll(() => {
        selectionChanged1 = vi.fn();
        selectionChanged2 = vi.fn();
        items = [
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
        ];
        modelValue = [items[1]];
        component = shallowMount(VcsList, {
          props: { items, modelValue, selectable: true },
        });
        component.vm.add(items[2]);
      });

      afterAll(() => {
        component.unmount();
      });

      it('should emit a new value, with both items selected', () => {
        const { 'update:modelValue': input } = component.emitted();
        expect(input).to.be.ok;
        expect(input).have.lengthOf(1);
        expect(input[0]).to.be.an('array').and.have.lengthOf(1);
        expect(input[0][0]).to.be.an('array').and.have.lengthOf(2);
        expect(input[0][0]).not.to.equal(modelValue);
        expect(input[0][0][0]).to.have.property('name', items[1].name);
        expect(input[0][0][1]).to.have.property('name', items[2].name);
      });

      it('should call selectionChanged on the item', () => {
        expect(selectionChanged2).toHaveBeenCalledWith(true);
      });

      it('should not call selectionChanged on the other item', () => {
        expect(selectionChanged1).not.toHaveBeenCalled();
      });
    });
  });

  describe('removing an item from the selection', () => {
    describe('if the item is not part of the selection', () => {
      let component;
      let items;
      let value;
      let selectionChanged;

      beforeAll(() => {
        selectionChanged = vi.fn();
        items = [
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
        value = [];
        component = shallowMount(VcsList, {
          props: { items, value, selectable: true },
        });
        component.vm.remove(items[1]);
      });

      afterAll(() => {
        component.unmount();
      });

      it('should not emit a new value', () => {
        expect(component.emitted()).to.not.have.property('update:modelValue');
      });

      it('should not call selectionChanged on the item', () => {
        expect(selectionChanged).not.toHaveBeenCalled();
      });
    });

    describe('with the item as part of the current selection', () => {
      let component;
      let items;
      let modelValue;
      let selectionChanged;

      beforeAll(() => {
        selectionChanged = vi.fn();
        items = [
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
        modelValue = [items[1]];
        component = shallowMount(VcsList, {
          props: { items, modelValue, selectable: true },
        });
        component.vm.remove(items[1]);
      });

      afterAll(() => {
        component.unmount();
      });

      it('should emit a new value, with the new item selected', () => {
        const { 'update:modelValue': input } = component.emitted();
        expect(input).to.be.ok;
        expect(input).have.lengthOf(1);
        expect(input[0]).to.be.an('array').and.have.lengthOf(1);
        expect(input[0][0]).to.be.an('array').and.to.be.empty;
      });

      it('should call selectionChanged on the item', () => {
        expect(selectionChanged).toHaveBeenCalledWith(false);
      });
    });

    describe('with the item as part of the current selection and another item selected', () => {
      let component;
      let items;
      let modelValue;
      let selectionChanged1;
      let selectionChanged2;

      beforeAll(() => {
        selectionChanged1 = vi.fn();
        selectionChanged2 = vi.fn();
        items = [
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
        ];
        modelValue = [items[1], items[2]];
        component = shallowMount(VcsList, {
          props: { items, modelValue, selectable: true },
        });
        component.vm.remove(items[2]);
      });

      afterAll(() => {
        component.unmount();
      });

      it('should emit a new value, with both items selected', () => {
        const { 'update:modelValue': input } = component.emitted();
        expect(input).to.be.ok;
        expect(input).have.lengthOf(1);
        expect(input[0]).to.be.an('array').and.have.lengthOf(1);
        expect(input[0][0]).to.be.an('array').and.have.lengthOf(1);
        expect(input[0][0]).not.to.equal(modelValue);
        expect(input[0][0][0]).to.have.property('name', items[1].name);
      });

      it('should call selectionChanged on the item', () => {
        expect(selectionChanged2).toHaveBeenCalledWith(false);
      });

      it('should not call selectionChanged on the other item', () => {
        expect(selectionChanged1).not.toHaveBeenCalled();
      });
    });
  });

  describe('items which are rendered', () => {
    let items;
    let component;

    beforeEach(() => {
      items = [
        {
          name: 'foo',
          title: 'foo',
        },
        {
          name: 'bar',
          title: 'bar',
        },
        {
          name: 'baz',
          title: 'baz',
          visible: true,
        },
        {
          name: 'foobar',
          title: 'foobar',
        },
        {
          name: 'foobaz',
          title: 'foobaz',
        },
      ];
      const vueI18n = createVueI18n();
      const safeI18n = createSafeI18n();
      component = shallowMount(VcsList, {
        props: { items },
        global: {
          plugins: [vueI18n, safeI18n],
        },
      });
    });

    afterEach(() => {
      component.unmount();
    });

    it('should not render invisible items', () => {
      items[2].visible = false;
      component.setProps({ items: items.map((i) => ({ ...i })) });
      expect(component.vm.renderingItems.map(toRaw)).to.not.include(items[2]);
    });

    it('should only rendered queried items', () => {
      component.vm.query = 'foo';
      expect(component.vm.renderingItems.map(toRaw)).to.have.members([
        items[0],
        items[3],
        items[4],
      ]);
    });
  });
});
