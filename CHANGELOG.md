# 5.0.0-rc.next
- Added new I18n concept, see [I18n](documentation/INTERNATIONALIZATION.md).
- Redesigned VcsApp.vue setup to export `setupPluginMountedListeners` & `setupMapNavbar`
- Consistent plugin handling: removal from managers & i18n is managed by the VcsUiApp and not the VcsApp.vue
