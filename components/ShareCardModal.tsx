"use client";

import { useEffect, useRef, useState } from "react";
import { drawShareCard } from "@/lib/shareCard";
import type { Unit, WorkoutSession } from "@/lib/types";

interface NavigatorShareFile {
  canShare?: (data: { files: File[] }) => boolean;
  share?: (data: { files?: File[]; title?: string }) => Promise<void>;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ShareCardModal({
  session,
  unit,
  newPrNames,
  onClose,
}: {
  session: WorkoutSession;
  unit: Unit;
  newPrNames: string[];
  onClose: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawShareCard(canvas, {
      dayName: session.dayName,
      date: session.date,
      exercises: session.exercises,
      unit,
      newPrNames,
    }).then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [session, unit, newPrNames]);

  function getBlob(): Promise<Blob | null> {
    const canvas = canvasRef.current;
    if (!canvas) return Promise.resolve(null);
    return new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
  }

  async function handleShare() {
    if (busy) return;
    setBusy(true);
    try {
      const blob = await getBlob();
      if (!blob) return;
      const file = new File([blob], `arc-workout-${session.date}.png`, { type: "image/png" });
      const nav = navigator as Navigator & NavigatorShareFile;
      if (nav.share && nav.canShare?.({ files: [file] })) {
        await nav.share({ files: [file], title: "Mijn workout" });
      } else {
        downloadBlob(blob, file.name);
      }
    } catch {
      // share sheet dismissed by the user — nothing to do
    } finally {
      setBusy(false);
    }
  }

  async function handleSave() {
    if (busy) return;
    setBusy(true);
    try {
      const blob = await getBlob();
      if (blob) downloadBlob(blob, `arc-workout-${session.date}.png`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="share-modal-backdrop" onClick={onClose}>
      <div className="share-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="share-close" onClick={onClose} aria-label="Sluiten">
          &times;
        </button>
        <div className="share-preview">
          <canvas ref={canvasRef} className="share-canvas" />
          {!ready && <div className="share-loading">Kaart maken...</div>}
        </div>
        <div className="share-actions">
          <button type="button" className="finish-btn" onClick={handleShare} disabled={!ready || busy}>
            Delen
          </button>
          <button type="button" className="share-save-btn" onClick={handleSave} disabled={!ready || busy}>
            Opslaan
          </button>
        </div>
      </div>
    </div>
  );
}
