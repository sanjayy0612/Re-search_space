"use client";

// Main dashboard UI for the app: imports videos, scopes which videos participate
// in retrieval, asks grounded questions, and shows citations plus cross-video themes.
import { useEffect, useState, useTransition } from "react";

type Video = {
  id: string;
  title: string;
  channelName: string | null;
  thumbnailUrl: string | null;
  summary: string | null;
  ingestionStatus: string;
  failureReason: string | null;
};

type Citation = {
  chunkId: string;
  title: string;
  startSec: number;
  endSec: number;
  content: string;
};

type Connection = {
  label: string;
  videos: string[];
  strength: number;
};

export default function HomePage() {
  const [input, setInput] = useState("");
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideoIds, setSelectedVideoIds] = useState<string[]>([]);
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

    const videosJson = (await videosResponse.json()) as { videos?: Video[]; error?: string };
    const connectionsJson = (await connectionsResponse.json()) as {
      connections?: Connection[];
    };

    if (videosJson.error) {
      setError(videosJson.error);
      return;
    }

    setVideos(videosJson.videos ?? []);
    setConnections(connectionsJson.connections ?? []);
    setSelectedVideoIds((current) =>
      current.filter((id) => (videosJson.videos ?? []).some((video) => video.id === id))
    );
  }

  function toggleVideo(videoId: string) {
    setSelectedVideoIds((current) =>
      current.includes(videoId)
        ? current.filter((id) => id !== videoId)
        : [...current, videoId]
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
          videoIds: selectedVideoIds.length ? selectedVideoIds : undefined
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
        <h1>YouTube Research Dashboard</h1>
        <p className="lede">
          Paste one or many YouTube links, build a transcript-backed knowledge base,
          and ask grounded questions across videos with timestamped citations.
        </p>
      </section>

      <section className="layout">
        <aside className="panel panel-tall">
          <div className="panel-head">
            <h2>Import Videos</h2>
            <span>{videos.length} tracked</span>
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

          <div className="library">
            {videos.map((video) => (
              <article key={video.id} className="video-card">
                <label className="video-toggle">
                  <input
                    type="checkbox"
                    checked={selectedVideoIds.includes(video.id)}
                    onChange={() => toggleVideo(video.id)}
                  />
                  <span>Use in chat</span>
                </label>

                <div className="video-meta">
                  <div>
                    <h3>{video.title}</h3>
                    <p>{video.channelName ?? "Unknown creator"}</p>
                  </div>
                  <span className={`status status-${video.ingestionStatus.toLowerCase()}`}>
                    {video.ingestionStatus.replaceAll("_", " ")}
                  </span>
                </div>

                {video.summary ? <p className="summary">{video.summary}</p> : null}
                {video.failureReason ? <p className="failure">{video.failureReason}</p> : null}

                <button className="ghost" onClick={() => handleDelete(video.id)} disabled={isPending}>
                  Remove
                </button>
              </article>
            ))}
          </div>
        </aside>

        <section className="main-column">
          <div className="panel">
            <div className="panel-head">
              <h2>Cross-Video Chat</h2>
              <span>{selectedVideoIds.length || videos.length} videos in scope</span>
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
                  <span>
                    {formatTimestamp(citation.startSec)} - {formatTimestamp(citation.endSec)}
                  </span>
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
