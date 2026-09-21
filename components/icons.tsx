type IconProps = { active?: boolean };

const common = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

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
      <path d="M4 6h16M4 12h16M4 18h10" />
      <circle cx="19.5" cy="18" r="1.4" fill="currentColor" stroke="none" opacity={active ? 1 : 0} />
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
      <path d="M12 3.5v2.2M12 18.3v2.2M4.9 6.1l1.6 1.6M17.5 16.3l1.6 1.6M3.5 12h2.2M18.3 12h2.2M4.9 17.9l1.6-1.6M17.5 7.7l1.6-1.6" />
    </svg>
  );
}
