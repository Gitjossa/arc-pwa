"use client";

import type { Unit } from "@/lib/types";

/**
 * `value` is only what the user typed (shown in white). `placeholder` is the light-grey
 * suggestion from last time — it is never committed unless the user types something.
 */
function SetInput({
  resetKey,
  value,
  placeholder,
  suffix,
  inputMode,
  onCommit,
}: {
  resetKey: string;
  value: string;
  placeholder: string;
  suffix: string;
  inputMode: "numeric" | "decimal";
  onCommit: (value: string) => void;
}) {
  return (
    <div className="set-field">
      <input
        key={`${resetKey}-${value}`}
        className="ex-input"
        type="number"
        inputMode={inputMode}
        placeholder={placeholder}
        defaultValue={value}
        onBlur={(e) => {
          if (e.target.value !== value) onCommit(e.target.value);
        }}
      />
      <span className="unit-suffix">{suffix}</span>
    </div>
  );
}

function RepsInput(props: { resetKey: string; value: string; placeholder: string; onCommit: (value: string) => void }) {
  return <SetInput {...props} suffix="reps" inputMode="numeric" />;
}

function KgInput(props: {
  resetKey: string;
  value: string;
  placeholder: string;
  unit: Unit;
  onCommit: (value: string) => void;
}) {
  const { unit, ...rest } = props;
  return <SetInput {...rest} suffix={unit} inputMode="decimal" />;
}

export { RepsInput, KgInput };
