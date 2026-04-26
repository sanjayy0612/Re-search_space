import type { Citation } from "@/app/components/types";

function formatTimestamp(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function formatCitationLocation(citation: Citation) {
  if (citation.startSec !== null && citation.endSec !== null) {
    return `${formatTimestamp(citation.startSec)} - ${formatTimestamp(citation.endSec)}`;
  }

  return citation.locator ?? "Excerpt";
}
