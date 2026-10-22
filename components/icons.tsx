type IconProps = { active?: boolean };

const common = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function HomeIcon({ active }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...common} opacity={active ? 1 : 0.6}>
      <path d="M4 11.5L12 4l8 7.5" />
      <path d="M6 10v9.5h12V10" />
      <path d="M10 19.5v-6h4v6" />
    </svg>
  );
}

export function TodayIcon({ active }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...common} opacity={active ? 1 : 0.6}>
      <rect x="3.5" y="4.5" width="17" height="16" rx="3" />
      <path d="M3.5 9.5h17" />
      <path d="M8 3v3M16 3v3" />
      <path d="M8.5 13.5l2.2 2.2 4.3-4.3" />
    </svg>
  );
}

export function SchemaIcon({ active }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...common} opacity={active ? 1 : 0.6}>
      <rect x="3.5" y="4.5" width="17" height="16" rx="3" />
      <path d="M3.5 9.5h17" />
      <path d="M8 3v3M16 3v3" />
      <path d="M8 13h2M14 13h2M8 16.5h2" />
    </svg>
  );
}

export function PlayIcon({ active }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...common} opacity={active ? 1 : 0.6}>
      <path d="M8 5.5v13l11-6.5z" fill="currentColor" />
    </svg>
  );
}

export function DumbbellIcon({ active }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...common} opacity={active ? 1 : 0.6}>
      <path d="M7 8v8M17 8v8M4 10v4M20 10v4M7 12h10" />
    </svg>
  );
}

export function HistoryIcon({ active }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...common} opacity={active ? 1 : 0.6}>
      <path d="M4 19V9M10 19V5M16 19v-7M20 19v-3" />
    </svg>
  );
}

export function SettingsIcon({ active }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...common} opacity={active ? 1 : 0.6}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
