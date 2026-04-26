"use client";

// Main dashboard UI for the app: imports sources, scopes which sources participate
// in retrieval, asks grounded questions, and shows citations.
import { useEffect, useState, useTransition } from "react";
import { ChatPanel } from "@/app/components/ChatPanel";
import { CitationsPanel } from "@/app/components/CitationsPanel";
import { ScopePanel } from "@/app/components/ScopePanel";
import { TopBar } from "@/app/components/TopBar";
import type { Citation, ChatMode, Source, SourceDrawerTab } from "@/app/components/types";

export default function HomePage() {
  const [input, setInput] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const [sourceDrawerTab, setSourceDrawerTab] = useState<SourceDrawerTab>("urls");
  const [isSourceStudioOpen, setIsSourceStudioOpen] = useState(true);
  const [isCitationsOpen, setIsCitationsOpen] = useState(true);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [citations, setCitations] = useState<Citation[]>([]);
  const [chatMode, setChatMode] = useState<ChatMode>("standard");
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
      const endpoint =
        chatMode === "standard"
          ? "/api/chat"
          : chatMode === "mode1"
            ? "/api/chat/mode1"
            : "/api/chat/mode2";

      const response = await fetch(endpoint, {
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
        finalAnswer?: string;
        error?: string;
      };

      if (json.error) {
        setError(json.error);
        return;
      }

      setAnswer(json.answer ?? json.finalAnswer ?? "");
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
      <main className="shell">
        <TopBar />

        <aside className="workspace-toggle-rail" aria-label="Workspace panel controls">
          <button
            className={isSourceStudioOpen ? "workspace-toggle workspace-toggle-active" : "workspace-toggle"}
            onClick={() => setIsSourceStudioOpen((current) => !current)}
            aria-pressed={isSourceStudioOpen}
          >
            Studio
          </button>
          <button
            className={isCitationsOpen ? "workspace-toggle workspace-toggle-active" : "workspace-toggle"}
            onClick={() => setIsCitationsOpen((current) => !current)}
            aria-pressed={isCitationsOpen}
          >
            Cite
          </button>
        </aside>

        <section
          className={`workspace-layout ${isSourceStudioOpen ? "with-source" : ""} ${isCitationsOpen ? "with-citations" : ""}`}
        >
          {isSourceStudioOpen ? (
            <ScopePanel
              tab={sourceDrawerTab}
              input={input}
              selectedFiles={selectedFiles}
              isPending={isPending}
              sources={sources}
              selectedSourceIds={selectedSourceIds}
              readySources={readySources}
              activeScopeCount={activeScopeCount}
              onTabChange={setSourceDrawerTab}
              onInputChange={setInput}
              onFilesChange={setSelectedFiles}
              onImport={handleImport}
              onFileImport={handleFileImport}
              onToggleSource={toggleSource}
              onDeleteSource={handleDelete}
            />
          ) : null}

          <section className="chat-stage">
            <ChatPanel
              question={question}
              answer={answer}
              activeScopeCount={activeScopeCount}
              isPending={isPending}
              mode={chatMode}
              onModeChange={setChatMode}
              onQuestionChange={setQuestion}
              onAsk={handleAsk}
            />

            {error ? <p className="failure app-error">{error}</p> : null}
          </section>

          {isCitationsOpen ? (
            <aside className="citations-dock">
              <CitationsPanel citations={citations} />
            </aside>
          ) : null}
        </section>
      </main>
    </>
  );
}
