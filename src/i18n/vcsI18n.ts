import {
  type App,
  type InjectionKey,
  type Ref,
  type ShallowRef,
  hasInjectionContext,
  inject,
  isRef,
  readonly,
  ref,
  shallowRef,
} from 'vue';
import { type CompiledTemplate, compileTemplate } from '@vcmap/core';
import { getLogger } from '@vcsuite/logger';
import { isObject } from './i18nCollection.js';

export type LocaleMessages = Record<string, unknown>;

export type TranslationKey = string | number;

/**
 * A key which may not be defined: null and undefined are translated to an empty string.
 */
export type SafeTranslationKey = TranslationKey | undefined | null;

/**
 * Translates the key and renders the message with the given named (`{name}`) or list (`{0}`) values.
 * Never throws: null and undefined keys are rendered as empty string, keys which are not strings
 * (e.g. numbers) are rendered as string without being translated. If no message is found, the key is returned.
 */
export type TranslateFunction<K = SafeTranslationKey> = (
  key: K,
  values?: Record<string, unknown> | unknown[],
) => string;

/**
 * The i18n instance, to be installed as vue plugin. Provides the subset of the vue-i18n composer API
 * used by the VC Map and its plugins.
 * Messages are replaced as a whole with setLocaleMessage. Messages returned by messages, getLocaleMessage and tm
 * must not be mutated: mutations are not rendered and are lost, when messages are set.
 */
export interface VcsI18n {
  /**
   * The current locale, read-only. Set the locale on the VcsUiApp instead.
   */
  readonly locale: Readonly<Ref<string>>;
  /**
   * The locales used, if a key cannot be found in the current locale.
   */
  readonly fallbackLocale: readonly string[];
  /**
   * The messages per locale. Use setLocaleMessage to change them, the messages must not be mutated.
   */
  readonly messages: Readonly<
    ShallowRef<Readonly<Record<string, Readonly<LocaleMessages>>>>
  >;
  /**
   * All locales with messages, sorted alphabetically.
   */
  readonly availableLocales: string[];
  /**
   * Translates the key. Returns the key, if no message can be found for the current locale or the fallback locales.
   * null and undefined keys are rendered as empty string, other keys which are not strings (e.g. numbers) are
   * rendered as string without being translated. Never throws.
   */
  t: TranslateFunction;
  /**
   * Safe translate, the same function as t.
   */
  st: TranslateFunction;
  /**
   * Returns true, if a message exists for the key in the given or the current locale. Fallback locales are not considered.
   */
  te(key: string, locale?: string): boolean;
  /**
   * Returns the raw message (or message object) for the key, considering fallback locales.
   * Returns an empty object, if the key cannot be found. Message objects must not be mutated.
   */
  tm(key: string): unknown;
  /**
   * Returns the messages of the locale, which must not be mutated. To change them, pass a changed copy
   * (e.g. created with structuredClone) to setLocaleMessage.
   */
  getLocaleMessage(locale: string): Readonly<LocaleMessages>;
  setLocaleMessage(locale: string, messages: LocaleMessages): void;
  /**
   * Provides the template helpers `$t` and `$st` to all components and the instance to useVcsI18n.
   * For compatibility with vue-i18n, the deprecated read-only `$i18n.locale` is provided as well.
   */
  install(app: App): void;
}

/**
 * The injection key of the i18n instance installed in a Vue app, see useVcsI18n.
 */
const vcsI18nKey: InjectionKey<VcsI18n> = Symbol('VcsI18n');

/**
 * Returns the i18n instance installed in the Vue app, in the style of useI18n of vue-i18n:
 * `const { t, locale } = useVcsI18n();`. Within the VC Map, this is the instance of the app (app.vcsI18n).
 * t, st and the other functions can be destructured. The locale is a read-only ref, availableLocales is a getter:
 * it is evaluated when destructured and is not updated afterwards.
 * Must be called within the setup of a component. Throws, if no i18n instance is installed in the Vue app.
 */
export function useVcsI18n(): VcsI18n {
  const i18n = hasInjectionContext() ? inject(vcsI18nKey, null) : null;
  if (!i18n) {
    throw new Error(
      'useVcsI18n must be called within the setup of a component, in a Vue app using a VcsI18n instance (app.vcsI18n)',
    );
  }
  return i18n;
}

export type VcsI18nOptions = {
  /**
   * The locale, defaults to 'en'. Either a fixed locale or a ref providing the locale. The instance only reads
   * the ref and exposes it read-only: the owner of the ref changes the locale. The VcsUiApp passes a ref
   * following app.locale.
   */
  locale?: string | Readonly<Ref<string>>;
  fallbackLocale?: string[];
  messages?: Record<string, LocaleMessages>;
};

/**
 * Resolves a dot separated path within the messages. If the path cannot be resolved,
 * the path itself is tried as flat key.
 */
export function resolvePath(messages: unknown, path: string): unknown {
  if (!isObject(messages)) {
    return undefined;
  }
  let current: unknown = messages;
  const segments = path.split('.');
  for (const segment of segments) {
    if (!isObject(current) || !Object.hasOwn(current, segment)) {
      current = undefined;
      break;
    }
    current = current[segment];
  }
  if (current === undefined && Object.hasOwn(messages, path)) {
    return messages[path];
  }
  return current;
}

/**
 * Converts a value rendered in a message to text, in the same way vue-i18n does: null and undefined are rendered
 * as empty string, arrays and plain objects are JSON stringified. Values which cannot be stringified
 * (e.g. circular objects) are rendered with String. Used as formatValue of the compiled messages: only rendered
 * values are converted, property keys, conditions and iterations use the values as is.
 */
