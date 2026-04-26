import type { Source } from "@/app/components/types";

type ScopePanelProps = {
  sources: Source[];
  selectedSourceIds: string[];
  readySources: number;
  activeScopeCount: number;
  onManageScope: () => void;
};

export function ScopePanel({
  sources,
  selectedSourceIds,
  readySources,
  activeScopeCount,
  onManageScope
}: ScopePanelProps) {
  const visibleScope = selectedSourceIds.length
    ? sources.filter((source) => selectedSourceIds.includes(source.id))
    : sources;

  return (
    <aside className="scope-panel panel" aria-label="Source status">
      <div className="scope-intro">
        <p className="eyebrow">Workspace</p>
        <h2>Ask one question across every source.</h2>
        <p>
          Query all imported sources as one evidence graph, or constrain scope to exact items from
          the source studio.
        </p>
      </div>

      <div className="metric-grid">
        <div className="metric-card">
          <span>{sources.length}</span>
          <p>Total sources</p>
        </div>
        <div className="metric-card">
          <span>{readySources}</span>
          <p>Ready</p>
        </div>
        <div className="metric-card">
          <span>{activeScopeCount}</span>
          <p>In scope</p>
        </div>
      </div>

      <div className="scope-list">
        <div className="panel-head compact">
          <h3>Current scope</h3>
          <button className="text-button" onClick={onManageScope}>
            Manage
          </button>
        </div>

        {sources.length ? (
          <div className="scope-pills">
            {visibleScope.slice(0, 6).map((source) => (
              <span key={source.id} className="scope-pill">
                {source.sourceType === "VIDEO" ? "Video" : "File"} - {source.title}
              </span>
            ))}
            {activeScopeCount > 6 ? (
              <span className="scope-pill muted">+{activeScopeCount - 6} more</span>
            ) : null}
          </div>
        ) : (
          <p className="empty-note">Add a YouTube URL or text file to begin.</p>
        )}
      </div>
    </aside>
  );
}
