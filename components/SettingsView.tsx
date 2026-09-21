"use client";

import { useRef, useState } from "react";
import { useSyncExternalStore } from "react";
import { exportData, getServerSnapshot, getSnapshot, importData, resetAllData, setUnit, subscribe } from "@/lib/store";
import type { Unit } from "@/lib/types";

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
