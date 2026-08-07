import { AnalysisStudio } from "@/components/AnalysisStudio";

export default async function AnalyzePage({ searchParams }: { searchParams: Promise<{ demo?: string }> }) {
  const params = await searchParams;
  return <AnalysisStudio startWithDemo={params.demo === "true"} />;
}
