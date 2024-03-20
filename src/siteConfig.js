import { check } from '@vcsuite/check';

/**
 * @param {string} src
 */
function setFavicon(src) {
  check(src, String);

  const link = document.createElement('link');
  link.className = 'vcs-favicon';
  const oldLinks = document.getElementsByClassName('vcs-favicon');
  const toRemove = [];
  for (let i = 0; i < oldLinks.length; i++) {
    toRemove.push(oldLinks.item(i));
  }
  toRemove.forEach((elem) => {
    document.head.removeChild(elem);
  });
  link.id = 'dynamic-favicon';
  link.rel = 'shortcut icon';
  link.href = src;
  document.head.appendChild(link);
}

/**
 * @param {string} title
 */
function setHeaderTitle(title) {
  const titleElement = document.createElement('title');
  titleElement.innerText = title;
  const oldTitle = document.getElementsByTagName('title').item(0);
  if (oldTitle) {
    document.head.removeChild(oldTitle);
  }
  document.head.appendChild(titleElement);
}

const defaultFavicon = './assets/favicon.svg';

const defaultHeaderTitle = 'VC Map';

/**
 * @param {import("./uiConfig.js").default} uiConfig
 * @returns {() => void}
 */
export default function createSiteConfig(uiConfig) {
  if (typeof uiConfig.config.value.favicon === 'string') {
    setFavicon(uiConfig.config.value.favicon);
  }

  if (typeof uiConfig.config.value.headerTitle === 'string') {
    setHeaderTitle(uiConfig.config.value.headerTitle);
  }

  const updateFavicon = () => {
    if (typeof uiConfig.config.value.favicon === 'string') {
      setFavicon(uiConfig.config.value.favicon);
    } else {
      setFavicon(defaultFavicon);
    }
  };

  const updateHeaderTitle = () => {
    if (typeof uiConfig.config.value.headerTitle === 'string') {
      setHeaderTitle(uiConfig.config.value.headerTitle);
    } else {
      setHeaderTitle(defaultHeaderTitle);
    }
  };

  const listeners = [
    uiConfig.added.addEventListener(({ name }) => {
      if (name === 'favicon') {
        updateFavicon();
      } else if (name === 'headerTitle') {
        updateHeaderTitle();
      }
    }),
    uiConfig.removed.addEventListener(({ name }) => {
      if (name === 'favicon') {
        updateFavicon();
      } else if (name === 'headerTitle') {
        updateHeaderTitle();
      }
    }),
  ];

  return () => {
    listeners.forEach((cb) => {
      cb();
    });
  };
}
