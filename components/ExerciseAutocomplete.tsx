"use client";

import { useState } from "react";
import type { LibraryExercise } from "@/lib/types";

export default function ExerciseAutocomplete({
  library,
  value,
  onChange,
  onSubmit,
  placeholder,
}: {
  library: LibraryExercise[];
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder: string;
}) {
  const [focused, setFocused] = useState(false);

  const query = value.trim().toLowerCase();
  const matches = query ? library.filter((l) => l.name.toLowerCase().includes(query)).slice(0, 6) : [];
  const showSuggestions = focused && matches.length > 0;

  return (
    <div className="autocomplete">
      <div className="add-row">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSubmit();
          }}
          placeholder={placeholder}
        />
        <button type="button" onClick={onSubmit}>
          + Toevoegen
        </button>
      </div>
      {showSuggestions && (
        <div className="autocomplete-suggestions">
          {matches.map((lib) => (
            <button
              key={lib.id}
              type="button"
              className="autocomplete-suggestion"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onChange(lib.name);
                setFocused(false);
              }}
            >
              {lib.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
