import { createLocalVue, mount } from '@vue/test-utils';
import { expect } from 'chai';
import sinon from 'sinon';
import Compass from '../../components/Compass.vue';

const chai = require('chai');
const spies = require('chai-spies');

chai.use(spies);

const localVue = createLocalVue();


describe('Compass', () => {
  describe('trackMouse', () => {
    describe('when viewMode is oblique', () => {
      it('should emit 90 if position clicked is within 45 and 134 deg', () => {
        const wrapper = mount(Compass, {
          localVue,
          propsData: {
            viewMode: 'oblique',
          },
        });
        const spy = sinon.spy(wrapper.vm, '$emit');
        const fake = sinon.fake.returns(46);
        sinon.replace(wrapper.vm, 'mouseAngle', fake);
        wrapper.vm.trackMouse(new Event('click'));

        expect(spy.calledWith('input', 90)).to.equal(true);
      });

      it('should emit 180 if position clicked is within 135 and 224 deg', () => {
        const wrapper = mount(Compass, {
          localVue,
          propsData: {
            viewMode: 'oblique',
          },
        });
        const spy = sinon.spy(wrapper.vm, '$emit');
        const fake = sinon.fake.returns(136);
        sinon.replace(wrapper.vm, 'mouseAngle', fake);
        wrapper.vm.trackMouse(new Event('click'));

        expect(spy.calledWith('input', 180)).to.equal(true);
      });

      it('should emit 270 if position clicked is within 225 and 314 deg', () => {
        const wrapper = mount(Compass, {
          localVue,
          propsData: {
            viewMode: 'oblique',
          },
        });
        const spy = sinon.spy(wrapper.vm, '$emit');
        const fake = sinon.fake.returns(226);
        sinon.replace(wrapper.vm, 'mouseAngle', fake);
        wrapper.vm.trackMouse(new Event('click'));

        expect(spy.calledWith('input', 270)).to.equal(true);
      });

      it('should emit 0 if position clicked is below 45', () => {
        const wrapper = mount(Compass, {
          localVue,
          propsData: {
            viewMode: 'oblique',
          },
        });
        const spy = sinon.spy(wrapper.vm, '$emit');
        const fake = sinon.fake.returns(42);
        sinon.replace(wrapper.vm, 'mouseAngle', fake);
        wrapper.vm.trackMouse(new Event('click'));

        expect(spy.calledWith('input', 0)).to.equal(true);
      });

      it('should emit 0 if position clicked is above 314', () => {
        const wrapper = mount(Compass, {
          localVue,
          propsData: {
            viewMode: 'oblique',
          },
        });
        const spy = sinon.spy(wrapper.vm, '$emit');
        const fake = sinon.fake.returns(315);
        sinon.replace(wrapper.vm, 'mouseAngle', fake);
        wrapper.vm.trackMouse(new Event('click'));

        expect(spy.calledWith('input', 0)).to.equal(true);
      });
    });
    describe('when viewMode is not oblique', () => {
      it('should emit a value when the mouse moves', () => {
        const wrapper = mount(Compass, {
          localVue,
        });

        const spy = sinon.spy(wrapper.vm, '$emit');

        wrapper.vm.trackMouse(new Event('click'));
        expect(spy.called).to.eq(true);
      });

      it('should set \'grabbing\' to true when subscription starts', () => {
        const wrapper = mount(Compass, {
          localVue,
        });

        wrapper.vm.trackMouse(new Event('click'));

        expect(wrapper.vm.grabbing).to.eq(true);
      });

      it('should set \'grabbing\' to false when subscription ends', () => {
        const wrapper = mount(Compass, {
          localVue,
        });

        wrapper.vm.trackMouse(new Event('click'));
        document.body.dispatchEvent(new Event('mouseup'));

        expect(wrapper.vm.grabbing).to.eq(false);
      });
    });
  });
});
