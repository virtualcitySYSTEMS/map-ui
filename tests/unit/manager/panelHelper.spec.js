import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { setupMapTarget } from '../../helpers.js';
import { getTargetSize } from '../../../src/manager/window/windowHelper.js';
import PanelManager, {
  getPanelPosition,
  PanelLocation,
} from '../../../src/manager/panel/panelManager.js';
import {
  percentageFromPanelOptions,
  posToRelativeTarget,
  updatePanelSizes,
} from '../../../src/manager/panel/panelHelper.js';
import { createMainPanel } from '../../../src/manager/panel/PanelManagerComponent.vue';

const targetRect = {
  top: 20,
  left: 10,
  width: 2000,
  height: 1000,
  bottom: 0,
  right: 0,
};

describe('panelHelper', () => {
  let target;
  let targetSize;
  let destroy;

  beforeAll(async () => {
    ({ target, destroy } = setupMapTarget(targetRect));
    targetSize = getTargetSize(target);
  });

  afterAll(() => destroy());

  describe('parsing position to numeric percentage values', () => {
    it('should parse pixel values', () => {
      const top = posToRelativeTarget('1px', 'top', targetSize);
      expect(top).to.equal(0.1);
    });
    it('should round floating pixel to integer', () => {
      const top = posToRelativeTarget('1.1px', 'top', targetSize);
      expect(top).to.equal(0.1);
    });
    it('should parse percent values', () => {
      const left = posToRelativeTarget('25%', 'left', targetSize);
      const top = posToRelativeTarget('-25%', 'top', targetSize);
      expect(left).to.equal(25);
      expect(top).to.equal(-25);
    });
    it('should return undefined for non numeric values', () => {
      const top = posToRelativeTarget('unset', 'top', targetSize);
      expect(top).to.equal(undefined);
    });
    it('should parse PanelPosition to numeric percentage values', () => {
      const parsedPosition = percentageFromPanelOptions(
        {
          top: '0px',
          left: '0px',
          right: 'unset',
          bottom: '20px',
          width: '50%',
          height: 'auto',
        },
        targetSize,
      );
      expect(parsedPosition).to.have.property('top', 0);
      expect(parsedPosition).to.have.property('left', 0);
      expect(parsedPosition).to.have.property('right', undefined);
      expect(parsedPosition).to.have.property('bottom', 2);
      expect(parsedPosition).to.have.property('width', 50);
      expect(parsedPosition).to.have.property('height', undefined);
    });
  });

  describe('Updating panel sizes', () => {
    describe('when no other panel is registered', () => {
      let panelManager;
      let main;

      beforeAll(() => {
        panelManager = new PanelManager();
        main = createMainPanel();
      });

      afterAll(() => {
        panelManager.destroy();
      });

      it('should not update MAIN', () => {
        const mainPosition = { ...getPanelPosition(main) };
        updatePanelSizes(panelManager, main, targetSize);
        expect(mainPosition).to.deep.equal(getPanelPosition(main));
      });
    });

    describe('when LEFT panel is registered', () => {
      let panelManager;
      let main;
      let left;

      beforeAll(() => {
        panelManager = new PanelManager();
        main = createMainPanel();
        left = panelManager.add({}, 'owner', PanelLocation.LEFT);
      });

      afterAll(() => {
        panelManager.destroy();
      });

      it('should update MAIN left according to LEFT width', () => {
        updatePanelSizes(panelManager, main, targetSize);
        expect(getPanelPosition(main)).to.have.property(
          'left',
          getPanelPosition(left).width,
        );
      });
      it('should update MAIN width', () => {
        updatePanelSizes(panelManager, main, targetSize);
        const newWidth =
          100 -
          posToRelativeTarget(
            getPanelPosition(left).width,
            'width',
            targetSize,
          );
        expect(getPanelPosition(main)).to.have.property(
          'width',
          `${newWidth}%`,
        );
      });
    });

    describe('when RIGHT panel is registered', () => {
      let panelManager;
      let main;
      let right;

      beforeAll(() => {
        panelManager = new PanelManager();
        main = createMainPanel();
        right = panelManager.add({}, 'owner', PanelLocation.RIGHT);
      });

      afterAll(() => {
        panelManager.destroy();
      });

      it('should update MAIN left according to RIGHT width', () => {
        updatePanelSizes(panelManager, main, targetSize);
        expect(getPanelPosition(main)).to.have.property(
          'right',
          getPanelPosition(right).width,
        );
      });
      it('should update MAIN width', () => {
        updatePanelSizes(panelManager, main, targetSize);
        const newWidth =
          100 -
          posToRelativeTarget(
            getPanelPosition(right).width,
            'width',
            targetSize,
          );
        expect(getPanelPosition(main)).to.have.property(
          'width',
          `${newWidth}%`,
        );
      });
    });

    describe('when BOTTOM panel is registered', () => {
      let panelManager;
      let main;
      let bottom;

      beforeAll(() => {
        panelManager = new PanelManager();
        main = createMainPanel();
        bottom = panelManager.add({}, 'owner', PanelLocation.BOTTOM);
      });

      afterAll(() => {
        panelManager.destroy();
      });

      it('should update MAIN bottom according to BOTTOM height', () => {
        updatePanelSizes(panelManager, main, targetSize);
        expect(getPanelPosition(main)).to.have.property(
          'bottom',
          getPanelPosition(bottom).height,
        );
      });
    });

    describe('when side and bottom panels are registered', () => {
      let panelManager;
      let main;
      let left;
      let right;
      let bottom;

      beforeAll(() => {
        panelManager = new PanelManager();
        main = createMainPanel();
        left = panelManager.add({}, 'owner', PanelLocation.LEFT);
        right = panelManager.add({}, 'owner', PanelLocation.RIGHT);
        bottom = panelManager.add({}, 'owner', PanelLocation.BOTTOM);
      });

      afterAll(() => {
        panelManager.destroy();
      });

      it('should update left panel height according to BOTTOM height', () => {
        updatePanelSizes(panelManager, main, targetSize);
        const newHeight =
          100 -
          posToRelativeTarget(
            getPanelPosition(bottom).height,
            'height',
            targetSize,
          );
        expect(getPanelPosition(left)).to.have.property(
          'height',
          `${newHeight}%`,
        );
      });
      it('should update right panel height according to BOTTOM height', () => {
        updatePanelSizes(panelManager, main, targetSize);
        const newHeight =
          100 -
          posToRelativeTarget(
            getPanelPosition(bottom).height,
            'height',
            targetSize,
          );
        expect(getPanelPosition(right)).to.have.property(
          'height',
          `${newHeight}%`,
        );
      });
    });

    describe('handle side panel cached position', () => {
      let panelManager;
      let main;
      let left;
      let right;

      beforeAll(() => {
        panelManager = new PanelManager();
        main = createMainPanel();
      });

      afterAll(() => {
        panelManager.destroy();
      });

      it('should split max width on re-adding, when sum of both panels exceed 90% and both panels exceed 45%', () => {
        left = panelManager.add(
          { position: { width: '90%' } },
          'owner',
          PanelLocation.LEFT,
        );
        panelManager.remove(left.id);
        right = panelManager.add(
          { position: { width: '90%' } },
          'owner',
          PanelLocation.RIGHT,
        );
        left = panelManager.add(left, 'owner', PanelLocation.LEFT);
        updatePanelSizes(panelManager, main, targetSize);

        expect(getPanelPosition(left)).to.have.property('width', `45%`);
        expect(getPanelPosition(right)).to.have.property('width', `45%`);
      });

      it('should adapt width on re-adding, when sum of both panels exceed 90% and left panel exceeds 45%', () => {
        left = panelManager.add(
          { position: { width: '90%' } },
          'owner',
          PanelLocation.LEFT,
        );
        panelManager.remove(left.id);
        right = panelManager.add(
          { position: { width: '30%' } },
          'owner',
          PanelLocation.RIGHT,
        );
        left = panelManager.add(left, 'owner', PanelLocation.LEFT);
        updatePanelSizes(panelManager, main, targetSize);

        expect(getPanelPosition(left)).to.have.property('width', `60%`);
        expect(getPanelPosition(right)).to.have.property('width', `30%`);
      });

      it('should adapt width on re-adding, when sum of both panels exceed 90% and right panel exceeds 45%', () => {
        right = panelManager.add(
          { position: { width: '74%' } },
          'owner',
          PanelLocation.RIGHT,
        );
        panelManager.remove(right.id);
        left = panelManager.add(
          { position: { width: '20%' } },
          'owner',
          PanelLocation.LEFT,
        );
        right = panelManager.add(right, 'owner', PanelLocation.RIGHT);
        updatePanelSizes(panelManager, main, targetSize);

        expect(getPanelPosition(left)).to.have.property('width', `20%`);
        expect(getPanelPosition(right)).to.have.property('width', `70%`);
      });
    });
  });
});
