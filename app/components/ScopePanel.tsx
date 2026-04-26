import type { Source, SourceDrawerTab } from "@/app/components/types";

type ScopePanelProps = {
  tab: SourceDrawerTab;
  input: string;
  selectedFiles: FileList | null;
  isPending: boolean;
  sources: Source[];
  selectedSourceIds: string[];
  readySources: number;
  activeScopeCount: number;
  onTabChange: (tab: SourceDrawerTab) => void;
  onInputChange: (value: string) => void;
  onFilesChange: (files: FileList | null) => void;
  onImport: () => void;
  onFileImport: () => void;
  onToggleSource: (sourceId: string) => void;
  onDeleteSource: (sourceId: string) => void;
};

export function ScopePanel({
  tab,
  input,
  selectedFiles,
  isPending,
  sources,
  selectedSourceIds,
  readySources,
  activeScopeCount,
  onTabChange,
  onInputChange,
  onFilesChange,
  onImport,
  onFileImport,
  onToggleSource,
  onDeleteSource
}: ScopePanelProps) {
  const visibleScope = selectedSourceIds.length
    ? sources.filter((source) => selectedSourceIds.includes(source.id))
    : sources;

  return (
    <aside className="scope-panel panel" aria-label="Source status">
      <section className="sidebar-ingest">
        <div className="panel-head compact">
          <h3>Source Studio</h3>
          <span>{sources.length} tracked</span>
        </div>

        <div className="drawer-tabs">
          <button
            className={tab === "urls" ? "drawer-tab drawer-tab-active" : "drawer-tab"}
            onClick={() => onTabChange("urls")}
          >
            YouTube URLs
          </button>
          <button
            className={tab === "files" ? "drawer-tab drawer-tab-active" : "drawer-tab"}
            onClick={() => onTabChange("files")}
          >
            Files
          </button>
        </div>

        {tab === "urls" ? (
          <section className="drawer-pane">
            <h3>Paste links</h3>
            <p>
              Add one or many YouTube links. Each video is transcribed, chunked, embedded, and
              indexed in your shared context space.
            </p>
            <textarea
              className="import-box"
              value={input}
              onChange={(event) => onInputChange(event.target.value)}
              placeholder="Paste YouTube links here, one per line or separated by spaces."
            />

            <button className="action" onClick={onImport} disabled={isPending || !input.trim()}>
              {isPending ? "Processing..." : "Import transcripts"}
            </button>
          </section>
        ) : (
          <section className="drawer-pane">
            <h3>Upload files</h3>
            <p>
              Upload research notes and datasets. Text files are chunked and added to the same
              retrieval index as your videos.
            </p>
            <div className="file-import">
              <input
                id="file-import-input"
                type="file"
                multiple
                accept=".txt,.md,.mdx,.csv,.json,text/plain,text/markdown,text/csv,application/json"
                onChange={(event) => onFilesChange(event.target.files)}
              />

              <button className="ghost" onClick={onFileImport} disabled={isPending || !selectedFiles?.length}>
                {isPending ? "Uploading..." : "Upload files"}
              </button>
            </div>
          </section>
        )}
      </section>

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
          <span>{activeScopeCount} selected</span>
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

      <section>
        <div className="panel-head compact">
          <h3>Library</h3>
          <span>Toggle what chat can use</span>
        </div>

        <div className="library scope-library">
          {sources.map((source) => (
            <article key={source.id} className="video-card">
              <label className="video-toggle">
                <input
                  type="checkbox"
                  checked={selectedSourceIds.includes(source.id)}
                  onChange={() => onToggleSource(source.id)}
                />
                <span>Use in chat</span>
              </label>

              <div className="video-meta">
                <div>
                  <h3>{source.title}</h3>
                  <p>
                    {source.subtitle ??
                      (source.sourceType === "VIDEO" ? "Unknown creator" : "Uploaded file")}
                  </p>
                </div>
                <span className={`status status-${source.ingestionStatus.toLowerCase()}`}>
                  {source.ingestionStatus.replaceAll("_", " ")}
                </span>
              </div>

              <p className="source-kind">{source.sourceType === "VIDEO" ? "YouTube video" : "File"}</p>
              {source.summary ? <p className="summary">{source.summary}</p> : null}
              {source.failureReason ? <p className="failure">{source.failureReason}</p> : null}

              <button className="ghost" onClick={() => onDeleteSource(source.id)} disabled={isPending}>
                Remove
              </button>
            </article>
          ))}
        </div>
      </section>
    </aside>
  );
}
