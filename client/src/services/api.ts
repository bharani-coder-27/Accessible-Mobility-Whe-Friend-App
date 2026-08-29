import axios, { isAxiosError } from "axios";
import { apiBaseUrl } from "../config";

const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15000,
});

let authToken: string | null = null;

/**
 * Hold the session token for outgoing requests.
 *
 * Kept in module scope rather than threaded through every call site: before
 * this, some requests attached `Authorization` by hand and others forgot,
 * which is exactly how a protected endpoint ends up silently 401-ing in one
 * screen but not another.
 */
export const setAuthToken = (token: string | null) => {
  authToken = token;
};

api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  // ngrok's free tier serves an HTML interstitial to anything it takes for a
  // browser. This header opts out, so a tunnelled API returns JSON rather than
  // a page that fails to parse. Harmless when not behind ngrok.
  config.headers["ngrok-skip-browser-warning"] = "true";
  return config;
});

/** True when the server rejected the session rather than the request. */
export const isAuthError = (error: unknown) =>
  isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403);

let onUnauthorized: (() => void) | null = null;

/**
 * Called when any request comes back 401.
 *
 * A session can stop being valid while the app is open — the token expires, or
 * the account it points at is gone. Without this the app keeps acting signed
 * in and fails at the next write with a confusing per-screen error.
 */
export const setUnauthorizedHandler = (handler: (() => void) | null) => {
  onUnauthorized = handler;
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (isAuthError(error)) onUnauthorized?.();
    return Promise.reject(error);
  }
);

/**
 * Pull a human-readable message out of a failed request.
 *
 * The server answers with `message` in some places and `error` in others, and
 * a network failure has neither. Screens should show the result of this rather
 * than a raw axios error, which reads as "Request failed with status code 400".
 */
export const errorMessage = (error: unknown, fallback: string): string => {
  if (isAxiosError(error)) {
    const data = error.response?.data as { message?: string; error?: string } | undefined;
    return data?.message || data?.error || fallback;
  }
  return fallback;
};

export default api;
