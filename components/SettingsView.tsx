"use client";

import { useRef, useState } from "react";
import { useSyncExternalStore } from "react";
import {
  exportData,
  getServerSnapshot,
  getSnapshot,
  importData,
  resetAllData,
  setCountdownEnabled,
  setCountdownRange,
  setUnit,
  subscribe,
} from "@/lib/store";
import type { Unit } from "@/lib/types";
import Switch from "./Switch";

export default function SettingsView() {
  const data = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  function handleExport() {
    const json = exportData();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `arc-data-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = importData(String(reader.result));
      setMessage(
        result.ok
          ? { text: "Data succesvol geimporteerd.", ok: true }
          : { text: result.error, ok: false },
      );
    };
    reader.readAsText(file);
  }

  function handleReset() {
    if (confirm("Alle data wissen? Dit verwijdert je schema, historie en instellingen permanent.")) {
      resetAllData();
      setMessage({ text: "Alle data is gewist.", ok: true });
    }
  }

  return (
    <div className="wrap">
      <div className="brand-row">
        <h1>Instellingen</h1>
      </div>
      <p className="subtitle">Eenheden en je data beheren.</p>

      <div className="settings-card">
        <div className="settings-label">Eenheid</div>
        <div className="unit-toggle">
          {(["kg", "lbs"] as Unit[]).map((u) => (
            <button
              key={u}
              type="button"
              className={`unit-btn${data.settings.unit === u ? " active" : ""}`}
              onClick={() => setUnit(u)}
            >
              {u}
            </button>
          ))}
        </div>
        <p className="settings-hint">Verandert alleen het label, geen automatische omrekening.</p>
      </div>

      <div className="settings-card">
        <div className="settings-row">
          <div className="settings-label settings-label-inline">AYCE countdown</div>
          <Switch
            checked={data.settings.countdownEnabled}
            onChange={setCountdownEnabled}
            label="AYCE countdown aan- of uitzetten"
          />
        </div>
        <p className="settings-hint">
          Toont een voortgangsbalk op de homepage tussen twee data, met percentage en aantal dagen
          te gaan.
        </p>
        {data.settings.countdownEnabled && (
          <div className="countdown-dates">
            <div className="countdown-date-field">
              <label htmlFor="countdown-start">Startdatum</label>
              <input
                id="countdown-start"
                type="date"
                value={data.settings.countdownStart}
                onChange={(e) => setCountdownRange(e.target.value, data.settings.countdownEnd)}
              />
            </div>
            <div className="countdown-date-field">
              <label htmlFor="countdown-end">Einddatum</label>
              <input
                id="countdown-end"
                type="date"
                value={data.settings.countdownEnd}
                onChange={(e) => setCountdownRange(data.settings.countdownStart, e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      <div className="settings-card">
        <div className="settings-label">Data</div>
        <p className="settings-hint">
          Je data staat alleen lokaal op dit toestel. Exporteer regelmatig een back-up, of gebruik
          het om je data over te zetten naar een ander toestel.
        </p>
        <div className="settings-actions">
          <button type="button" className="settings-btn" onClick={handleExport}>
            Exporteer data
          </button>
          <button type="button" className="settings-btn" onClick={handleImportClick}>
            Importeer data
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="hidden-file-input"
          onChange={handleFileChange}
        />
        {message && (
          <p className={`settings-message${message.ok ? "" : " error"}`}>{message.text}</p>
        )}
      </div>

      <div className="settings-card">
        <div className="settings-label">Gevarenzone</div>
        <button type="button" className="settings-btn danger-btn" onClick={handleReset}>
          Alle data wissen
        </button>
      </div>
    </div>
  );
}
