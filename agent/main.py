from contextlib import asynccontextmanager
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI
from pydantic import BaseModel, Field

from graph import mode2_graph
from nodes import AgentState


@asynccontextmanager
async def lifespan(_: FastAPI):
    load_dotenv()
    yield


app = FastAPI(lifespan=lifespan)


class Mode2Request(BaseModel):
    question: str = Field(min_length=1)
    chunks: list[str]


class ThinkerResponse(BaseModel):
    role: str
    label: str
    response: str


class Mode2Response(BaseModel):
    finalAnswer: str
    thinkers: list[ThinkerResponse]


@app.post("/mode2", response_model=Mode2Response)
async def run_mode2(request: Mode2Request) -> Mode2Response:
    context = "\n\n---\n\n".join(request.chunks)
    initial_state: AgentState = {
        "question": request.question,
        "context": context,
        "history": [],
        "thinkers": [],
        "final_answer": "",
    }

    result = await mode2_graph.ainvoke(initial_state)
    final_answer = str(result["final_answer"])
    thinkers = [
        ThinkerResponse.model_validate(cast_thinker(entry))
        for entry in result["thinkers"]
    ]

    return Mode2Response(finalAnswer=final_answer, thinkers=thinkers)


def cast_thinker(entry: Any) -> dict[str, str]:
    return {
        "role": str(entry["role"]),
        "label": str(entry["label"]),
        "response": str(entry["response"]),
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
