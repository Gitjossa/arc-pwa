"use client";

import { useEffect, useState } from "react";

export default function RegisterServiceWorker() {
  const [updateReady, setUpdateReady] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const hadController = !!navigator.serviceWorker.controller;
    const onControllerChange = () => {
      if (hadController) setUpdateReady(true);
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    let registration: ServiceWorkerRegistration | undefined;
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        registration = reg;
      })
      .catch(() => {
        // offline support is a nice-to-have, not critical
      });

    // Installed PWAs rarely re-check for updates on their own; ask whenever the app comes back to the foreground.
    const onVisible = () => {
      if (document.visibilityState === "visible") registration?.update().catch(() => {});
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  if (!updateReady) return null;

  return (
    <div className="update-banner" role="status">
      <span>Nieuwe versie beschikbaar</span>
      <button type="button" onClick={() => window.location.reload()}>
        Vernieuwen
      </button>
    </div>
  );
}
