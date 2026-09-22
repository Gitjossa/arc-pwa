"use client";

import { useState } from "react";
import { todayIso } from "@/lib/date";

const WEEKDAY_LABELS = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];
const MONTH_LABELS = [
  "januari",
  "februari",
  "maart",
  "april",
  "mei",
  "juni",
  "juli",
  "augustus",
  "september",
  "oktober",
  "november",
  "december",
];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toIso(year: number, month: number, day: number): string {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

export default function HistoryCalendar({
  sessionDates,
  selectedDate,
  onSelect,
}: {
  sessionDates: Set<string>;
  selectedDate: string | null;
  onSelect: (date: string | null) => void;
}) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const leading = (firstOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const today = todayIso();

  function shiftMonth(delta: number) {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  }

  const cells: Array<{ day: number; iso: string } | null> = [];
  for (let i = 0; i < leading; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push({ day, iso: toIso(viewYear, viewMonth, day) });

  return (
    <div className="calendar-card">
      <div className="calendar-head">
        <button type="button" onClick={() => shiftMonth(-1)} aria-label="Vorige maand">
          &lsaquo;
        </button>
        <span>
          {MONTH_LABELS[viewMonth]} {viewYear}
        </span>
        <button type="button" onClick={() => shiftMonth(1)} aria-label="Volgende maand">
          &rsaquo;
        </button>
      </div>
      <div className="calendar-weekdays">
        {WEEKDAY_LABELS.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>
      <div className="calendar-grid">
        {cells.map((cell, i) => {
          if (!cell) return <div key={`blank-${i}`} className="calendar-cell empty" />;
          const hasSession = sessionDates.has(cell.iso);
          const isToday = cell.iso === today;
          const isSelected = cell.iso === selectedDate;
          return (
            <button
              key={cell.iso}
              type="button"
              className={`calendar-cell${isToday ? " today" : ""}${isSelected ? " selected" : ""}`}
              onClick={() => onSelect(isSelected ? null : cell.iso)}
              disabled={!hasSession}
            >
              {cell.day}
              {hasSession && <span className="calendar-dot" />}
            </button>
          );
        })}
      </div>
      {selectedDate && (
        <button type="button" className="calendar-clear" onClick={() => onSelect(null)}>
          Toon alle sessies
        </button>
      )}
    </div>
  );
}
