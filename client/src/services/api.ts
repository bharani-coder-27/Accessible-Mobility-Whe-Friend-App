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
  return config;
});

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
