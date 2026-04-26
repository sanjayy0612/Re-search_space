import os
from typing import TypedDict

import httpx
from groq import AsyncGroq

from prompts import (
    CONNECTOR_SYSTEM_PROMPT,
    DEVILS_ADVOCATE_SYSTEM_PROMPT,
    JUDGE_SYSTEM_PROMPT,
    SKEPTIC_SYSTEM_PROMPT,
    SUMMARIZER_SYSTEM_PROMPT,
)

OLLAMA_CHAT_URL = "http://localhost:11434/api/chat"
OLLAMA_MODEL = "qwen2.5:3b"
GROQ_MODEL = "llama-3.1-8b-instant"


class HistoryEntry(TypedDict):
    role: str
    label: str
    response: str


class AgentState(TypedDict):
    question: str
    context: str
    history: list[HistoryEntry]
    thinkers: list[HistoryEntry]
    final_answer: str


def format_history(history: list[HistoryEntry]) -> str:
    if not history:
        return "No prior persona responses yet."

    return "\n\n".join(
        f"=== {entry['label']} said ===\n{entry['response']}" for entry in history
    )


def build_persona_user_message(state: AgentState) -> str:
    return (
        f"Question:\n{state['question']}\n\n"
        f"Raw Chunks:\n{state['context']}\n\n"
        f"Conversation History So Far:\n{format_history(state['history'])}"
    )


def build_judge_user_message(state: AgentState) -> str:
    return (
        f"Question:\n{state['question']}\n\n"
        f"Raw Chunks:\n{state['context']}\n\n"
        f"Full Reasoning Chain:\n{format_history(state['history'])}"
    )


async def call_ollama(system_prompt: str, user_message: str) -> str:
    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(
            OLLAMA_CHAT_URL,
            json={
                "model": OLLAMA_MODEL,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message},
                ],
                "stream": False,
            },
        )

    response.raise_for_status()
    data = response.json()
    message = data.get("message", {})
    content = message.get("content", "")
    return content.strip()


async def call_groq(system_prompt: str, user_message: str) -> str:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY is required for the judge node.")

    client = AsyncGroq(api_key=api_key)
    response = await client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ],
    )

    content = response.choices[0].message.content
    return (content or "").strip()


def append_thinker(
    state: AgentState, role: str, label: str, response: str
) -> AgentState:
    entry: HistoryEntry = {"role": role, "label": label, "response": response}
    return {
        **state,
        "history": [*state["history"], entry],
        "thinkers": [*state["thinkers"], entry],
    }


async def summarizer_node(state: AgentState) -> AgentState:
    response = await call_ollama(
        SUMMARIZER_SYSTEM_PROMPT,
        build_persona_user_message(state),
    )
    return append_thinker(state, "summarizer", "Summarizer", response)


async def skeptic_node(state: AgentState) -> AgentState:
    response = await call_ollama(
        SKEPTIC_SYSTEM_PROMPT,
        build_persona_user_message(state),
    )
    return append_thinker(state, "skeptic", "Skeptic", response)


async def devils_advocate_node(state: AgentState) -> AgentState:
    response = await call_ollama(
        DEVILS_ADVOCATE_SYSTEM_PROMPT,
        build_persona_user_message(state),
    )
    return append_thinker(state, "devils_advocate", "Devil's Advocate", response)


async def connector_node(state: AgentState) -> AgentState:
    response = await call_ollama(
        CONNECTOR_SYSTEM_PROMPT,
        build_persona_user_message(state),
    )
    return append_thinker(state, "connector", "Connector", response)


async def judge_node(state: AgentState) -> AgentState:
    response = await call_groq(
        JUDGE_SYSTEM_PROMPT,
        build_judge_user_message(state),
    )
    return {
        **state,
        "final_answer": response,
    }
