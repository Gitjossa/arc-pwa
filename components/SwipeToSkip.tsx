"use client";

import { useRef, useState } from "react";

const REVEAL_WIDTH = 84;

type DragStart = { x: number; y: number; locked: "h" | "v" | null; baseX: number };

export default function SwipeToSkip({
  children,
  onSkip,
  label,
}: {
  children: React.ReactNode;
  onSkip: () => void;
  label: string;
}) {
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const openRef = useRef(false);
  const startRef = useRef<DragStart | null>(null);

  function handlePointerDown(e: React.PointerEvent) {
    startRef.current = { x: e.clientX, y: e.clientY, locked: null, baseX: dragX };
    setDragging(true);
  }

  function handlePointerMove(e: React.PointerEvent) {
    const start = startRef.current;
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;

    if (!start.locked) {
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
        start.locked = Math.abs(dx) > Math.abs(dy) ? "h" : "v";
      } else {
        return;
      }
    }
    if (start.locked !== "h") return;

    e.preventDefault();
    const next = Math.min(0, Math.max(-REVEAL_WIDTH - 24, start.baseX + dx));
    setDragX(next);
  }

  function finishDrag() {
    const start = startRef.current;
    startRef.current = null;
    setDragging(false);
    if (!start) return;

    if (start.locked !== "h") {
      // A tap (no real movement) while the action was revealed closes it again.
      if (openRef.current) {
        setDragX(0);
        openRef.current = false;
      }
      return;
    }

    if (dragX <= -REVEAL_WIDTH / 2) {
      setDragX(-REVEAL_WIDTH);
      openRef.current = true;
    } else {
      setDragX(0);
      openRef.current = false;
    }
  }

  return (
    <div className="swipe-wrap">
      <div className="swipe-action" style={{ width: REVEAL_WIDTH }}>
        <button
          type="button"
          className="swipe-action-btn"
          onClick={() => {
            setDragX(0);
            openRef.current = false;
            onSkip();
          }}
        >
          {label}
        </button>
      </div>
      <div
        className="swipe-content"
        style={{
          transform: `translateX(${dragX}px)`,
          transition: dragging ? "none" : "transform 0.2s ease",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
      >
        {children}
      </div>
    </div>
  );
}
