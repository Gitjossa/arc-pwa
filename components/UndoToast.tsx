"use client";

import { useSyncExternalStore } from "react";
import { dismissUndo, getUndoServerSnapshot, getUndoSnapshot, subscribeUndo, undoLast } from "@/lib/store";

export default function UndoToast() {
  const snapshot = useSyncExternalStore(subscribeUndo, getUndoSnapshot, getUndoServerSnapshot);

  if (!snapshot) return null;

  return (
    <div className="undo-toast" key={snapshot.token} role="status">
      <div className="undo-toast-bar" />
      <span className="undo-toast-message">{snapshot.message}</span>
      <button type="button" className="undo-toast-action" onClick={undoLast}>
        Ongedaan maken
      </button>
      <button type="button" className="undo-toast-dismiss" aria-label="Sluiten" onClick={dismissUndo}>
        &times;
      </button>
    </div>
  );
}
