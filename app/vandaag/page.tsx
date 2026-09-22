import { Suspense } from "react";
import WorkoutTracker from "@/components/WorkoutTracker";

export default function VandaagPage() {
  return (
    <Suspense fallback={null}>
      <WorkoutTracker />
    </Suspense>
  );
}
