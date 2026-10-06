import {BaseEdge, getBezierPath, type Edge, type EdgeProps} from '@xyflow/react';
import EdgeDeleteButton from './EdgeDeleteButton';
import EdgeLabelField from './EdgeLabelField';
import type {GraphEdgeRenderData} from './edgeData';

const GraphEdge = ({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  style,
  data,
}: EdgeProps<Edge<GraphEdgeRenderData>>) => {
  const [edgePath, labelX, labelY] = getBezierPath({sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition});

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      {data?.onLabelChange && (
        <EdgeLabelField x={labelX} y={labelY - 18} label={data.label} onChange={data.onLabelChange} />
      )}
      {data?.onRemove && <EdgeDeleteButton x={labelX} y={labelY} onRemove={data.onRemove} />}
    </>
  );
};

export default GraphEdge;
