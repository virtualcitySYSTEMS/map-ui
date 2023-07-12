import {
  ButtonLocation,
  NotificationType,
  setStateToUrl,
  WindowSlot,
} from '@vcmap/ui';
import FallbackCreateLink from './fallbackCreateLink.vue';

const name = '@vcmap/create-link';
const fallBackWindowId = 'create-link-fallback-window';
function createFallbackWindow(app, link) {
  app.windowManager.remove(fallBackWindowId);
  app.windowManager.add(
    {
      id: fallBackWindowId,
      component: FallbackCreateLink,
      slot: WindowSlot.DYNAMIC_RIGHT,
      state: {
        headerTitle: 'createLink.windowTitle',
        headerIcon: 'mdi-share-variant',
      },
      props: {
        link,
      },
    },
    name,
  );
}

export default function createLink() {
  return {
    name,
    version: '1.0.0',
    i18n: {
      de: {
        createLink: {
          title: 'Link kopieren',
          windowTitle: 'Anwendungslink',
          tooltip: 'Dialog zum Kopieren des Anwendungslinks anzeigen',
          copyToClipboard: 'Anwendungslinks in Zwischenablage kopieren',
          refreshTooltip: 'Anwendungslinks aktualisieren',
          copied: 'Der Anwendungslink in wurde in die Zwischenablage kopiert.',
        },
      },
      en: {
        createLink: {
          title: 'Copy link',
          windowTitle: 'Application link',
          tooltip: 'Open dialog to copy application link to clipboard',
          copyToClipboard: 'Copy application link to clipboard',
          refreshTooltip: 'Refresh application link',
          copied: 'Application link copied to clipboard.',
        },
      },
    },
    /**
     * @param {VcsUiApp} app
     */
    initialize(app) {
      const title = navigator.clipboard
        ? 'createLink.copyToClipboard'
        : 'createLink.tooltip';

      app.navbarManager.add(
        {
          action: {
            name: 'createLink.title',
            title,
            icon: 'mdi-share-variant',
            /**
             * @returns {Promise<void>}
             */
            async callback() {
              const state = await app.getState(true);
              const url = new URL(window.location.href);
              setStateToUrl(state, url);
              if (navigator.clipboard) {
                await navigator.clipboard.writeText(url.toString());
                app.notifier.add({
                  title: 'createLink.title',
                  message: 'createLink.copied',
                  type: NotificationType.SUCCESS,
                });
              } else {
                createFallbackWindow(app, url.toString());
              }
            },
          },
        },
        name,
        ButtonLocation.SHARE,
      );
    },
  };
}
