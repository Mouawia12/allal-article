import {
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import PropTypes from "prop-types";

import { useSoftUIController, setDirection } from "context";

import { DEFAULT_LOCALE, SUPPORTED_LOCALES, exactTranslations, keyedTranslations } from "i18n/translations";

const STORAGE_KEY = "allal-article-locale";

const I18nContext = createContext(null);

const SKIPPED_PROP_KEYS = new Set([
  "route",
  "href",
  "to",
  "src",
  "image",
  "icon",
  "component",
  "defaultValue",
  "id",
  "color",
  "name",
  "variant",
  "size",
  "value",
  "align",
  "target",
  "rel",
  "onClick",
  "onChange",
  "onClose",
  "onOpen",
  "onMouseEnter",
  "onMouseLeave",
  "chart",
  "items",
  "ownerState",
  "sx",
  "style",
]);

function shouldSkipElementLocalization(node) {
  const type = node?.type;

  if (!type) {
    return false;
  }

  return (
    type.displayName === "AppIcon" ||
    type.render?.displayName === "AppIcon" ||
    type.render?.name === "AppIcon"
  );
}

function getByPath(target, path) {
  return path.split(".").reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), target);
}

function interpolate(template, params = {}) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => `${params[key] ?? ""}`);
}

function resolveLocale(input) {
  return SUPPORTED_LOCALES.includes(input) ? input : DEFAULT_LOCALE;
}

export function translateText(input, locale = DEFAULT_LOCALE, params = {}) {
  if (typeof input !== "string") {
    return input;
  }

  const nextLocale = resolveLocale(locale);
  const keyed = getByPath(keyedTranslations[nextLocale], input);
  const exact = exactTranslations[nextLocale][input];
  const translated = keyed ?? exact ?? input;

  return typeof translated === "string" ? interpolate(translated, params) : input;
}

function preserveWhitespace(original, translated) {
  if (typeof original !== "string" || typeof translated !== "string") {
    return translated;
  }

  const leading = original.match(/^\s*/)?.[0] ?? "";
  const trailing = original.match(/\s*$/)?.[0] ?? "";
  return `${leading}${translated}${trailing}`;
}

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === "[object Object]";
}

function localizeChildren(children, t) {
  if (Array.isArray(children)) {
    return localizeNodeArray(children, t);
  }

  return localizeNode(children, t);
}

function localizeNodeArray(nodes, t) {
  return nodes.map((child, index) => {
    const localizedChild = localizeNode(child, t);

    if (isValidElement(localizedChild) && localizedChild.key == null) {
      return cloneElement(localizedChild, { key: `localized-${index}` });
    }

    return localizedChild;
  });
}

export function localizeValue(value, t) {
  if (typeof value === "string") {
    const trimmed = value.trim();

    if (!trimmed) {
      return value;
    }

    return preserveWhitespace(value, t(trimmed));
  }

  if (Array.isArray(value)) {
    return value.map((item) => localizeValue(item, t));
  }

  if (isValidElement(value)) {
    return localizeNode(value, t);
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, itemValue]) => [
        key,
        SKIPPED_PROP_KEYS.has(key) ? itemValue : localizeValue(itemValue, t),
      ])
    );
  }

  return value;
}

export function localizeNode(node, t) {
  if (typeof node === "string") {
    return localizeValue(node, t);
  }

  if (Array.isArray(node)) {
    return localizeNodeArray(node, t);
  }

  if (!isValidElement(node)) {
    return node;
  }

  if (shouldSkipElementLocalization(node)) {
    return node;
  }

  const nextProps = {};

  Object.entries(node.props ?? {}).forEach(([key, value]) => {
    if (key === "children") {
      nextProps.children = localizeChildren(value, t);
      return;
    }

    if (SKIPPED_PROP_KEYS.has(key)) {
      return;
    }

    nextProps[key] = localizeValue(value, t);
  });

  return cloneElement(node, nextProps);
}

export function I18nProvider({ children }) {
  const [, dispatch] = useSoftUIController();
  const [locale, setLocaleState] = useState(() => {
    if (typeof window === "undefined") {
      return DEFAULT_LOCALE;
    }

    return resolveLocale(window.localStorage.getItem(STORAGE_KEY));
  });

  const direction = locale === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, locale);
    }

    document.documentElement.setAttribute("lang", locale);
    document.documentElement.setAttribute("dir", direction);
    document.body.setAttribute("dir", direction);
    setDirection(dispatch, direction);
  }, [dispatch, direction, locale]);

  const t = useMemo(() => (key, params) => translateText(key, locale, params), [locale]);

  const languages = useMemo(
    () =>
      SUPPORTED_LOCALES.map((code) => ({
        code,
        label: t(`language.options.${code}`),
      })),
    [t]
  );

  const value = useMemo(
    () => ({
      locale,
      direction,
      languages,
      setLocale: (nextLocale) => setLocaleState(resolveLocale(nextLocale)),
      t,
    }),
    [direction, languages, locale, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

I18nProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useI18n() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error("useI18n must be used inside I18nProvider.");
  }

  return context;
}
