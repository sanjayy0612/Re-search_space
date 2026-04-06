"use client";

// Main dashboard UI for the app: imports videos, scopes which videos participate
// in retrieval, asks grounded questions, and shows citations plus cross-video themes.
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

type Connection = {
  label: string;
  videos: string[];
  strength: number;
};

export default function HomePage() {
  const [input, setInput] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [citations, setCitations] = useState<Citation[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    void refreshAll();
  }, []);

  async function refreshAll() {
    // The page treats videos and inferred connections as one snapshot so the
    // library, chat scope, and side panel stay in sync after every mutation.
    const [videosResponse, connectionsResponse] = await Promise.all([
      fetch("/api/videos"),
      fetch("/api/connections")
    ]);

    const videosJson = (await videosResponse.json()) as { sources?: Source[]; error?: string };
    const connectionsJson = (await connectionsResponse.json()) as {
      connections?: Connection[];
    };

    if (videosJson.error) {
      setError(videosJson.error);
      return;
    }

    setSources(videosJson.sources ?? []);
    setConnections(connectionsJson.connections ?? []);
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
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">Weekend Project</p>
        <h1>Mixed-Source Research Dashboard</h1>
        <p className="lede">
          Mix YouTube links and uploaded text files into one searchable knowledge base,
          then ask grounded questions with source-aware citations.
        </p>
      </section>

      <section className="layout">
        <aside className="panel panel-tall">
          <div className="panel-head">
            <h2>Import Sources</h2>
            <span>{sources.length} tracked</span>
          </div>

          <textarea
            className="import-box"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Paste one or more YouTube links, each on a new line or separated by spaces."
          />

          <button className="action" onClick={handleImport} disabled={isPending || !input.trim()}>
            {isPending ? "Processing..." : "Import transcripts"}
          </button>

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
        </aside>

        <section className="main-column">
          <div className="panel">
            <div className="panel-head">
              <h2>Cross-Source Chat</h2>
              <span>{selectedSourceIds.length || sources.length} sources in scope</span>
            </div>

            <textarea
              className="chat-box"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask for a summary, comparison, contradiction, or practical takeaway."
            />

            <button className="action" onClick={handleAsk} disabled={isPending || !question.trim()}>
              {isPending ? "Thinking..." : "Ask with citations"}
            </button>

            {answer ? (
              <div className="answer-block">
                <h3>Answer</h3>
                <p>{answer}</p>
              </div>
            ) : null}
          </div>

          <div className="panel">
            <div className="panel-head">
              <h2>Citations</h2>
              <span>{citations.length} supporting chunks</span>
            </div>

            <div className="citations">
              {citations.map((citation) => (
                <article key={citation.chunkId} className="citation-card">
                  <strong>{citation.title}</strong>
                  <span>{formatCitationLocation(citation)}</span>
                  <p>{citation.content}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <aside className="panel panel-tall">
          <div className="panel-head">
            <h2>Connections</h2>
            <span>GraphRAG-ready</span>
          </div>

          <div className="connections">
            {connections.map((connection) => (
              <article key={`${connection.label}-${connection.videos.join("-")}`} className="connection-card">
                <strong>{connection.label}</strong>
                <p>{connection.videos.join(", ")}</p>
                <span>Strength {connection.strength}/5</span>
              </article>
            ))}
          </div>

          {error ? <p className="failure">{error}</p> : null}
        </aside>
      </section>
    </main>
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
