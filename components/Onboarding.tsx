"use client";

import { useRouter } from "next/navigation";
import { chooseBlankProgram, chooseDefaultProgram } from "@/lib/store";

export default function Onboarding() {
  const router = useRouter();

  function useExample() {
    chooseDefaultProgram();
    router.push("/");
  }

  function startBlank() {
    chooseBlankProgram();
    router.push("/schema");
  }

  return (
    <div className="onboarding">
      <div className="onboarding-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19V9M10 19V5M16 19v-7M20 19v-3" />
        </svg>
      </div>
      <h1>Welkom bij Arc</h1>
      <p className="onboarding-text">
        Jouw persoonlijke trainingslog. Stel je eigen trainingsdagen en oefeningen samen, log sets,
        reps en gewicht, en bouw een historie op met grafieken en records. Alles blijft lokaal op
        dit toestel.
      </p>
      <div className="onboarding-actions">
        <button type="button" className="finish-btn" onClick={useExample}>
          Begin met een voorbeeldschema
        </button>
        <button type="button" className="settings-btn" onClick={startBlank}>
          Ik stel mijn eigen schema samen
        </button>
      </div>
    </div>
  );
}
