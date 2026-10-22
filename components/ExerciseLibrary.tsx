"use client";

import { useState, useSyncExternalStore } from "react";
import {
  addLibraryExercise,
  deleteLibraryExercise,
  getServerSnapshot,
  getSnapshot,
  subscribe,
} from "@/lib/store";

export default function ExerciseLibrary() {
  const data = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [search, setSearch] = useState("");
  const [newName, setNewName] = useState("");

  const filtered = data.library
    .filter((l) => l.name.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  function submit() {
    const name = newName.trim();
    if (!name) return;
    addLibraryExercise(name);
    setNewName("");
  }

  return (
    <div className="wrap">
      <div className="brand-row">
        <h1>Oefeningen</h1>
      </div>
      <p className="subtitle">Alle oefeningen die je kunt kiezen in je schema of tijdens je workout.</p>

      <div className="add-row">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder="Nieuwe oefening toevoegen..."
        />
        <button type="button" onClick={submit}>
          + Toevoegen
        </button>
      </div>

      <input
        className="library-search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Zoek in oefeningen..."
      />
      <div className="library-list tall">
        {filtered.length === 0 && <p className="empty-state small">Geen oefeningen gevonden.</p>}
        {filtered.map((lib) => (
          <div key={lib.id} className="library-item">
            <span>{lib.name}</span>
            <button
              type="button"
              className="danger"
              onClick={() => deleteLibraryExercise(lib.id)}
              aria-label={`${lib.name} verwijderen uit oefeningen`}
            >
              &times;
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
