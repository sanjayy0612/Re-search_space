"use client";

// Main dashboard UI for the app: imports sources, scopes which sources participate
// in retrieval, asks grounded questions, and shows citations.
import { useEffect, useState, useTransition } from "react";
import { ChatPanel } from "@/app/components/ChatPanel";
import { Sidebar } from "@/app/components/Sidebar";
import { TopBar } from "@/app/components/TopBar";
import type { Citation, ChatMode, Source, SourceDrawerTab, Message, Thinker } from "@/app/components/types";

export default function HomePage() {
  const [input, setInput] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const [sourceDrawerTab, setSourceDrawerTab] = useState<SourceDrawerTab>("urls");
  const [isCitationsOpen, setIsCitationsOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [chatMode, setChatMode] = useState<ChatMode>("standard");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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
      try {
        if (!input.trim()) {
          setError("Please enter a YouTube URL");
          return;
        }

        const response = await fetch("/api/videos/import", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ input })
        });

        if (!response.ok && response.status !== 500) {
          setError(`HTTP error: ${response.status}`);
          return;
        }

        let json: { error?: string; workspace?: unknown; videos?: unknown };
        try {
          json = (await response.json()) as { error?: string; workspace?: unknown; videos?: unknown };
        } catch {
          setError("Server returned invalid response");
          return;
        }

        if (json.error) {
          setError(json.error);
          return;
        }

        setInput("");
        await refreshAll();
      } catch (error) {
        console.error("Import failed:", error);
        const message = error instanceof Error ? error.message : "Failed to import";
        setError(`Import error: ${message}`);
      }
    });
  }

  async function handleFileImport() {
    if (!selectedFiles?.length) {
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        const formData = new FormData();

        for (const file of Array.from(selectedFiles)) {
          formData.append("files", file);
        }

        const response = await fetch("/api/files/import", {
          method: "POST",
          body: formData
        });

        if (!response.ok && response.status !== 500) {
          setError(`HTTP error: ${response.status}`);
          return;
        }

        let json: { error?: string };
        try {
          json = (await response.json()) as { error?: string };
        } catch {
          setError("Server returned invalid response");
          return;
        }

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
      } catch (error) {
        console.error("File import failed:", error);
        const message = error instanceof Error ? error.message : "Failed to import file";
        setError(`File import error: ${message}`);
      }
    });
  }

  async function handleAsk() {
    if (!question.trim()) return;
    
    const userQ = question;
    setQuestion("");
    setMessages(prev => [...prev, { role: "user", content: userQ }]);
    setError(null);

    startTransition(async () => {
      try {
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
            question: userQ,
            sourceIds: selectedSourceIds.length ? selectedSourceIds : undefined
          })
        });

        let json: {
          answer?: string;
          citations?: Citation[];
          finalAnswer?: string;
          thinkers?: Thinker[];
          error?: string;
        };

        try {
          json = (await response.json()) as {
            answer?: string;
            citations?: Citation[];
            finalAnswer?: string;
            thinkers?: Thinker[];
            error?: string;
          };
        } catch {
          setError(`Server returned invalid response (HTTP ${response.status})`);
          return;
        }

        if (!response.ok) {
          setError(json.error ?? `HTTP error: ${response.status}`);
          return;
        }

        if (json.error) {
          setError(json.error);
          return;
        }

        const botAnswer = json.answer ?? json.finalAnswer ?? "";
        setMessages(prev => [...prev, { 
          role: "assistant", 
          content: botAnswer,
          thinkers: json.thinkers
        }]);
        setCitations(json.citations ?? []);
        await refreshAll();
      } catch (error) {
        console.error("Chat failed:", error);
        const message = error instanceof Error ? error.message : "Chat failed";
        setError(`Chat error: ${message}`);
      }
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

        <div className="main-layout">
          <Sidebar
            sourceDrawerTab={sourceDrawerTab}
            input={input}
            selectedFiles={selectedFiles}
            isPending={isPending}
            sources={sources}
            selectedSourceIds={selectedSourceIds}
            chatMode={chatMode}
            isCitationsOpen={isCitationsOpen}
            citations={citations}
            onTabChange={setSourceDrawerTab}
            onInputChange={setInput}
            onFilesChange={setSelectedFiles}
            onImport={handleImport}
            onFileImport={handleFileImport}
            onToggleSource={toggleSource}
            onDeleteSource={handleDelete}
            onModeChange={setChatMode}
            onToggleCitations={() => setIsCitationsOpen((current) => !current)}
          />

          <section className="chat-container">
            <ChatPanel
              messages={messages}
              question={question}
              activeScopeCount={selectedSourceIds.length || sources.length}
              isPending={isPending}
              mode={chatMode}
              onModeChange={setChatMode}
              onQuestionChange={setQuestion}
              onAsk={handleAsk}
            />

            {error ? <p className="failure app-error">{error}</p> : null}
          </section>
        </div>
      </main>
    </>
  );
}
