import { formatCitationLocation } from "@/app/components/formatters";
import type { Citation } from "@/app/components/types";

type CitationsPanelProps = {
  citations: Citation[];
};

export function CitationsPanel({ citations }: CitationsPanelProps) {
  return (
    <div className="panel">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Evidence</p>
          <h2>Citations</h2>
        </div>
        <span>{citations.length} supporting chunks</span>
      </div>

      <div className="citations">
        {citations.length ? (
          citations.map((citation) => (
            <article key={citation.chunkId} className="citation-card">
              <strong>{citation.title}</strong>
              <span>{formatCitationLocation(citation)}</span>
              <p>{citation.content}</p>
            </article>
          ))
        ) : (
          <p className="empty-note">Supporting chunks will appear after a grounded answer.</p>
        )}
      </div>
    </div>
  );
}
