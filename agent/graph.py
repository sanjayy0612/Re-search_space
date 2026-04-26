from langgraph.graph import END, START, StateGraph

from nodes import (
    AgentState,
    connector_node,
    devils_advocate_node,
    dynamic_retrieval_node,
    judge_node,
    router_node,
    skeptic_node,
    summarizer_node,
    web_search_node,
    wikipedia_lookup_node,
)

graph = StateGraph(AgentState)

graph.add_node("summarizer", summarizer_node)
graph.add_node("skeptic", skeptic_node)
graph.add_node("devils_advocate", devils_advocate_node)
graph.add_node("connector", connector_node)
graph.add_node("router", router_node)
graph.add_node("web_search", web_search_node)
graph.add_node("dynamic_retrieval", dynamic_retrieval_node)
graph.add_node("wikipedia_lookup", wikipedia_lookup_node)
graph.add_node("judge", judge_node)

graph.add_edge(START, "summarizer")
graph.add_edge("summarizer", "skeptic")
graph.add_edge("skeptic", "devils_advocate")
graph.add_edge("devils_advocate", "connector")
graph.add_edge("connector", "router")

graph.add_conditional_edges(
    "router",
    lambda state: state["next_step"],
    {
        "web_search": "web_search",
        "dynamic_retrieval": "dynamic_retrieval",
        "wikipedia_lookup": "wikipedia_lookup",
        "judge": "judge",
    },
)

graph.add_edge("web_search", "router")
graph.add_edge("dynamic_retrieval", "router")
graph.add_edge("wikipedia_lookup", "router")
graph.add_edge("judge", END)

mode2_graph = graph.compile()
