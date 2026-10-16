import { useState, useCallback } from "react";

export const useDebounce = (delay = 300) => {
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const debounce = useCallback(
    (fn: () => void) => {
      if (timer) clearTimeout(timer);
      const newTimer = setTimeout(fn, delay);
      setTimer(newTimer);
    },
    [timer, delay]
  );

  return debounce;
};
