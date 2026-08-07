"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AnalysisStudio } from "@/components/AnalysisStudio";

function AnalyzeContent() {
  const searchParams = useSearchParams();

  return (
    <AnalysisStudio
      startWithDemo={searchParams.get("demo") === "true"}
    />
  );
}

export default function AnalyzePage() {
  return (
    <Suspense fallback={null}>
      <AnalyzeContent />
    </Suspense>
  );
}
