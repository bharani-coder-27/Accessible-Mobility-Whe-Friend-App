/**
 * Shared field validators.
 *
 * Kept in one place so the sign-up form, the profile editor and the server's
 * own rules cannot drift apart — a phone number the profile screen accepts but
 * registration rejects is a confusing bug to hit.
 */

/** Minimum password length. Matches the hint shown under the field. */
export const MIN_PASSWORD_LENGTH = 8;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[0-9]{10}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const ALPHANUMERIC_PATTERN = /^[A-Za-z0-9]+$/;

export const isValidEmail = (value: string) => EMAIL_PATTERN.test(value.trim());

export const isValidPhone = (value: string) => PHONE_PATTERN.test(value.trim());

export const isValidDate = (value: string) => DATE_PATTERN.test(value.trim());

export const isAlphanumeric = (value: string) => ALPHANUMERIC_PATTERN.test(value.trim());

export const isStrongEnough = (value: string) => value.length >= MIN_PASSWORD_LENGTH;

/** Format a Date as the YYYY-MM-DD the API expects, in local time. */
export const toIsoDate = (date: Date) => {
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};

/** Render HH:mm:ss as a friendlier 12-hour time, e.g. "9:05 am". */
export const formatTime = (value: string | null | undefined) => {
  if (!value) return "";

  const [rawHours, rawMinutes] = value.split(":");
  const hours = Number(rawHours);
  if (Number.isNaN(hours)) return value;

  const period = hours >= 12 ? "pm" : "am";
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHours}:${rawMinutes ?? "00"} ${period}`;
};
