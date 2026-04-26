import type { ChatMode, Message } from "@/app/components/types";

type ChatPanelProps = {
  messages: Message[];
  question: string;
  activeScopeCount: number;
  isPending: boolean;
  mode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
  onQuestionChange: (value: string) => void;
  onAsk: () => void;
};

export function ChatPanel({
  messages,
  question,
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
        {messages.length === 0 ? (
          <div className="chat-welcome">
            <h2>Welcome to Research Space</h2>
            <p className="chat-hint">
              Select your sources and ask complex questions. Try Mode 2 for deep multi-agent reasoning.
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className={`chat-bubble ${msg.role}`}>
              {msg.role === "assistant" && msg.thinkers && msg.thinkers.length > 0 && (
                <div className="thinker-chain">
                  {msg.thinkers.map((t, tidx) => (
                    <div key={tidx} className="thinker-step">
                      <span className="thinker-label">{t.label}</span>
                      {t.response.length > 100 ? t.response.substring(0, 100) + "..." : t.response}
                    </div>
                  ))}
                </div>
              )}
              <div className="message-text">{msg.content}</div>
            </div>
          ))
        )}
        {isPending && (
          <div className="chat-bubble assistant thinking">
            <span className="thinker-label">Deep Researching...</span>
          </div>
        )}
      </div>

      <div className="chat-input-section">
        <textarea
          className="chat-input"
          value={question}
          onChange={(event) => onQuestionChange(event.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onAsk();
            }
          }}
          placeholder="Ask anything about your sources..."
        />

        <div className="chat-footer">
          <button 
            className="chat-submit"
            onClick={onAsk} 
            disabled={isPending || !question.trim()}
          >
            {isPending ? "Analysing..." : "Submit Query"}
          </button>
          <span className="mode-info">
            {mode === "standard"
              ? "Standard Search"
              : mode === "mode1"
                ? "Reasoning Mode"
                : "Deep Multi-Agent Mode"}
          </span>
        </div>
      </div>
    </div>
  );
}
