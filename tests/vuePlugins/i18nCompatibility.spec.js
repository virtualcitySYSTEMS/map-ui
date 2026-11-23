import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, nextTick } from 'vue';
import VcsUiApp from '../../src/vcsUiApp.ts';

/**
 * Messages taken (verbatim) from plugins in the vcmap ecosystem. They pin down the
 * i18n behaviour plugins rely on, so a replacement of vue-i18n has to keep these tests green.
 */
const pluginMessages = {
  name: 'pluginMessages',
  en: {
    // shadowmap
    shadowMap: {
      areaTooLarge:
        'The selected area is too large. Please select an area smaller than {maxArea} m².',
      timesExpressedIn: 'times expressed in {timezone} time (GMT{tzOffset})',
    },
    // print
    print: {
      pageSize: '{format} / {orientation} / {width} x {height} mm',
      landscape: 'landscape',
    },
    // solar-revenue
    solarRevenue: {
      grant: '{currencySymbol}{value} grant',
    },
    // slides
    story: {
      deleteConfirm: 'Are you sure you want to delete "{ title }" action?',
      hintText:
        'Hint: The initial values are automatically filled with the current state of the {pluginName} plugin.',
      usedInSections:
        'This action is used in 1 section | This action is used in {count} sections',
      usedInButtons: 'and 1 button. | and {count} buttons.',
    },
    // planning
    planning: {
      emailPlaceholder: 'jdoe@example.de',
      includeSpecial:
        "Password must include one of: !@{'#'}$%^&*()\\[]{'{'}{'}'}-_+=~`|:;\"'<>,./?",
    },
    // app-configurator
    appConfigurator: {
      collections: {
        layers: { title: 'Layers' },
      },
    },
    // ui VcsObliqueFooter
    footerTemplate: 'Oblique image: {{ name }} - {{ viewDirection }}',
    // ui VcsSplashScreen, VcsTextPage
    imprint: '## Contact\n\n| Name | Tel |\n|------|-----|\n| A | 1 |',
    onlyEnglish: 'english only',
  },
  de: {
    shadowMap: {
      areaTooLarge:
        'Das ausgewählte Gebiet ist zu groß. Bitte wählen Sie ein Gebiet kleiner als {maxArea} m².',
    },
    story: {
      deleteConfirm: 'Soll die Aktion "{ title }" wirklich gelöscht werden?',
      usedInButtons: 'und 1 Button verwendet. | und {count} Buttons verwendet.',
    },
    onlyGerman: 'nur deutsch',
  },
};

