type TopBarProps = {
  onOpenUrls: () => void;
  onOpenFiles: () => void;
};

export function TopBar({ onOpenUrls, onOpenFiles }: TopBarProps) {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">Multi-source reasoning workspace</p>
        <h1>ThinkMesh</h1>
        <p className="hero-subtitle">
          Turn videos and documents into one searchable reasoning workspace with grounded, citation-first answers.
        </p>
        <div className="hero-chips" aria-label="Core capabilities">
          <span>Cross-source retrieval</span>
          <span>Mode 1 local thinkers</span>
          <span>Mode 2 LangGraph orchestration</span>
        </div>
      </div>

      <div className="topbar-actions" aria-label="Source import actions">
        <button className="ghost" onClick={onOpenUrls}>
          Add URL
        </button>
        <button className="action" onClick={onOpenFiles}>
          Add files
        </button>
      </div>
    </header>
  );
}
