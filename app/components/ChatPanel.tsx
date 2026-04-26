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
    <div className="chat-panel">
      <div className="chat-content">
        {!answer && !question ? (
          <div className="chat-welcome">
            <h2>What do you want to understand?</h2>
            <p className="chat-hint">Ask for a summary, contradiction, comparison, causal chain, or practical takeaway.</p>
          </div>
        ) : null}

        {answer ? (
          <div className="answer-section">
            <div className="answer-block">
              <h3>Answer</h3>
              <p>{answer}</p>
            </div>
          </div>
        ) : null}
      </div>

      <div className="chat-input-section">
        <textarea
          className="chat-input"
          value={question}
          onChange={(event) => onQuestionChange(event.target.value)}
          placeholder="Ask anything about your sources..."
          rows={3}
        />

        <div className="chat-footer">
          <button 
            className="chat-submit"
            onClick={onAsk} 
            disabled={isPending || !question.trim()}
          >
            {isPending ? "Thinking..." : "Ask with citations"}
          </button>
          <span className="mode-info">
            {mode === "standard"
              ? "Standard retrieval"
              : mode === "mode1"
                ? "Mode 1 reasoning"
                : "Mode 2 chain"}
          </span>
        </div>
      </div>
    </div>
  );
}
