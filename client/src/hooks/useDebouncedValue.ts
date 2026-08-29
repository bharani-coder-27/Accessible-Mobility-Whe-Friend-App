import { useEffect, useState } from 'react';

/**
 * Delay propagating a rapidly-changing value.
 *
 * Used for the address autocomplete, which previously fired a Places request
 * on every keystroke — a dozen billed calls to type one stop name, and a list
 * that flickered as out-of-order responses landed.
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
