"use client";

export default function FinishCelebration({ show }: { show: boolean }) {
  if (!show) return null;

  return (
    <div className="finish-celebration" aria-hidden="true">
      <span className="finish-celebration-text">Let&apos;s gooooo</span>
    </div>
  );
}
