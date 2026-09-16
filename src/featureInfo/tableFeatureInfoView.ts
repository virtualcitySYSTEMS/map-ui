import { parseBoolean } from '@vcsuite/parsers';
import type { EventFeature, Layer } from '@vcmap/core';
import AbstractFeatureInfoView, {
  type FeatureInfoProps,
  type FeatureInfoViewOptions,
} from './abstractFeatureInfoView.js';
import VcsTable from '../components/tables/VcsTable.ts.vue';
import type { FeatureInfoEvent } from './featureInfo.js';

type TableFeatureInfoViewOptions = FeatureInfoViewOptions & {
  /** default has to be one of itemsPerPageArray */
  itemsPerPage?: number;
  /** defaults to [5, 10, 15] */
  itemsPerPageArray?: number[];
  showSearchbar?: boolean;
  searchbarPlaceholder?: string;
};

type TableFeatureInfoViewProps = FeatureInfoProps & {
  itemsPerPage?: number;
  itemsPerPageArray?: number[];
  showSearchbar?: boolean;
  searchbarPlaceholder?: string;
};

/**
 * @description A table view for feature attributes
 */
class TableFeatureInfoView extends AbstractFeatureInfoView<TableFeatureInfoViewProps> {
  static get className(): string {
    return 'TableFeatureInfoView';
  }

  static getDefaultOptions(): TableFeatureInfoViewOptions {
    return {
      ...AbstractFeatureInfoView.getDefaultOptions(),
      itemsPerPageArray: [5, 10, 15],
      itemsPerPage: 10,
      showSearchbar: true,
    };
  }

  itemsPerPageArray: number[];
  itemsPerPage: number;
  showSearchbar: boolean;
  searchbarPlaceholder?: string;

  constructor(options: TableFeatureInfoViewOptions) {
    super(options, VcsTable);
    const defaultOptions = TableFeatureInfoView.getDefaultOptions();

    this.itemsPerPageArray =
      options.itemsPerPageArray || defaultOptions.itemsPerPageArray!;
    const itemsPerPage = options.itemsPerPage || defaultOptions.itemsPerPage!;
    this.itemsPerPage = this.itemsPerPageArray.includes(itemsPerPage)
      ? itemsPerPage
      : this.itemsPerPageArray[0];
    this.showSearchbar = parseBoolean(
      options.showSearchbar,
      defaultOptions.showSearchbar,
    );
    this.searchbarPlaceholder = options.searchbarPlaceholder;
  }

  protected _getAttributesFromFeature(
    feature: EventFeature,
  ): Record<string, unknown> {
    const attributes = super._getAttributesFromFeature(feature);
    return {
      ...attributes,
      featureId: feature.getId(),
    };
  }

  getProperties(
    featureInfo: FeatureInfoEvent,
    layer: Layer,
  ): TableFeatureInfoViewProps {
    const properties = super.getProperties(featureInfo, layer);
    return {
      ...properties,
      itemsPerPage: this.itemsPerPage,
      itemsPerPageArray: this.itemsPerPageArray,
      showSearchbar: this.showSearchbar,
      searchbarPlaceholder: this.searchbarPlaceholder,
    };
  }

  toJSON(
    defaultOptions: TableFeatureInfoViewOptions = TableFeatureInfoView.getDefaultOptions(),
  ): TableFeatureInfoViewOptions {
    const config = super.toJSON(defaultOptions) as TableFeatureInfoViewOptions;
    if (
      this.itemsPerPageArray.length !==
        defaultOptions.itemsPerPageArray!.length ||
      this.itemsPerPageArray.some(
        (e, idx) => e !== defaultOptions.itemsPerPageArray![idx],
      )
    ) {
      config.itemsPerPageArray = this.itemsPerPageArray;
    }
    if (this.itemsPerPage !== defaultOptions.itemsPerPage) {
      config.itemsPerPage = this.itemsPerPage;
    }
    if (this.showSearchbar !== defaultOptions.showSearchbar) {
      config.showSearchbar = this.showSearchbar;
    }
    if (this.searchbarPlaceholder) {
      config.searchbarPlaceholder = this.searchbarPlaceholder;
    }
    return config;
  }
}

export default TableFeatureInfoView;
