import { type EventFeature } from '@vcmap/core';
import BalloonFeatureInfoView, {
  type BalloonFeatureInfoViewOptions,
  extractNestedKey,
} from './balloonFeatureInfoView.js';
import AddressBalloonComponent from './AddressBalloonComponent.ts.vue';

type AddressBalloonFeatureInfoViewOptions = BalloonFeatureInfoViewOptions & {
  /** key to evaluate for name. Use null to suppress. Default is 'gml:name' */
  addressName?: string | null;
  /** key to evaluate for street. Use null to suppress. Default is 'Address.Street' */
  street?: string | null;
  /** key to evaluate for house number. Use null to suppress. Default is 'Address.HouseNumber' */
  number?: string | null;
  /** key to evaluate for city. Use null to suppress. Default is 'Address.City' */
  city?: string | null;
  /** key to evaluate for zip code. Use null to suppress. Default is 'Address.ZipCode' */
  zip?: string | null;
  /** key to evaluate for country. Use null to suppress. Default is 'Address.Country' */
  country?: string | null;
};

function getAddressBalloonFeatureInfoViewDefaultOptions(): AddressBalloonFeatureInfoViewOptions {
  return {
    addressName: 'gml:name',
    street: 'Address.Street',
    number: 'Address.HouseNumber',
    city: 'Address.City',
    zip: 'Address.ZipCode',
    country: 'Address.Country',
  };
}

/**
 * @description An balloon view.
 */
class AddressBalloonFeatureInfoView extends BalloonFeatureInfoView {
  static get className(): string {
    return 'AddressBalloonFeatureInfoView';
  }

  static getDefaultOptions(): AddressBalloonFeatureInfoViewOptions {
    return {
      ...BalloonFeatureInfoView.getDefaultOptions(),
      ...getAddressBalloonFeatureInfoViewDefaultOptions(),
    };
  }

  addressName: string | null;
  street: string | null;
  number: string | null;
  city: string | null;
  zip: string | null;
  country: string | null;

  constructor(options: AddressBalloonFeatureInfoViewOptions) {
    super(options, AddressBalloonComponent);
    const defaultOptions = AddressBalloonFeatureInfoView.getDefaultOptions();

    this.addressName =
      options.addressName !== undefined
        ? options.addressName
        : defaultOptions.addressName!;
    this.street =
      options.street !== undefined ? options.street : defaultOptions.street!;
    this.number =
      options.number !== undefined ? options.number : defaultOptions.number!;
    this.city =
      options.city !== undefined ? options.city : defaultOptions.city!;
    this.zip = options.zip !== undefined ? options.zip : defaultOptions.zip!;
    this.country =
      options.country !== undefined ? options.country : defaultOptions.country!;
  }

  /**
   * derives address attributes from addressKeys
   */
  getAttributes(feature: EventFeature): Record<string, unknown> {
    const attributes = super.getAttributes(feature);
    const obj: Record<string, unknown> = {};
    const applyAddressKeys = (key: string): void => {
      // @ts-expect-error accessing dynamic key on this class
      if (this[key]) {
        // @ts-expect-error accessing dynamic key on this class
        const derivedValue = extractNestedKey(this[key], attributes);
        if (derivedValue) {
          obj[key] = derivedValue;
        }
      }
    };
    Object.keys(getAddressBalloonFeatureInfoViewDefaultOptions()).forEach(
      applyAddressKeys,
    );
    return obj;
  }

  /**
   * @param {AddressBalloonFeatureInfoViewOptions} defaultOptions
   * @returns {AddressBalloonFeatureInfoViewOptions}
   */
  toJSON(
    defaultOptions: AddressBalloonFeatureInfoViewOptions = AddressBalloonFeatureInfoView.getDefaultOptions(),
  ): AddressBalloonFeatureInfoViewOptions {
    const config = super.toJSON(
      defaultOptions,
    ) as AddressBalloonFeatureInfoViewOptions;
    if (this.addressName !== defaultOptions.addressName) {
      config.addressName = this.addressName;
    }
    if (this.street !== defaultOptions.street) {
      config.street = this.street;
    }
    if (this.number !== defaultOptions.number) {
      config.number = this.number;
    }
    if (this.city !== defaultOptions.city) {
      config.city = this.city;
    }
    if (this.zip !== defaultOptions.zip) {
      config.zip = this.zip;
    }
    if (this.country !== defaultOptions.country) {
      config.country = this.country;
    }
    return config;
  }
}

export default AddressBalloonFeatureInfoView;
