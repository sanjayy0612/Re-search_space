"use client";

// Main dashboard UI for the app: imports sources, scopes which sources participate
// in retrieval, asks grounded questions, and shows citations.
import { useEffect, useState, useTransition } from "react";

type Source = {
  id: string;
  sourceType: "VIDEO" | "FILE";
  title: string;
  subtitle: string | null;
  summary: string | null;
  ingestionStatus: string;
  failureReason: string | null;
};

type Citation = {
  sourceId: string;
  sourceType: "VIDEO" | "FILE";
  chunkId: string;
  title: string;
  startSec: number | null;
  endSec: number | null;
  locator: string | null;
  content: string;
};

export default function HomePage() {
  const [input, setInput] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const [isSourceDrawerOpen, setIsSourceDrawerOpen] = useState(false);
  const [sourceDrawerTab, setSourceDrawerTab] = useState<"urls" | "files">("urls");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [citations, setCitations] = useState<Citation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const readySources = sources.filter((source) => source.ingestionStatus === "READY").length;
  const activeScopeCount = selectedSourceIds.length || sources.length;

  useEffect(() => {
    void refreshAll();
  }, []);

  async function refreshAll() {
    // Keep the drawer library and chat scope in sync after every source mutation.
    const videosResponse = await fetch("/api/videos");
    const videosJson = (await videosResponse.json()) as { sources?: Source[]; error?: string };

    if (videosJson.error) {
      setError(videosJson.error);
      return;
    }

    setSources(videosJson.sources ?? []);
    setSelectedSourceIds((current) =>
      current.filter((id) => (videosJson.sources ?? []).some((source) => source.id === id))
    );
  }

  function toggleSource(sourceId: string) {
    setSelectedSourceIds((current) =>
      current.includes(sourceId)
        ? current.filter((id) => id !== sourceId)
        : [...current, sourceId]
    );
  }

  async function handleImport() {
    setError(null);
    startTransition(async () => {
      const response = await fetch("/api/videos/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ input })
      });

      const json = (await response.json()) as { error?: string };
      if (json.error) {
        setError(json.error);
        return;
      }

      setInput("");
      await refreshAll();
      setIsSourceDrawerOpen(false);
    });
  }

  async function handleFileImport() {
    if (!selectedFiles?.length) {
      return;
    }

    setError(null);
    startTransition(async () => {
      const formData = new FormData();

      for (const file of Array.from(selectedFiles)) {
        formData.append("files", file);
      }

      const response = await fetch("/api/files/import", {
        method: "POST",
        body: formData
      });

      const json = (await response.json()) as { error?: string };
      if (json.error) {
        setError(json.error);
        return;
      }

      setSelectedFiles(null);
      const fileInput = document.getElementById("file-import-input") as HTMLInputElement | null;
      if (fileInput) {
        fileInput.value = "";
      }
      await refreshAll();
      setIsSourceDrawerOpen(false);
    });
  }

  async function handleAsk() {
    setError(null);
    startTransition(async () => {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          question,
          sourceIds: selectedSourceIds.length ? selectedSourceIds : undefined
        })
      });

      const json = (await response.json()) as {
        answer?: string;
        citations?: Citation[];
        error?: string;
      };

      if (json.error) {
        setError(json.error);
        return;
      }

      setAnswer(json.answer ?? "");
      setCitations(json.citations ?? []);
      setQuestion("");
      await refreshAll();
    });
  }

  async function handleDelete(videoId: string) {
    setError(null);
    startTransition(async () => {
      const response = await fetch(`/api/videos/${videoId}`, {
        method: "DELETE"
      });
      const json = (await response.json()) as { error?: string };
      if (json.error) {
        setError(json.error);
        return;
      }
      await refreshAll();
    });
  }

  return (
    <>
      <aside className="source-rail" aria-label="Source drawer controls">
        <button
          className={sourceDrawerTab === "urls" ? "rail-button rail-button-active" : "rail-button"}
          onClick={() => {
            setSourceDrawerTab("urls");
            setIsSourceDrawerOpen(true);
          }}
          aria-label="Open URL import drawer"
        >
          URL
        </button>
        <button
          className={sourceDrawerTab === "files" ? "rail-button rail-button-active" : "rail-button"}
          onClick={() => {
            setSourceDrawerTab("files");
            setIsSourceDrawerOpen(true);
          }}
          aria-label="Open file import drawer"
        >
          File
        </button>
        <span className="rail-pulse" />
      </aside>

      <div
        className={`drawer-scrim ${isSourceDrawerOpen ? "drawer-scrim-open" : ""}`}
        onClick={() => setIsSourceDrawerOpen(false)}
      />

      <aside className={`source-drawer ${isSourceDrawerOpen ? "source-drawer-open" : ""}`}>
        <div className="drawer-head">
          <div>
            <p className="drawer-kicker">Add context</p>
            <h2>Source Studio</h2>
          </div>
          <button className="drawer-close" onClick={() => setIsSourceDrawerOpen(false)}>
            Close
          </button>
        </div>

        <div className="drawer-tabs">
          <button
            className={sourceDrawerTab === "urls" ? "drawer-tab drawer-tab-active" : "drawer-tab"}
            onClick={() => setSourceDrawerTab("urls")}
          >
            YouTube URLs
          </button>
          <button
            className={sourceDrawerTab === "files" ? "drawer-tab drawer-tab-active" : "drawer-tab"}
            onClick={() => setSourceDrawerTab("files")}
          >
            Files
          </button>
        </div>

        {sourceDrawerTab === "urls" ? (
          <section className="drawer-pane">
            <h3>Paste links</h3>
            <p>Add one or many YouTube links. Each video is transcribed, chunked, embedded, and indexed in your shared context space.</p>
            <textarea
              className="import-box"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Paste YouTube links here, one per line or separated by spaces."
            />

            <button className="action" onClick={handleImport} disabled={isPending || !input.trim()}>
              {isPending ? "Processing..." : "Import transcripts"}
            </button>
          </section>
        ) : (
          <section className="drawer-pane">
            <h3>Upload files</h3>
            <p>Upload research notes and datasets. Text files are chunked and added to the same retrieval index as your videos.</p>
            <div className="file-import">
              <input
                id="file-import-input"
                type="file"
                multiple
                accept=".txt,.md,.mdx,.csv,.json,text/plain,text/markdown,text/csv,application/json"
                onChange={(event) => setSelectedFiles(event.target.files)}
              />

              <button
                className="ghost"
                onClick={handleFileImport}
                disabled={isPending || !selectedFiles?.length}
              >
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
                    onChange={() => toggleSource(source.id)}
                  />
                  <span>Use in chat</span>
                </label>

                <div className="video-meta">
                  <div>
                    <h3>{source.title}</h3>
                    <p>{source.subtitle ?? (source.sourceType === "VIDEO" ? "Unknown creator" : "Uploaded file")}</p>
                  </div>
                  <span className={`status status-${source.ingestionStatus.toLowerCase()}`}>
                    {source.ingestionStatus.replaceAll("_", " ")}
                  </span>
                </div>

                <p className="source-kind">
                  {source.sourceType === "VIDEO" ? "YouTube video" : "File"}
                </p>
                {source.summary ? <p className="summary">{source.summary}</p> : null}
                {source.failureReason ? <p className="failure">{source.failureReason}</p> : null}

                <button className="ghost" onClick={() => handleDelete(source.id)} disabled={isPending}>
                  Remove
                </button>
              </article>
            ))}
          </div>
        </section>
      </aside>

      <main className="shell">
        <header className="topbar">
          <div>
            <p className="eyebrow">Multi-source intelligence workspace</p>
            <h1>Context Atlas</h1>
          </div>

          <div className="topbar-actions" aria-label="Source import actions">
            <button
              className="ghost"
              onClick={() => {
                setSourceDrawerTab("urls");
                setIsSourceDrawerOpen(true);
              }}
            >
              Add URL
            </button>
            <button
              className="action"
              onClick={() => {
                setSourceDrawerTab("files");
                setIsSourceDrawerOpen(true);
              }}
            >
              Add files
            </button>
          </div>
        </header>

        <section className="layout">
          <aside className="scope-panel panel" aria-label="Source status">
            <div className="scope-intro">
              <p className="eyebrow">Workspace</p>
              <h2>Ask one question across every source.</h2>
              <p>
                Query all imported sources as one evidence graph, or constrain scope to exact
                items from the drawer.
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
                <button
                  className="text-button"
                  onClick={() => {
                    setSourceDrawerTab("urls");
                    setIsSourceDrawerOpen(true);
                  }}
                >
                  Manage
                </button>
              </div>

              {sources.length ? (
                <div className="scope-pills">
                  {(selectedSourceIds.length
                    ? sources.filter((source) => selectedSourceIds.includes(source.id))
                    : sources
                  ).slice(0, 6).map((source) => (
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

          <section className="main-column">
            <div className="panel chat-panel">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">Grounded chat</p>
                  <h2>What do you want to understand?</h2>
                </div>
                <span>{activeScopeCount} sources in scope</span>
              </div>

              <textarea
                className="chat-box"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Ask for a summary, comparison, contradiction, or practical takeaway."
              />

              <div className="chat-actions">
                <button className="action" onClick={handleAsk} disabled={isPending || !question.trim()}>
                  {isPending ? "Thinking..." : "Ask with citations"}
                </button>
                <span>Answers cite the exact chunks used.</span>
              </div>

              {answer ? (
                <div className="answer-block">
                  <h3>Answer</h3>
                  <p>{answer}</p>
                </div>
              ) : (
                <div className="answer-block empty-answer">
                  <h3>No answer yet</h3>
                  <p>Ask a question once your sources are ready.</p>
                </div>
              )}
            </div>

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

            {error ? <p className="failure app-error">{error}</p> : null}
          </section>
        </section>
      </main>
    </>
  );
}

function formatTimestamp(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatCitationLocation(citation: Citation) {
  if (citation.startSec !== null && citation.endSec !== null) {
    return `${formatTimestamp(citation.startSec)} - ${formatTimestamp(citation.endSec)}`;
  }

  return citation.locator ?? "Excerpt";
}
