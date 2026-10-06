import {BaseEdge, type Edge, type EdgeProps} from '@xyflow/react';
import EdgeDeleteButton from './EdgeDeleteButton';
import EdgeLabelField from './EdgeLabelField';
import type {GraphEdgeRenderData} from './edgeData';

const LOOP_RADIUS = 64;

const SelfLoopEdge = ({
  sourceX,
  sourceY,
  targetX,
  targetY,
  markerEnd,
  style,
  data,
}: EdgeProps<Edge<GraphEdgeRenderData>>) => {
  // Handles sit on the same node, so bulge the curve out to whichever side has room
  // rather than trying to route between two nearly-coincident points.
  const isVertical = Math.abs(sourceY - targetY) >= Math.abs(sourceX - targetX);

  const path = isVertical
    ? `M ${sourceX} ${sourceY} C ${sourceX + LOOP_RADIUS} ${sourceY}, ${targetX + LOOP_RADIUS} ${targetY}, ${targetX} ${targetY}`
    : `M ${sourceX} ${sourceY} C ${sourceX} ${sourceY + LOOP_RADIUS}, ${targetX} ${targetY + LOOP_RADIUS}, ${targetX} ${targetY}`;

  const labelX = isVertical ? sourceX + LOOP_RADIUS : (sourceX + targetX) / 2;
  const labelY = isVertical ? (sourceY + targetY) / 2 : sourceY + LOOP_RADIUS;
  // Pushed further out along the same axis the loop bulges on, so it doesn't
  // sit on top of the delete button at (labelX, labelY).
  const edgeLabelX = isVertical ? labelX + 20 : labelX;
  const edgeLabelY = isVertical ? labelY : labelY + 20;

  return (
    <>
      <BaseEdge path={path} markerEnd={markerEnd} style={style} />
      {data?.onLabelChange && (
        <EdgeLabelField x={edgeLabelX} y={edgeLabelY} label={data.label} onChange={data.onLabelChange} />
      )}
      {data?.onRemove && <EdgeDeleteButton x={labelX} y={labelY} onRemove={data.onRemove} />}
    </>
  );
};

export default SelfLoopEdge;
