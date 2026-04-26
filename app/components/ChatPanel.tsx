import type { ChatMode } from "@/app/components/types";

type ChatPanelProps = {
  question: string;
  answer: string;
  activeScopeCount: number;
  isPending: boolean;
  mode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
  onQuestionChange: (value: string) => void;
  onAsk: () => void;
};

export function ChatPanel({
  question,
  answer,
  activeScopeCount,
  isPending,
  mode,
  onModeChange,
  onQuestionChange,
  onAsk
}: ChatPanelProps) {
  return (
    <div className="panel chat-panel">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Grounded chat</p>
          <h2>What do you want to understand?</h2>
          <div className="mode-switch" aria-label="Chat mode switch">
            <button
              className={mode === "standard" ? "mode-chip mode-chip-active" : "mode-chip"}
              onClick={() => onModeChange("standard")}
            >
              Standard
            </button>
            <button
              className={mode === "mode1" ? "mode-chip mode-chip-active" : "mode-chip"}
              onClick={() => onModeChange("mode1")}
            >
              Mode 1
            </button>
            <button
              className={mode === "mode2" ? "mode-chip mode-chip-active" : "mode-chip"}
              onClick={() => onModeChange("mode2")}
            >
              Mode 2
            </button>
          </div>
        </div>
        <span>{activeScopeCount} sources in scope</span>
      </div>

      <textarea
        className="chat-box"
        value={question}
        onChange={(event) => onQuestionChange(event.target.value)}
        placeholder="Ask for a summary, contradiction, comparison, causal chain, or practical takeaway."
      />

      <div className="chat-actions">
        <button className="action" onClick={onAsk} disabled={isPending || !question.trim()}>
          {isPending ? "Thinking..." : "Ask with citations"}
        </button>
        <span>
          {mode === "standard"
            ? "Standard retrieval + answer route"
            : mode === "mode1"
              ? "Mode 1: local thinker chain + judge"
              : "Mode 2: FastAPI LangGraph multi-agent chain"}
        </span>
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
  );
}
