import type { Source, SourceDrawerTab } from "@/app/components/types";

type SourceDrawerProps = {
  isOpen: boolean;
  tab: SourceDrawerTab;
  input: string;
  selectedFiles: FileList | null;
  sources: Source[];
  selectedSourceIds: string[];
  isPending: boolean;
  onClose: () => void;
  onTabChange: (tab: SourceDrawerTab) => void;
  onInputChange: (value: string) => void;
  onFilesChange: (files: FileList | null) => void;
  onImport: () => void;
  onFileImport: () => void;
  onToggleSource: (sourceId: string) => void;
  onDeleteSource: (sourceId: string) => void;
};

export function SourceDrawer({
  isOpen,
  tab,
  input,
  selectedFiles,
  sources,
  selectedSourceIds,
  isPending,
  onClose,
  onTabChange,
  onInputChange,
  onFilesChange,
  onImport,
  onFileImport,
  onToggleSource,
  onDeleteSource
}: SourceDrawerProps) {
  return (
    <>
      <div className={`drawer-scrim ${isOpen ? "drawer-scrim-open" : ""}`} onClick={onClose} />

      <aside className={`source-drawer ${isOpen ? "source-drawer-open" : ""}`}>
        <div className="drawer-head">
          <div>
            <p className="drawer-kicker">Add context</p>
            <h2>Source Studio</h2>
          </div>
          <button className="drawer-close" onClick={onClose}>
            Close
          </button>
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

        <section className="drawer-library">
          <div className="panel-head">
            <h3>Source Library</h3>
            <span>{sources.length} tracked</span>
          </div>

          <div className="library">
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
    </>
  );
}
