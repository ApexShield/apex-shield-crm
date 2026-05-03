import { useState, useCallback, useRef, useEffect } from "react";

/**
 * Like useState but persists to sessionStorage so tab state survives
 * route changes in bottom-tab navigation.
 */
export default function usePersistedState(key, defaultValue) {
  const [value, setValue] = useState(() => {
    const stored = sessionStorage.getItem(key);
    if (stored !== null) {
      try { return JSON.parse(stored); } catch { return defaultValue; }
    }
    return defaultValue;
  });

  const set = useCallback((newVal) => {
    setValue(prev => {
      const resolved = typeof newVal === "function" ? newVal(prev) : newVal;
      try { sessionStorage.setItem(key, JSON.stringify(resolved)); } catch {}
      return resolved;
    });
  }, [key]);

  return [value, set];
}