function toDisplayString(value: unknown): string {
  if (value == null) {
    return '';
  }
  if (
    Array.isArray(value) ||
    (isObject(value) && Object.getPrototypeOf(value) === Object.prototype)
  ) {
    try {
      return JSON.stringify(value, null, 2);
    } catch (_e) {
      // rendered with String, e.g. [object Object] for circular objects
    }
  }
  // errors, e.g. of objects without prototype, are caught by the template engine
  // eslint-disable-next-line @typescript-eslint/no-base-to-string
  return String(value);
}

/**
 * Converts a key, which is not a string, to the rendered text: null and undefined are rendered as empty string,
 * as well as keys which cannot be converted to a string.
 */
function keyToText(key: unknown): string {
  try {
    // keys which are not strings are rendered as is, e.g. numbers
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    return String(key ?? '');
  } catch (_e) {
    return '';
  }
}

/**
 * Creates a new i18n instance. Installing it provides the template helpers `$t` and `$st` to all components,
 * as well as the deprecated read-only `$i18n.locale` for compatibility with vue-i18n.
 * `t`, `st`, `$t` and `$st` are the same function, which never throws and handles keys which are not strings:
 * null and undefined are rendered as an empty string, other keys are converted to strings without being translated.
 */
export function createVcsI18n(options: VcsI18nOptions = {}): VcsI18n {
  // readonly forwards reads to the source ref, so the locale is never cached by the instance.
  // Writes are ignored with a warning in dev builds and rejected by TypeScript
  const locale = readonly(
    isRef(options.locale) ? options.locale : ref(options.locale ?? 'en'),
  );
  const fallbackLocale = [...(options.fallbackLocale ?? ['en'])];
  const messages = shallowRef<Record<string, LocaleMessages>>({
    ...options.messages,
  });

  /**
   * The compiled messages of this instance, by message. Cleared, whenever messages are set.
   */
  const compiledMessages = new Map<string, CompiledTemplate>();

  /**
   * Renders a message with the given values, using single brace templates of the @vcmap/core (see compileTemplate).
   * The translate function renders linked messages ({#t 'other.key'}). Compiled messages are cached.
   * The values are passed as is, so nested keys, conditions and iterations can use them. Only rendered values are
   * converted to text (see toDisplayString). The values are only read by the template engine, which catches errors
   * of getters.
   */
  function formatMessage(
    message: string,
    values: Record<string, unknown> | unknown[],
    translate: (key: string) => string,
  ): string {
    let compiled = compiledMessages.get(message);
    if (!compiled) {
      compiled = compileTemplate(message, {
        delimiters: ['{', '}'],
        formatValue: toDisplayString,
      });
      compiledMessages.set(message, compiled);
    }
    return compiled(values, translate);
  }

  /**
   * Returns the first accepted message for the key of the current locale or the fallback locales.
   */
  function findMessage(
    key: string,
    accept: (message: unknown) => boolean,
  ): unknown {
    for (const messageLocale of [locale.value, ...fallbackLocale]) {
      const message = resolvePath(messages.value[messageLocale], key);
      if (accept(message)) {
        return message;
      }
    }
    return undefined;
  }

  /**
   * The keys of the messages currently rendered, to detect circular linked messages.
   */
  const renderingKeys = new Set<string>();

  /**
   * The keys of circular linked messages already warned about, to warn once per key and not on every render.
   */
  const circularKeys = new Set<string>();

  /**
   * Translates the key. Linked messages ({#t 'other.key'}) are rendered with the same values.
   * Circular linked messages are rendered as their key.
   * Keys which are not strings are not translated: null and undefined are rendered as empty string,
   * other keys (e.g. numbers) are converted to strings.
   */
  const t: TranslateFunction = (key, values) => {
    if (typeof key !== 'string') {
      return keyToText(key);
    }
    const message = findMessage(key, (m) => typeof m === 'string');
    if (message === undefined) {
      return key;
    }
    if (renderingKeys.has(key)) {
      if (!circularKeys.has(key)) {
        circularKeys.add(key);
        getLogger('VcsI18n').warning(
          `Circular linked message ${key}, rendering the key instead`,
        );
      }
      return key;
    }
    renderingKeys.add(key);
    try {
      // values may be null, if passed from JavaScript or templates
      const messageValues = values ?? {};
      return formatMessage(message as string, messageValues, (linkedKey) =>
        t(linkedKey, messageValues),
      );
    } finally {
      renderingKeys.delete(key);
    }
  };

  const i18n: VcsI18n = {
    locale,
    fallbackLocale,
    messages,
    get availableLocales(): string[] {
      return Object.keys(messages.value).sort();
    },
    t,
    st: t,
    te(key, targetLocale = locale.value): boolean {
      return typeof resolvePath(messages.value[targetLocale], key) === 'string';
    },
    tm(key): unknown {
      return findMessage(key, (m) => m != null) ?? {};
    },
    getLocaleMessage(targetLocale): Readonly<LocaleMessages> {
      return messages.value[targetLocale] ?? {};
    },
    setLocaleMessage(targetLocale, localeMessages): void {
      compiledMessages.clear();
      messages.value = { ...messages.value, [targetLocale]: localeMessages };
    },
    install(app): void {
      app.provide(vcsI18nKey, i18n);
      app.config.globalProperties.$t = t;
      app.config.globalProperties.$st = t;
      // compatibility with vue-i18n, remove in next major release. Assigned without accessing the deprecated $i18n
      Object.assign(app.config.globalProperties, {
        $i18n: Object.freeze({
          get locale(): string {
            getLogger('VcsI18n').deprecate(
              '$i18n.locale',
              'Use the locale of useVcsI18n() instead.',
            );
            return locale.value;
          },
        }),
      });
    },
  };
  return i18n;
}
