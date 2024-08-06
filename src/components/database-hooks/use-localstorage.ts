import { useCallback, useState } from "react";

export function useLocalStorage<T>(key: string | undefined, defaultValue: T) {
  const [changed, setChanged] = useState(false);
  const [value, setValue] = useState(() => {
    const savedValue = key && typeof window !== "undefined" ? window.localStorage.getItem(key) ?? "null" : "null";
    return (JSON.parse(savedValue) as T) ?? defaultValue;
  });

  const changeValue = useCallback(
    function changeValue(value: T | ((old: T) => T), save = true) {
      setValue((prev) => {
        const newVal = typeof value === "function" ? (value as (old: T) => T)(prev) : value;
        if (!key) return newVal;

        if (save) {
          window.localStorage.setItem(key, JSON.stringify(newVal));
          setChanged(false);
        } else {
          setChanged(true);
        }
        return newVal;
      });
    },
    [key]
  );

  return [value, changeValue, changed] as const;
}
