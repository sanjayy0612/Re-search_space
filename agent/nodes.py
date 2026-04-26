import os
from typing import TypedDict, Union
from .web_search import perform_web_search
from .dynamic_retrieval import dynamic_retrieval
from .knowledge_base_lookup import lookup_in_knowledge_base

import httpx
from groq import AsyncGroq

from prompts import (
    CONNECTOR_SYSTEM_PROMPT,
    DEVILS_ADVOCATE_SYSTEM_PROMPT,
    JUDGE_SYSTEM_PROMPT,
    ROUTER_SYSTEM_PROMPT,
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
    live_results: list[str]
    dynamic_chunks: list[str]
    tools_called: list[str]
    remaining_steps: int


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


async def router_node(state: AgentState) -> AgentState:
    # Router decides which tool to call or to proceed to judge
    prompt = f"Question: {state['question']}\nTools already called: {state['tools_called']}\nRemaining steps allowed: {state['remaining_steps']}"
    response = await call_ollama(ROUTER_SYSTEM_PROMPT, prompt)
    
    choice = "judge"
    if "web_search" in response.lower() and "web_search" not in state["tools_called"]:
        choice = "web_search"
    elif "dynamic_retrieval" in response.lower() and "dynamic_retrieval" not in state["tools_called"]:
        choice = "dynamic_retrieval"
    elif "wikipedia_lookup" in response.lower() and "wikipedia_lookup" not in state["tools_called"]:
        choice = "wikipedia_lookup"
    
    # If no more steps allowed or judge chosen
    if state["remaining_steps"] <= 0:
        choice = "judge"

    return {**state, "next_step": choice}


async def web_search_node(state: AgentState) -> AgentState:
    response = await perform_web_search(state["question"])
    result = "\n".join(response)

    new_state = {
        **state,
        "live_results": [*state.get("live_results", []), *response],
        "tools_called": [*state.get("tools_called", []), "web_search"],
        "remaining_steps": state["remaining_steps"] - 1
    }
    return append_thinker(new_state, "web_search", "Web Search", result)

async def dynamic_retrieval_node(state: AgentState) -> AgentState:
    new_chunks = await dynamic_retrieval(state.get("dynamic_chunks", []), state["question"], None) 

    new_state = {
        **state,
        "dynamic_chunks": new_chunks,
        "tools_called": [*state.get("tools_called", []), "dynamic_retrieval"],
        "remaining_steps": state["remaining_steps"] - 1
    }
    return append_thinker(new_state, "dynamic_retrieval", "Dynamic Retrieval", f"Retrieved {len(new_chunks)} new chunks.")

async def wikipedia_lookup_node(state: AgentState) -> AgentState:
    grounding_response = await lookup_in_knowledge_base(state["question"])

    new_state = {
        **state,
        "tools_called": [*state.get("tools_called", []), "wikipedia_lookup"],
        "remaining_steps": state["remaining_steps"] - 1
    }
    return append_thinker(new_state, "wikipedia_lookup", "Knowledge Base Lookup", grounding_response)

async def judge_node(state: AgentState) -> AgentState:
    response = await call_groq(
        JUDGE_SYSTEM_PROMPT,
        build_judge_user_message(state),
    )
    return {
        **state,
        "final_answer": response,
    }
