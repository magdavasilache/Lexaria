import { useEffect, useState } from "react";
import type { ReadingSession } from "../types/readingTypes";

export const useElapsedSeconds = (session: ReadingSession | null | undefined, syncedAt: number) => {
  const [now, setNow] = useState(() => Date.now());
  const running = Boolean(session && !session.is_paused);

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [running]);

  if (!session) return 0;
  if (session.is_paused) return session.elapsed_seconds;
  return session.elapsed_seconds + Math.max(0, Math.floor((now - syncedAt) / 1000));
};

const pad = (value: number) => String(value).padStart(2, "0");

export const formatClock = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
};
