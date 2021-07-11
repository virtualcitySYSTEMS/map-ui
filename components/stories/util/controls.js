import { units } from '@vcsuite/uicomponents/FormattedNumber.vue';
import { IconNames } from '@vcsuite/uicomponents/icons/+all';

export const iconControl = {
  type: 'select',
  options: [
    ...IconNames,
  ],
};

export const elevationControl = {
  type: 'range',
  min: 0,
  max: 9,
  step: 1,
};

export const rotationControlRegular = {
  type: 'range',
  min: 0,
  max: 360,
  step: 1,
};

export const rotationControlOblique = {
  type: 'range',
  min: 0,
  max: 270,
  step: 90,
};

export const formattedNumberUnitControl = {
  type: 'select',
  options: units,
};
