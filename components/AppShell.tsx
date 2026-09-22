"use client";

import { useSyncExternalStore } from "react";
import { getServerSnapshot, getSnapshot, subscribe } from "@/lib/store";
import Onboarding from "./Onboarding";
import TabBar from "./TabBar";

function noopSubscribe() {
  return () => {};
}

/** True once this component has completed its first client-side render after hydration. */
function useHasHydrated(): boolean {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const hasHydrated = useHasHydrated();
  const data = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Onboarding status lives in localStorage, unknown during SSR. Rendering nothing
  // for this one frame avoids briefly flashing the onboarding screen at every
  // cold start for someone who already set up their program.
  if (!hasHydrated) {
    return null;
  }

  if (!data.settings.onboarded) {
    return <Onboarding />;
  }

  return (
    <>
      <div className="app-content">{children}</div>
      <TabBar />
    </>
  );
}
