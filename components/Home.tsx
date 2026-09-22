"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSyncExternalStore } from "react";
import { currentStreakWeeks, thisWeekVolume } from "@/lib/history";
import { quoteOfTheDay } from "@/lib/quotes";
import { getServerSnapshot, getSnapshot, subscribe } from "@/lib/store";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return "Nog wakker?";
  if (hour < 12) return "Goedemorgen";
  if (hour < 18) return "Goedemiddag";
  return "Goedenavond";
}

export default function Home() {
  const data = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const { history } = data;
  const streak = useMemo(() => currentStreakWeeks(history), [history]);
  const volume = useMemo(() => thisWeekVolume(history), [history]);
  const quote = useMemo(() => quoteOfTheDay(), []);

  return (
    <div className="wrap home-wrap">
      <div className="home-header">
        <p className="home-greeting">{greeting()}</p>
        <h1>Klaar om te trainen?</h1>
      </div>

      <div className="quote-card">
        <p>&ldquo;{quote}&rdquo;</p>
      </div>

      <div className="stat-row">
        <div className="stat-tile">
          <div className="stat-value">
            {streak} {streak === 1 ? "week" : "weken"}
          </div>
          <div className="stat-label">op rij getraind</div>
        </div>
        <div className="stat-tile">
          <div className="stat-value">{Math.round(volume.current).toLocaleString("nl-NL")}</div>
          <div className="stat-label">{data.settings.unit} volume deze week</div>
        </div>
        <div className="stat-tile">
          <div className="stat-value">{history.length}</div>
          <div className="stat-label">sessies gelogd</div>
        </div>
      </div>

      <Link href="/vandaag" className="start-btn">
        Start je training
      </Link>
    </div>
  );
}