describe('i18n plugin compatibility', () => {
  let app;

  beforeEach(() => {
    app = new VcsUiApp();
    app.i18n.add(structuredClone(pluginMessages));
  });

  afterEach(() => {
    app.destroy();
  });

  describe('vcsI18n.t', () => {
    it('should interpolate a named parameter (shadowmap)', () => {
      expect(
        app.vcsI18n.t('shadowMap.areaTooLarge', { maxArea: 5000 }),
      ).to.equal(
        'The selected area is too large. Please select an area smaller than 5000 m².',
      );
    });

    it('should interpolate multiple named parameters (print)', () => {
      expect(
        app.vcsI18n.t('print.pageSize', {
          format: 'A4',
          orientation: app.vcsI18n.t('print.landscape'),
          width: (297).toFixed(1),
          height: (210).toFixed(1),
        }),
      ).to.equal('A4 / landscape / 297.0 x 210.0 mm');
    });

    it('should interpolate adjacent named parameters (solar-revenue)', () => {
      expect(
        app.vcsI18n.t('solarRevenue.grant', {
          currencySymbol: '€',
          value: 500,
        }),
      ).to.equal('€500 grant');
    });

    it('should interpolate named parameters surrounded by other characters (shadowmap)', () => {
      expect(
        app.vcsI18n.t('shadowMap.timesExpressedIn', {
          timezone: 'Europe/Berlin',
          tzOffset: '+1',
        }),
      ).to.equal('times expressed in Europe/Berlin time (GMT+1)');
    });

    it('should allow whitespace within placeholders (slides)', () => {
      expect(
        app.vcsI18n.t('story.deleteConfirm', { title: 'My Action' }),
      ).to.equal('Are you sure you want to delete "My Action" action?');
    });

    it('should interpolate list parameters (ui import messages, used by viewshed, heightprofile, planning)', () => {
      expect(app.vcsI18n.t('components.import.featuresAdded', [3])).to.equal(
        '3 feature imported.',
      );
      expect(app.vcsI18n.t('components.import.addFailure', [2])).to.equal(
        '2 feature are already exist.',
      );
    });

    it('should render a missing named parameter as an empty string', () => {
      expect(app.vcsI18n.t('story.hintText')).to.equal(
        'Hint: The initial values are automatically filled with the current state of the  plugin.',
      );
    });

    it('should render the @ character literally (planning)', () => {
      expect(app.vcsI18n.t('planning.emailPlaceholder')).to.equal(
        'jdoe@example.de',
      );
    });

    it("should render literal escapes {'…'} (planning)", () => {
      // vue-i18n treated the | as a plural separator and only rendered the first part of the message
      expect(app.vcsI18n.t('planning.includeSpecial')).to.equal(
        'Password must include one of: !@#$%^&*()\\[]{}-_+=~`|:;"\'<>,./?',
      );
    });

    it('should render markdown tables as is (VcsSplashScreen, VcsTextPage)', () => {
      expect(app.vcsI18n.t('imprint')).to.equal(pluginMessages.en.imprint);
    });

    it('should return the key, if the key is not found (dynamic content like layer titles)', () => {
      expect(app.vcsI18n.t('myLayerTitle')).to.equal('myLayerTitle');
      expect(app.vcsI18n.t('layers.notDefined.title')).to.equal(
        'layers.notDefined.title',
      );
    });

    it('should return the key unchanged, if the key is not found and contains special characters', () => {
      expect(app.vcsI18n.t('A | B')).to.equal('A | B');
      expect(app.vcsI18n.t('Title {with} braces')).to.equal(
        'Title {with} braces',
      );
      expect(app.vcsI18n.t('mail@example.com')).to.equal('mail@example.com');
    });

    it('should return the key, if the key resolves to an object', () => {
      expect(app.vcsI18n.t('story')).to.equal('story');
    });

    it('should translate to the current locale', () => {
      app.locale = 'de';
      expect(app.vcsI18n.t('shadowMap.areaTooLarge', { maxArea: 5 })).to.equal(
        'Das ausgewählte Gebiet ist zu groß. Bitte wählen Sie ein Gebiet kleiner als 5 m².',
      );
    });

    it('should fall back to english, if a key is not available in the current locale', () => {
      app.locale = 'de';
      expect(app.vcsI18n.t('onlyEnglish')).to.equal('english only');
    });

    it('should fall back to german, if a key is not available in english', () => {
      expect(app.vcsI18n.t('onlyGerman')).to.equal('nur deutsch');
    });

    it('should fall back to english for locales without messages', () => {
      app.locale = 'pl';
      expect(app.vcsI18n.t('onlyEnglish')).to.equal('english only');
    });

    it('should reflect messages added after creation', () => {
      app.i18n.add({ name: 'late', en: { late: 'late {value}' } });
      expect(app.vcsI18n.t('late', { value: 1 })).to.equal('late 1');
    });

    it('should override messages with later added items', () => {
      app.i18n.add({
        name: 'override',
        en: { shadowMap: { areaTooLarge: 'too large: {maxArea}' } },
      });
      expect(app.vcsI18n.t('shadowMap.areaTooLarge', { maxArea: 1 })).to.equal(
        'too large: 1',
      );
    });
  });

  describe('pluralization (slides)', () => {
    it('should not pluralize, the message is rendered as is', () => {
      expect(app.vcsI18n.t('story.usedInSections', { count: 5 })).to.equal(
        'This action is used in 1 section | This action is used in 5 sections',
      );
      expect(app.vcsI18n.t('story.usedInButtons')).to.equal(
        'and 1 button. | and  buttons.',
      );
    });
  });

  describe('vcsI18n.te', () => {
    it('should return true for an existing key (app-configurator)', () => {
      expect(app.vcsI18n.te('appConfigurator.collections.layers.title')).to.be
        .true;
    });

    it('should return false for a missing key', () => {
      expect(app.vcsI18n.te('appConfigurator.collections.styles.title')).to.be
        .false;
    });

    it('should return false for a path resolving to an object', () => {
      expect(app.vcsI18n.te('appConfigurator.collections.layers')).to.be.false;
    });

    it('should not consider fallback locales', () => {
      app.locale = 'de';
      expect(app.vcsI18n.te('onlyEnglish')).to.be.false;
      expect(app.vcsI18n.te('onlyGerman')).to.be.true;
    });

    it('should check a given locale', () => {
      expect(app.vcsI18n.te('onlyGerman', 'de')).to.be.true;
      expect(app.vcsI18n.te('onlyGerman', 'en')).to.be.false;
    });
  });

  describe('vcsI18n.tm', () => {
    it('should return the raw message without interpolation (VcsObliqueFooter)', () => {
      expect(app.vcsI18n.tm('footerTemplate')).to.equal(
        'Oblique image: {{ name }} - {{ viewDirection }}',
      );
    });

    it('should return an empty object, if the key is not found', () => {
      // callers (VcsObliqueFooter) guard tm with te
      expect(app.vcsI18n.tm('my {{ custom }} template')).to.deep.equal({});
    });
  });

  describe('locale and messages (app-configurator, panorama, planning)', () => {
    it('should list locales with messages via availableLocales and getLocaleMessage', () => {
      app.i18n.add({ name: 'pl', pl: { foo: 'bar' } });
      const languages = [...app.vcsI18n.availableLocales].filter(
        (lang) => Object.keys(app.vcsI18n.getLocaleMessage(lang)).length > 0,
      );
      expect(languages).to.have.members(['de', 'en', 'pl']);
      expect(app.vcsI18n.getLocaleMessage('pl')).to.deep.equal({ foo: 'bar' });
    });

    it('should expose the current locale as a ref usable with Intl', () => {
      app.locale = 'de';
      expect(app.vcsI18n.locale.value).to.equal('de');
      const formatted = new Intl.NumberFormat(app.vcsI18n.locale.value).format(
        1000.5,
      );
      expect(formatted).to.equal('1.000,5');
    });
  });

  describe('vuetify locale adapter', () => {
    it('should translate vuetify messages with list parameters', () => {
      expect(
        app.vuetify.locale.t('$vuetify.dataIterator.pageText', 1, 10, 100),
      ).to.equal('1-10 of 100');
    });

    it('should follow the app locale', async () => {
      app.locale = 'de';
      await nextTick();
      expect(app.vuetify.locale.current.value).to.equal('de');
      expect(
        app.vuetify.locale.t('$vuetify.dataIterator.pageText', 1, 10, 100),
      ).to.equal('1-10 von 100');
    });
  });

  describe('template helpers', () => {
    let wrapper;

    function mountTemplate(template, data = {}) {
      const component = defineComponent({
        data: () => data,
        template,
      });
      wrapper = mount(component, {
        global: {
          plugins: [app.vcsI18n],
        },
      });
      return wrapper;
    }

    afterEach(() => {
      wrapper?.unmount();
      wrapper = undefined;
    });

    it('should translate with $t and named parameters (print, shadowmap)', () => {
      mountTemplate(
        `<span>{{ $t('shadowMap.timesExpressedIn', { timezone, tzOffset }) }}</span>`,
        { timezone: 'UTC', tzOffset: '+0' },
      );
      expect(wrapper.text()).to.equal('times expressed in UTC time (GMT+0)');
    });

    it('should translate with $st and named parameters (slides)', () => {
      mountTemplate(
        `<span>{{ $st('story.deleteConfirm', { title: 'Foo' }) }}</span>`,
      );
      expect(wrapper.text()).to.equal(
        'Are you sure you want to delete "Foo" action?',
      );
    });

    it('should translate with $st and list parameters (TiltSlider)', () => {
      mountTemplate(
        `<span>{{ $st('navigation.pitchTooltip', [Math.round(42.4)]) }}</span>`,
      );
      expect(wrapper.text()).to.equal('Camera pitch: 42°');
    });

    it('should handle non string keys with $st', () => {
      mountTemplate(
        `<span id="null">{{ $st(null) }}</span><span id="undefined">{{ $st(undefined) }}</span><span id="number">{{ $st(5) }}</span>`,
      );
      expect(wrapper.find('#null').text()).to.equal('');
      expect(wrapper.find('#undefined').text()).to.equal('');
      expect(wrapper.find('#number').text()).to.equal('5');
    });

    it('should return untranslated dynamic content with $st (layer titles)', () => {
      mountTemplate(`<span>{{ $st('My Layer | 2024') }}</span>`);
      expect(wrapper.text()).to.equal('My Layer | 2024');
    });

    it('should rerender, if the locale changes', async () => {
      mountTemplate(
        `<span>{{ $st('shadowMap.areaTooLarge', { maxArea: 1 }) }}</span>`,
      );
      expect(wrapper.text()).to.equal(
        'The selected area is too large. Please select an area smaller than 1 m².',
      );
      app.locale = 'de';
      await nextTick();
      expect(wrapper.text()).to.equal(
        'Das ausgewählte Gebiet ist zu groß. Bitte wählen Sie ein Gebiet kleiner als 1 m².',
      );
    });

    it('should rerender, if messages are added', async () => {
      mountTemplate(`<span>{{ $st('addedLater') }}</span>`);
      expect(wrapper.text()).to.equal('addedLater');
      app.i18n.add({ name: 'later', en: { addedLater: 'added later' } });
      await nextTick();
      expect(wrapper.text()).to.equal('added later');
    });

    it('should rerender, if messages are removed', async () => {
      const item = { name: 'removed', en: { removedLater: 'removed later' } };
      app.i18n.add(item);
      mountTemplate(`<span>{{ $st('removedLater') }}</span>`);
      expect(wrapper.text()).to.equal('removed later');
      app.i18n.remove(item);
      await nextTick();
      expect(wrapper.text()).to.equal('removedLater');
    });
  });
});
