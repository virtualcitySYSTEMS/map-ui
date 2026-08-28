import { check } from '@vcsuite/check';
import type UiConfig from './uiConfig.js';
import type { UiConfigurationItem } from './uiConfig.js';
import { isUiConfigurationItem } from './uiConfig.js';

function setFavicon(src: string): void {
  check(src, String);

  const link = document.createElement('link');
  link.className = 'vcs-favicon';
  const oldLinks = document.getElementsByClassName('vcs-favicon');
  const toRemove = [];
  for (let i = 0; i < oldLinks.length; i++) {
    toRemove.push(oldLinks.item(i));
  }
  toRemove.forEach((elem) => {
    document.head.removeChild(elem!);
  });
  link.id = 'dynamic-favicon';
  link.rel = 'shortcut icon';
  link.href = src;
  document.head.appendChild(link);
}

function setHeaderTitle(title: string): void {
  const titleElement = document.createElement('title');
  titleElement.innerText = title;
  const oldTitle = document.getElementsByTagName('title').item(0);
  if (oldTitle) {
    document.head.removeChild(oldTitle);
  }
  document.head.appendChild(titleElement);
}

const defaultFavicon = './assets/favicon-4c4ce5df.svg';

const defaultHeaderTitle = 'VC Map';

/**
 * @param {import("./uiConfig.js").default} uiConfig
 * @returns {() => void}
 */
export default function createSiteConfig(uiConfig: UiConfig): () => void {
  if (typeof uiConfig.config.favicon === 'string') {
    setFavicon(uiConfig.config.favicon);
  }

  if (typeof uiConfig.config.headerTitle === 'string') {
    setHeaderTitle(uiConfig.config.headerTitle);
  }

  const updateFavicon = (): void => {
    if (typeof uiConfig.config.favicon === 'string') {
      setFavicon(uiConfig.config.favicon);
    } else {
      setFavicon(defaultFavicon);
    }
  };

  const updateHeaderTitle = (): void => {
    if (typeof uiConfig.config.headerTitle === 'string') {
      setHeaderTitle(uiConfig.config.headerTitle);
    } else {
      setHeaderTitle(defaultHeaderTitle);
    }
  };

  const updateSiteConfig = (item: UiConfigurationItem<unknown>): void => {
    if (isUiConfigurationItem(item, 'favicon')) {
      updateFavicon();
    } else if (isUiConfigurationItem(item, 'headerTitle')) {
      updateHeaderTitle();
    }
  };

  const listeners = [
    uiConfig.added.addEventListener(updateSiteConfig),
    uiConfig.removed.addEventListener(updateSiteConfig),
  ];

  return () => {
    listeners.forEach((cb) => {
      cb();
    });
  };
}
