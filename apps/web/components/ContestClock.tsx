"use client";
import { useEffect, useState } from "react";
import { parseClock } from "../app/lib/time";

export const ContestClock = ({ endTime }: { endTime: Date }) => {
  const [mounted, setMounted] = useState(false);
  const [currentTimeLeft, setCurrentTimeLeft] = useState(0);

  useEffect(() => {
    setMounted(true);
    const endTimeMs = new Date(endTime).getTime();
    setCurrentTimeLeft(Math.max(0, endTimeMs - Date.now()));

    const interval = setInterval(() => {
      setCurrentTimeLeft(Math.max(0, endTimeMs - Date.now()));
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime]);

  return (
    <main className="flex-1 md:py-8 rounded-lg shadow-md px-4 md:px-6">
      <div className="flex items-center justify-center text-gray-500 dark:text-gray-400">
        {mounted && currentTimeLeft > 0 ? (
          <div>{parseClock(currentTimeLeft / 1000)}</div>
        ) : mounted ? (
          <div>00:00:00</div>
        ) : (
          <div>--:--:--</div>
        )}
      </div>
    </main>
  );
};

