import { useCallback, useEffect, useRef, useState } from "react";

/*
 * Local countdown timer. Computes remaining time from a deadline so it
 * stays accurate, and clears its interval on stop and on unmount.
 */
export function useCountdown(seconds: number) {
  const [remaining, setRemaining] = useState(seconds);
  const [running, setRunning] = useState(false);

  const deadline = useRef(0);
  const intervalId = useRef<number | null>(null);

  const clear = useCallback(() => {
    if (intervalId.current !== null) {
      window.clearInterval(intervalId.current);
      intervalId.current = null;
    }
  }, []);

  const start = useCallback(() => {
    clear();
    deadline.current = Date.now() + seconds * 1000;
    setRemaining(seconds);
    setRunning(true);

    intervalId.current = window.setInterval(() => {
      const left = Math.max(
        0,
        Math.ceil((deadline.current - Date.now()) / 1000),
      );

      setRemaining(left);

      if (left === 0) {
        clear();
        setRunning(false);
      }
    }, 250);
  }, [clear, seconds]);

  const stop = useCallback(() => {
    clear();
    setRunning(false);
  }, [clear]);

  const reset = useCallback(() => {
    clear();
    setRunning(false);
    setRemaining(seconds);
  }, [clear, seconds]);

  useEffect(() => clear, [clear]);

  return { remaining, running, start, stop, reset };
}

export function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
