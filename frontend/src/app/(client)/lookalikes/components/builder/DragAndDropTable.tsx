import * as React from 'react';
import { Box } from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import type { Field, LookalikeFieldsGridProps } from "@/types";
import { useResetContext } from '@/context/ResetContext';
import { useState } from 'react';

const formatPercent = (value: string) =>
  `${(parseFloat(value) * 100).toFixed(2)}%`;

const formatKey = (k: string) =>
  k
    .replace(/_/g, " ")
    .replace(/(?!^)([A-Z])/g, " $1")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (c) => c.toUpperCase());

function DragAndDropTable({
  fields,
  onOrderChange,
}: LookalikeFieldsGridProps) {
  const [rows, setRows] = React.useState<Field[]>(fields);
  React.useEffect(() => {
    setRows(fields);
    onOrderChange?.(fields);
  }, [fields]);
  const [dragIndex, setDragIndex] = React.useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null);

  const handleDragStart = (
    event: React.DragEvent<HTMLSpanElement>,
    index: number
  ) => {
    setDragIndex(index);
    const rowElem = event.currentTarget.closest('.row') as HTMLElement;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(index));
    if (rowElem) {
      const rect = rowElem.getBoundingClientRect();
      event.dataTransfer.setDragImage(
        rowElem,
        event.clientX - rect.left,
        event.clientY - rect.top
      );
    }
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (
    event: React.DragEvent<HTMLDivElement>,
    index: number
  ) => {
    event.preventDefault();
    setDragOverIndex(index);
    event.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const src = event.dataTransfer.getData('text/plain');
    if (!src) return;
    const from = Number(src);
    const to = dragOverIndex;
    if (isNaN(from) || to === null || from === to) return;

    // compute new order outside setState callback to avoid render-phase context updates
 
    const updated = [...rows];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    setRows(updated);
    onOrderChange?.(updated);

    setDragIndex(null);
    setDragOverIndex(null);
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 600 }}>
      {rows.map((row, index) => (
        <Box
          key={`${row.id}-${index}`}
          className="row"
          onDragOver={(e) => handleDragOver(e, index)}
          onDrop={handleDrop}
          sx={{
            display: 'flex',
            alignItems: 'center',
            p: 1.5,
            bgcolor: dragOverIndex === index ? 'action.hover' : 'background.paper',
            borderBottom: '1px solid',
            borderColor: 'divider',
            textAlign: 'left',
          }}
        >
          <Box
            component="span"
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragEnd={handleDragEnd}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 24,
              height: 24,
              mr: 1.5,
              cursor: 'grab',
            }}
          >
            <DragIndicatorIcon fontSize="small" />
          </Box>
          <Box sx={{ flex: 1, typography: 'body2', textAlign: 'left' }}>
            {formatKey(String(row.name))}
          </Box>
          <Box sx={{ width: 150, typography: 'body2', textAlign: 'left' }}>
            {formatPercent(row.value)}
          </Box>
        </Box>
      ))}
    </Box>
  );
}

export default React.memo(DragAndDropTable);
