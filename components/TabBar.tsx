"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HistoryIcon, HomeIcon, SchemaIcon, SettingsIcon, TodayIcon } from "./icons";

const TABS = [
  { href: "/", label: "Home", Icon: HomeIcon },
  { href: "/schema", label: "Schema", Icon: SchemaIcon },
  { href: "/vandaag", label: "Vandaag", Icon: TodayIcon, primary: true },
  { href: "/historie", label: "Historie", Icon: HistoryIcon },
  { href: "/instellingen", label: "Instellingen", Icon: SettingsIcon },
];

export default function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="tab-bar">
      {TABS.map(({ href, label, Icon, primary }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`tab-item${active ? " active" : ""}${primary ? " primary" : ""}`}
          >
            <span className="tab-item-icon">
              <Icon active={active} />
            </span>
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
