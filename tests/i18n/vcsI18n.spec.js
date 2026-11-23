import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { getLogger } from '@vcsuite/logger';
import { mount } from '@vue/test-utils';
import { defineComponent, nextTick, ref } from 'vue';
import { compileTemplate } from '@vcmap/core';
import {
  createVcsI18n,
  resolvePath,
  useVcsI18n,
} from '../../src/i18n/vcsI18n.ts';

vi.mock('@vcmap/core', async (importOriginal) => {
  const original = await importOriginal();
  return { ...original, compileTemplate: vi.fn(original.compileTemplate) };
});

describe('vcsI18n', () => {
  describe('resolvePath', () => {
    const messages = {
      a: { b: { c: 'nested' } },
      'flat.key': 'flat',
      $vuetify: { close: 'Close' },
    };

    it('should resolve dot separated paths', () => {
      expect(resolvePath(messages, 'a.b.c')).to.equal('nested');
      expect(resolvePath(messages, '$vuetify.close')).to.equal('Close');
    });

    it('should resolve objects', () => {
      expect(resolvePath(messages, 'a.b')).to.deep.equal({ c: 'nested' });
    });

    it('should fall back to flat keys', () => {
      expect(resolvePath(messages, 'flat.key')).to.equal('flat');
    });

    it('should return undefined for missing paths', () => {
      expect(resolvePath(messages, 'a.x.c')).to.be.undefined;
      expect(resolvePath(messages, 'a.b.c.d')).to.be.undefined;
      expect(resolvePath(undefined, 'a')).to.be.undefined;
    });

    it('should not resolve prototype properties', () => {
      expect(resolvePath(messages, 'toString')).to.be.undefined;
      expect(resolvePath(messages, 'a.constructor')).to.be.undefined;
    });
  });

  describe('translating', () => {
    let composer;
    let locale;

    beforeEach(() => {
      locale = ref('en');
      composer = createVcsI18n({
        locale,
        fallbackLocale: ['en', 'de'],
        messages: {
          en: {
            hello: 'Hello {name}',
            list: '{0} and {1}',
            pipes: 'one item | {count} items',
            nested: { key: 'nested' },
            onlyEn: 'only english',
          },
          de: {
            hello: 'Hallo {name}',
            onlyDe: 'nur deutsch',
          },
        },
      });
    });

    describe('t', () => {
      it('should be the same function as st', () => {
        expect(composer.st).to.equal(composer.t);
      });

      it('should render null and undefined keys as empty string', () => {
        expect(composer.t(null)).to.equal('');
        expect(composer.t(undefined)).to.equal('');
        expect(composer.t(undefined, { name: 'World' })).to.equal('');
      });

      it('should render keys which are not strings without translating them', () => {
        composer.setLocaleMessage('en', { 3: 'three', true: 'yes' });
        expect(composer.t(3)).to.equal('3');
        expect(composer.t(true)).to.equal('true');
      });

      it('should return the key, if no message is found', () => {
        expect(composer.t('missing.key')).to.equal('missing.key');
        expect(composer.t('nested')).to.equal('nested');
      });

      it('should never throw', () => {
        const circular = { name: 'circular' };
        circular.self = circular;
        expect(composer.t('hello', null)).to.equal('Hello ');
        expect(composer.t('hello', { name: circular })).to.equal(
          'Hello [object Object]',
        );
        expect(composer.t('hello', { name: 10n })).to.equal('Hello 10');
        expect(composer.t('hello', { name: { big: 10n } })).to.equal(
          'Hello [object Object]',
        );
        expect(
          composer.t('hello', {
            get name() {
              throw new Error('getter');
            },
          }),
        ).to.equal('Hello ');
        expect(composer.t('hello', { name: Object.create(null) })).to.equal(
          'Hello ',
        );
        expect(composer.t(Object.create(null))).to.equal('');
        expect(
          composer.t({
            toString() {
              throw new Error('toString');
            },
          }),
        ).to.equal('');
      });

      it('should translate named parameters', () => {
        expect(composer.t('hello', { name: 'World' })).to.equal('Hello World');
      });

      it('should translate list parameters', () => {
        expect(composer.t('list', ['a', 'b'])).to.equal('a and b');
      });

      it('should not pluralize, pipes are rendered as is', () => {
        expect(composer.t('pipes', { count: 2 })).to.equal(
          'one item | 2 items',
        );
      });

      it('should translate to the current locale', () => {
        locale.value = 'de';
        expect(composer.t('hello', { name: 'Welt' })).to.equal('Hallo Welt');
      });

      it('should use fallback locales', () => {
        locale.value = 'de';
        expect(composer.t('onlyEn')).to.equal('only english');
        locale.value = 'en';
        expect(composer.t('onlyDe')).to.equal('nur deutsch');
        locale.value = 'pl';
        expect(composer.t('hello', { name: 'World' })).to.equal('Hello World');
      });

      it('should return the key for missing keys and objects', () => {
        expect(composer.t('missing.key')).to.equal('missing.key');
        expect(composer.t('nested')).to.equal('nested');
        expect(composer.t('missing {name}', { name: 'x' })).to.equal(
          'missing {name}',
        );
      });

      it('should convert non string keys to strings', () => {
        expect(composer.t(5)).to.equal('5');
      });
    });

    describe('message syntax', () => {
      function format(message, ...args) {
        composer.setLocaleMessage('en', { message });
        return composer.t('message', ...args);
      }

      it('should allow whitespace within placeholders', () => {
        expect(format('Hello { name }!', { name: 'World' })).to.equal(
          'Hello World!',
        );
      });

      it('should render missing, null and undefined parameters as empty string', () => {
        expect(format('a{name}b{0}c')).to.equal('abc');
        expect(format('{a}{b}', { a: null, b: undefined })).to.equal('');
      });

      it('should render numbers and booleans', () => {
        expect(format('{a} {b}', { a: 0, b: false })).to.equal('0 false');
      });

      it('should stringify objects and arrays', () => {
        expect(format('{a}', { a: [1] })).to.equal(
          JSON.stringify([1], null, 2),
        );
        expect(format('{a}', { a: { b: 1 } })).to.equal(
          JSON.stringify({ b: 1 }, null, 2),
        );
        expect(format('{0}', [{ b: 1 }])).to.equal(
          JSON.stringify({ b: 1 }, null, 2),
        );
      });

      it('should render class instances with their own toString', () => {
        const date = new Date(0);
        expect(format('{date}', { date })).to.equal(String(date));
      });

      it('should use the values as is for nested keys, conditions and iterations', () => {
        expect(format('{user.name}', { user: { name: 'x' } })).to.equal('x');
        expect(format('{items.length}', { items: [1, 2, 3] })).to.equal('3');
        expect(
          format('{#if ["get", "opts", "on"]}on{/if}', { opts: { on: true } }),
        ).to.equal('on');
        expect(
          format('{#each (item) in items}{item.name};{/each}', {
            items: [{ name: 'a' }, { name: 'b' }],
          }),
        ).to.equal('a;b;');
        expect(
          format('{user.address}', { user: { address: { city: 'c' } } }),
        ).to.equal(JSON.stringify({ city: 'c' }, null, 2));
      });

      it('should render literals', () => {
        expect(
          format(
            "Password must include one of: !@{'#'}$%^&*()\\[]{'{'}{'}'}-_+=~`",
          ),
        ).to.equal('Password must include one of: !@#$%^&*()\\[]{}-_+=~`');
      });

      it('should render the @ character literally', () => {
        expect(format('mail@example.com @:linked.key')).to.equal(
          'mail@example.com @:linked.key',
        );
      });

      it('should render the inner placeholder of mustache templates', () => {
        expect(format('{{ name }} and {name}', { name: 'x' })).to.equal(
          '{x} and x',
        );
      });

      it('should render text within braces as placeholder', () => {
        expect(format('a {b c} d', { 'b c': 'x' })).to.equal('a x d');
        expect(format('p { color: red; }')).to.equal('p ');
      });

      it('should render invalid placeholders as is and never throw', () => {
        [
          'a { b',
          'a } b',
          '{}',
          "{'unclosed}",
          '{{ name',
          '{[bad}',
          '{#if a}missing closing',
        ].forEach((message) => {
          expect(format(message, { a: 'x' })).to.equal(message);
        });
      });

      it('should render getters of class instances in the values', () => {
        class Item {
          // eslint-disable-next-line class-methods-use-this
          get name() {
            return 'item';
          }
        }
        expect(
          format('{item.name} {#if item.name}visible{/if}', {
            item: new Item(),
          }),
        ).to.equal('item visible');
      });

      it('should render missing values as empty string', () => {
        expect(format('{a}{b.c}{0}', {})).to.equal('');
      });

      it('should render conditional blocks', () => {
        const message =
          '{count} {#if [">", ["get", "count"], 1]}items{else}item{/if}';
        expect(format(message, { count: 1 })).to.equal('1 item');
        expect(format(message, { count: 2 })).to.equal('2 items');
      });

      it('should allow whitespace within block tags', () => {
        const message =
          '{count} { #if [">", ["get", "count"], 1] }items{ else }item{ /if }';
        expect(format(message, { count: 1 })).to.equal('1 item');
        expect(format(message, { count: 2 })).to.equal('2 items');
      });

      it('should render markdown tables as is', () => {
        const table = '## Contact\n\n| Name | Tel |\n|------|-----|\n| A | 1 |';
        expect(format(table)).to.equal(table);
      });
    });

    describe('linked messages', () => {
      beforeEach(() => {
        composer.setLocaleMessage('en', {
          general: { name: 'Name: {name}', plain: 'plain' },
          linked: "{#t 'general.plain'} - {#t 'general.name'}",
          byValue: '{#t key}',
          missing: "{#t 'missing.key'}",
          self: "a {#t 'self'}",
          cycleA: "{#t 'cycleB'}",
          cycleB: "b {#t 'cycleA'}",
        });
      });

      it('should render linked messages with the same values', () => {
        expect(composer.t('linked', { name: 'x' })).to.equal('plain - Name: x');
      });

      it('should translate values', () => {
        expect(composer.t('byValue', { key: 'general.plain' })).to.equal(
          'plain',
        );
      });

      it('should render the key of missing linked messages', () => {
        expect(composer.t('missing')).to.equal('missing.key');
      });

      it('should render the key of circular linked messages', () => {
        expect(composer.t('self')).to.equal('a self');
        expect(composer.t('cycleA')).to.equal('b cycleA');
        expect(composer.t('cycleB')).to.equal('b cycleB');
      });

      it('should render linked messages in the current locale', () => {
        composer.setLocaleMessage('de', {
          general: { plain: 'einfach' },
          linked: "{#t 'general.plain'}",
        });
        locale.value = 'de';
        expect(composer.t('linked')).to.equal('einfach');
      });
    });

    describe('te', () => {
      it('should check the current locale only', () => {
        expect(composer.te('hello')).to.be.true;
        expect(composer.te('onlyDe')).to.be.false;
        expect(composer.te('nested')).to.be.false;
        expect(composer.te('onlyDe', 'de')).to.be.true;
      });
    });

    describe('tm', () => {
      it('should return raw messages and objects', () => {
        expect(composer.tm('hello')).to.equal('Hello {name}');
        expect(composer.tm('nested')).to.deep.equal({ key: 'nested' });
      });

      it('should consider fallback locales', () => {
        expect(composer.tm('onlyDe')).to.equal('nur deutsch');
      });

      it('should return an empty object for missing keys', () => {
        expect(composer.tm('missing')).to.deep.equal({});
      });

      it('should return message objects, which can be cloned', () => {
        expect(structuredClone(composer.tm('nested'))).to.deep.equal({
          key: 'nested',
        });
      });
    });

    describe('messages', () => {
      it('should list available locales sorted', () => {
        composer.setLocaleMessage('pl', {});
        expect(composer.availableLocales).to.deep.equal(['de', 'en', 'pl']);
      });

      it('should set and get locale messages', () => {
        composer.setLocaleMessage('en', { replaced: 'replaced' });
        expect(composer.getLocaleMessage('en')).to.deep.equal({
          replaced: 'replaced',
        });
        expect(composer.te('hello')).to.be.false;
        expect(composer.getLocaleMessage('fr')).to.deep.equal({});
      });

      it('should set changed copies of the locale messages', () => {
        const messages = structuredClone(composer.getLocaleMessage('en'));
        messages.nested.key = 'changed';
        composer.setLocaleMessage('en', {
          ...messages,
          hello: 'Hi {name}',
        });
        expect(composer.t('hello', { name: 'x' })).to.equal('Hi x');
        expect(composer.t('nested.key')).to.equal('changed');
        expect(composer.t('onlyEn')).to.equal('only english');
      });

      it('should not add locales by getting their messages', () => {
        composer.getLocaleMessage('fr').added = 'added';
        expect(composer.getLocaleMessage('fr')).to.deep.equal({});
        expect(composer.availableLocales).to.not.include('fr');
      });
    });
  });

  describe('locale', () => {
    const messages = { en: { hello: 'Hello' }, de: { hello: 'Hallo' } };
    let composer;
    let locale;

    beforeEach(() => {
      locale = ref('en');
      composer = createVcsI18n({ locale, messages });
    });

    it('should be read-only', () => {
      composer.locale.value = 'de';
      expect(composer.locale.value).to.equal('en');
      expect(locale.value).to.equal('en');
      expect(composer.t('hello')).to.equal('Hello');
    });

    it('should follow the given locale ref', () => {
      locale.value = 'de';
      expect(composer.locale.value).to.equal('de');
      expect(composer.t('hello')).to.equal('Hallo');
    });

    it('should use a fixed locale, if a string is given', () => {
      expect(createVcsI18n({ locale: 'de', messages }).t('hello')).to.equal(
        'Hallo',
      );
      expect(createVcsI18n({ messages }).locale.value).to.equal('en');
    });
  });

  describe('compiled messages', () => {
    let composer;

    beforeEach(() => {
      composer = createVcsI18n({ messages: { en: { hello: 'Hello {name}' } } });
      compileTemplate.mockClear();
    });

    it('should compile a message once', () => {
      expect(composer.t('hello', { name: 'a' })).to.equal('Hello a');
      expect(composer.t('hello', { name: 'b' })).to.equal('Hello b');
      expect(compileTemplate).toHaveBeenCalledTimes(1);
    });

    it('should not share compiled messages between instances', () => {
      const other = createVcsI18n({
        messages: { en: { hello: 'Hello {name}' } },
      });
      composer.t('hello');
      other.t('hello');
      expect(compileTemplate).toHaveBeenCalledTimes(2);
    });

    it('should compile messages again, after messages are set', () => {
      composer.t('hello');
      composer.setLocaleMessage('de', {});
      expect(composer.t('hello', { name: 'a' })).to.equal('Hello a');
      expect(compileTemplate).toHaveBeenCalledTimes(2);
    });
  });

  describe('vue plugin', () => {
    let i18n;
    let locale;
    let wrapper;

    /**
     * Mounts a test component with the given options, installing the given plugins
     */
    function mountComponent(options, plugins = [i18n]) {
      wrapper = mount(defineComponent(options), { global: { plugins } });
      return wrapper;
    }

    function mountTemplate(template) {
      return mountComponent({ template });
    }

    beforeEach(() => {
      locale = ref('en');
      i18n = createVcsI18n({
        locale,
        messages: {
          en: { hello: 'Hello {name}' },
          de: { hello: 'Hallo {name}' },
        },
      });
    });

    afterEach(() => {
      wrapper?.unmount();
      wrapper = undefined;
    });

    it('should provide $t', () => {
      mountTemplate(`<span>{{ $t('hello', { name: 'World' }) }}</span>`);
      expect(wrapper.text()).to.equal('Hello World');
    });

    it('should provide $st, handling non string keys', () => {
      mountTemplate(
        `<span>{{ $st('hello', { name: 'World' }) }}|{{ $st(null) }}|{{ $st(undefined) }}|{{ $st(3) }}</span>`,
      );
      expect(wrapper.text()).to.equal('Hello World|||3');
    });

    it('should provide $t, handling non string keys the same way as $st', () => {
      mountTemplate(
        `<span>{{ $t('hello', { name: 'World' }) }}|{{ $t(null) }}|{{ $t(undefined) }}|{{ $t(3) }}</span>`,
      );
      expect(wrapper.text()).to.equal('Hello World|||3');
    });

    it('should rerender on locale changes', async () => {
      mountTemplate(`<span>{{ $t('hello', { name: 'x' }) }}</span>`);
      locale.value = 'de';
      await nextTick();
      expect(wrapper.text()).to.equal('Hallo x');
    });

    describe('$i18n.locale', () => {
      let deprecate;

      beforeEach(() => {
        deprecate = vi.spyOn(getLogger('VcsI18n'), 'deprecate');
      });

      afterEach(() => {
        deprecate.mockRestore();
      });

      it('should provide the current locale and rerender on locale changes', async () => {
        mountTemplate(`<span>{{ $i18n.locale }}</span>`);
        expect(wrapper.text()).to.equal('en');
        locale.value = 'de';
        await nextTick();
        expect(wrapper.text()).to.equal('de');
      });

      it('should log a deprecation', () => {
        mountTemplate(`<span>{{ $i18n.locale }}</span>`);
        expect(deprecate).toHaveBeenCalledWith(
          '$i18n.locale',
          'Use the locale of useVcsI18n() instead.',
        );
      });

      it('should be read-only', () => {
        mountTemplate(`<span>{{ $i18n.locale }}</span>`);
        expect(() => {
          wrapper.vm.$i18n.locale = 'de';
        }).to.throw(TypeError);
        expect(i18n.locale.value).to.equal('en');
      });
    });

    it('should rerender on message changes', async () => {
      mountTemplate(`<span>{{ $t('later') }}</span>`);
      expect(wrapper.text()).to.equal('later');
      i18n.setLocaleMessage('en', { later: 'added later' });
      await nextTick();
      expect(wrapper.text()).to.equal('added later');
    });

    describe('useVcsI18n', () => {
      /**
       * Mounts a component, which destructures the result of useVcsI18n in its setup
       */
      function mountComposition() {
        let result;
        mountComponent({
          setup() {
            result = useVcsI18n();
            const { t, locale: composedLocale } = result;
            return { t, composedLocale };
          },
          template: `<span>{{ t('hello', { name: 'x' }) }}|{{ composedLocale }}</span>`,
        });
        return result;
      }

      it('should return the installed i18n instance', () => {
        expect(mountComposition()).to.equal(i18n);
      });

      it('should provide destructured t and locale, which rerender on locale changes', async () => {
        mountComposition();
        expect(wrapper.text()).to.equal('Hello x|en');
        locale.value = 'de';
        await nextTick();
        expect(wrapper.text()).to.equal('Hallo x|de');
      });

      it('should provide the read-only locale', () => {
        const { locale: composedLocale } = mountComposition();
        composedLocale.value = 'de';
        expect(locale.value).to.equal('en');
        expect(composedLocale.value).to.equal('en');
      });

      it('should throw outside of a setup function', () => {
        expect(() => useVcsI18n()).to.throw(
          'useVcsI18n must be called within the setup of a component',
        );
      });

      it('should throw, if no i18n instance is installed', () => {
        expect(() =>
          mountComponent(
            {
              setup() {
                useVcsI18n();
                return {};
              },
              template: '<span></span>',
            },
            [],
          ),
        ).to.throw('useVcsI18n must be called within the setup of a component');
      });
    });
  });
});
