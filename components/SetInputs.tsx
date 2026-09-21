"use client";

import type { Unit } from "@/lib/types";

function RepsInput({
  resetKey,
  value,
  onCommit,
}: {
  resetKey: string;
  value: string;
  onCommit: (value: string) => void;
}) {
  return (
    <div className="set-field">
      <input
        key={resetKey}
        className="ex-input"
        type="number"
        inputMode="numeric"
        placeholder="reps"
        defaultValue={value}
        onBlur={(e) => {
          const v = e.target.value;
          if (v && v !== value) onCommit(v);
        }}
      />
      <span className="unit-suffix">reps</span>
    </div>
  );
}

function KgInput({
  resetKey,
  placeholder,
  unit,
  onCommit,
}: {
  resetKey: string;
  placeholder: string;
  unit: Unit;
  onCommit: (value: string) => void;
}) {
  return (
    <div className="set-field">
      <input
        key={resetKey}
        className="ex-input"
        type="number"
        inputMode="decimal"
        placeholder={placeholder}
        defaultValue=""
        onBlur={(e) => {
          const v = e.target.value;
          if (v) {
            onCommit(v);
            e.target.value = "";
          }
        }}
      />
      <span className="unit-suffix">{unit}</span>
    </div>
  );
}

export { RepsInput, KgInput };
