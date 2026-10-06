import dagre from '@dagrejs/dagre';
import type {Edge, Node} from '@xyflow/react';
import type {GraphNodeData} from './types';

export const GRAPH_NODE_WIDTH = 180;
export const GRAPH_NODE_HEIGHT = 56;

export function layoutGraph(
  nodes: Node<GraphNodeData, 'graphNode'>[],
  edges: Edge[],
  direction: 'TB' | 'LR',
): Node<GraphNodeData, 'graphNode'>[] {
  const graph = new dagre.graphlib.Graph();
  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({rankdir: direction, nodesep: 48, ranksep: 80});

  nodes.forEach((node) => {
    graph.setNode(node.id, {width: GRAPH_NODE_WIDTH, height: GRAPH_NODE_HEIGHT});
  });

  edges.forEach((edge) => {
    // dagre has no concept of a self-loop edge — skip it, the node still gets laid out.
    if (edge.source === edge.target) return;
    graph.setEdge(edge.source, edge.target);
  });

  dagre.layout(graph);

  return nodes.map((node) => {
    const position = graph.node(node.id);
    return {
      ...node,
      position: {
        x: position.x - GRAPH_NODE_WIDTH / 2,
        y: position.y - GRAPH_NODE_HEIGHT / 2,
      },
    };
  });
}