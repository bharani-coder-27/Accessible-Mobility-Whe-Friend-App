import { defaultServerBase } from "../config";
import { getFromStorage, saveToStorage, removeFromStorage } from "../utils/storage";
import api from "./api";

const STORAGE_KEY = "settings.serverBase";

let currentBase = defaultServerBase;

/**
 * Tidy whatever the user typed into a usable server root.
 *
 * People paste the URL they were given, which is often the full API path with
 * a trailing slash. Accepting that instead of rejecting it avoids a
 * "why doesn't this work" round trip over chat.
 */
export const normaliseServerBase = (raw: string): string =>
  raw
    .trim()
    .replace(/\s+/g, "")
    .replace(/\/+$/, "")
    .replace(/\/api$/i, "");

/** True if the value looks like an http(s) origin we can actually call. */
export const isValidServerBase = (raw: string): boolean => {
  const value = normaliseServerBase(raw);
  return /^https?:\/\/[^\s/]+$/i.test(value);
};

export const getServerBase = () => currentBase;
export const getApiUrl = () => `${currentBase}/api`;
export const getSocketUrl = () => currentBase;
export const isUsingDefaultServer = () => currentBase === defaultServerBase;
export { defaultServerBase };

const apply = (base: string) => {
  currentBase = base;
  api.defaults.baseURL = getApiUrl();
};

/**
 * Restore a saved server address at startup.
 *
 * The build-time address is only a default. A tunnelled dev server changes
 * address every time the tunnel restarts, and without this every change would
 * mean rebuilding and redistributing the APK.
 */
export const loadServerBase = async () => {
  try {
    const stored = await getFromStorage<string>(STORAGE_KEY);
    if (stored && isValidServerBase(stored)) apply(normaliseServerBase(stored));
    else apply(defaultServerBase);
  } catch {
    apply(defaultServerBase);
  }
};

/** Point the app at a different server and remember the choice. */
export const setServerBase = async (raw: string) => {
  const base = normaliseServerBase(raw);
  apply(base);
  await saveToStorage(STORAGE_KEY, base);
};

/** Go back to the address the app was built with. */
export const resetServerBase = async () => {
  apply(defaultServerBase);
  await removeFromStorage(STORAGE_KEY);
};
