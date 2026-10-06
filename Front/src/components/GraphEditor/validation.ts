import type {GraphEdgeData} from './types';

/** Would adding source->target create a multi-node cycle, given the existing edges? Self-loops are not this function's concern — check allowSelfLoop separately. */
export function wouldCreateCycle(edges: GraphEdgeData[], source: string, target: string): boolean {
  if (source === target) return false;

  const adjacency = new Map<string, string[]>();
  edges.forEach((edge) => {
    const list = adjacency.get(edge.source) ?? [];
    list.push(edge.target);
    adjacency.set(edge.source, list);
  });

  // A cycle appears iff target can already reach back to source.
  const visited = new Set<string>();
  const stack = [target];

  while (stack.length > 0) {
    const current = stack.pop()!;
    if (current === source) return true;
    if (visited.has(current)) continue;
    visited.add(current);
    stack.push(...(adjacency.get(current) ?? []));
  }

  return false;
}