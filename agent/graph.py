from langgraph.graph import END, START, StateGraph

from nodes import (
    AgentState,
    connector_node,
    devils_advocate_node,
    judge_node,
    skeptic_node,
    summarizer_node,
)

graph = StateGraph(AgentState)

graph.add_node("summarizer", summarizer_node)
graph.add_node("skeptic", skeptic_node)
graph.add_node("devils_advocate", devils_advocate_node)
graph.add_node("connector", connector_node)
graph.add_node("judge", judge_node)

graph.add_edge(START, "summarizer")
graph.add_edge("summarizer", "skeptic")
graph.add_edge("skeptic", "devils_advocate")
graph.add_edge("devils_advocate", "connector")
graph.add_edge("connector", "judge")
graph.add_edge("judge", END)

mode2_graph = graph.compile()
