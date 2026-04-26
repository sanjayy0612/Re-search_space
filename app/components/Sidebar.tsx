"use client";

import type { ChatMode, Source, SourceDrawerTab, Citation } from "@/app/components/types";

type SidebarProps = {
  sourceDrawerTab: SourceDrawerTab;
  input: string;
  selectedFiles: FileList | null;
  isPending: boolean;
  sources: Source[];
  selectedSourceIds: string[];
  chatMode: ChatMode;
  isCitationsOpen: boolean;
  citations: Citation[];
  onTabChange: (tab: SourceDrawerTab) => void;
  onInputChange: (value: string) => void;
  onFilesChange: (files: FileList | null) => void;
  onImport: () => void;
  onFileImport: () => void;
  onToggleSource: (sourceId: string) => void;
  onDeleteSource: (sourceId: string) => void;
  onModeChange: (mode: ChatMode) => void;
  onToggleCitations: () => void;
};

export function Sidebar({
  sourceDrawerTab,
  input,
  selectedFiles,
  isPending,
  sources,
  selectedSourceIds,
  chatMode,
  isCitationsOpen,
  citations,
  onTabChange,
  onInputChange,
  onFilesChange,
  onImport,
  onFileImport,
  onToggleSource,
  onDeleteSource,
  onModeChange,
  onToggleCitations
}: SidebarProps) {
  return (
    <aside className="sidebar">
      {/* New Workspace Button */}
      <div className="sidebar-header">
        <button className="new-workspace-btn">
          <span>+</span> New Workspace
        </button>
      </div>

      {/* Source Studio Section */}
      <div className="sidebar-section">
        <div className="section-title">
          <h3>Source Studio</h3>
          <span className="source-count">{sources.length}</span>
        </div>

        {/* Source Studio Tabs */}
        <div className="source-tabs">
          <button
            className={sourceDrawerTab === "urls" ? "source-tab active" : "source-tab"}
            onClick={() => onTabChange("urls")}
          >
            Links
          </button>
          <button
            className={sourceDrawerTab === "files" ? "source-tab active" : "source-tab"}
            onClick={() => onTabChange("files")}
          >
            Files
          </button>
        </div>

        {/* Add Links Tab */}
        {sourceDrawerTab === "urls" && (
          <div className="source-pane">
            <textarea
              className="source-input"
              value={input}
              onChange={(event) => onInputChange(event.target.value)}
              placeholder="Paste YouTube links, one per line..."
            />
            <button
              className="source-action-btn"
              onClick={onImport}
              disabled={isPending || !input.trim()}
            >
              {isPending ? "Processing..." : "Add Videos"}
            </button>
          </div>
        )}

        {/* Add Files Tab */}
        {sourceDrawerTab === "files" && (
          <div className="source-pane">
            <div className="file-input-wrapper">
              <input
                id="file-import-input"
                type="file"
                multiple
                accept=".txt,.md,.mdx,.csv,.json,text/plain,text/markdown,text/csv,application/json"
                onChange={(event) => onFilesChange(event.target.files)}
              />
              <label htmlFor="file-import-input" className="file-input-label">
                Choose files or drag here
              </label>
            </div>
            <button
              className="source-action-btn"
              onClick={onFileImport}
              disabled={isPending || !selectedFiles?.length}
            >
              {isPending ? "Uploading..." : "Add Files"}
            </button>
          </div>
        )}

        {/* Sources List */}
        <div className="sources-list">
          {sources.length ? (
            sources.map((source) => (
              <div key={source.id} className="source-item">
                <label className="source-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedSourceIds.includes(source.id)}
                    onChange={() => onToggleSource(source.id)}
                  />
                  <span className="checkmark" />
                </label>
                <div className="source-info">
                  <div className="source-title">{source.title}</div>
                  <div className="source-status">
                    <span className={`status ${source.ingestionStatus.toLowerCase()}`}>
                      {source.ingestionStatus.replaceAll("_", " ")}
                    </span>
                  </div>
                </div>
                <button
                  className="source-delete"
                  onClick={() => onDeleteSource(source.id)}
                  disabled={isPending}
                  title="Remove source"
                >
                  ✕
                </button>
              </div>
            ))
          ) : (
            <p className="empty-sources">No sources yet</p>
          )}
        </div>
      </div>

      {/* Mode Selection */}
      <div className="sidebar-section">
        <div className="section-title">
          <h3>Chat Mode</h3>
        </div>
        <div className="mode-buttons">
          <button
            className={`mode-btn ${chatMode === "standard" ? "active" : ""}`}
            onClick={() => onModeChange("standard")}
          >
            Standard
          </button>
          <button
            className={`mode-btn ${chatMode === "mode1" ? "active" : ""}`}
            onClick={() => onModeChange("mode1")}
          >
            Mode 1
          </button>
          <button
            className={`mode-btn ${chatMode === "mode2" ? "active" : ""}`}
            onClick={() => onModeChange("mode2")}
          >
            Mode 2
          </button>
        </div>
      </div>

      {/* Citations Section */}
      <div className="sidebar-section">
        <button
          className="citations-toggle"
          onClick={onToggleCitations}
        >
          <div className="citations-header">
            <h3>Citations</h3>
            <span className={`toggle-icon ${isCitationsOpen ? "open" : ""}`}>▼</span>
          </div>
        </button>

        {isCitationsOpen && (
          <div className="citations-list">
            {citations.length ? (
              citations.map((citation) => (
                <div key={citation.chunkId} className="citation-item">
                  <div className="citation-title">{citation.title}</div>
                  <div className="citation-content">{citation.content.substring(0, 100)}...</div>
                </div>
              ))
            ) : (
              <p className="empty-citations">No citations yet</p>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
