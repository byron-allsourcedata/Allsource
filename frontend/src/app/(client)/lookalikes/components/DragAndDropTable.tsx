'use client';

import * as React from 'react';
import { Box } from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

export interface Field {
  id: string;
  name: string;
  value: string;
}

interface LookalikeFieldsGridProps {
  fields: Field[];
  onOrderChange?: (newOrder: Field[]) => void;
}

export default function LookalikeFieldsGrid({
  fields,
  onOrderChange,
}: LookalikeFieldsGridProps) {
  const [rows, setRows] = React.useState<Field[]>(fields);
  const [dragIndex, setDragIndex] = React.useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null);

  React.useEffect(() => {
    setRows(fields);
  }, [fields]);

  // Начало перетаскивания: span.draggable
  const handleDragStart = (
    event: React.DragEvent<HTMLSpanElement>,
    index: number
  ) => {
    setDragIndex(index);
    const rowElem = event.currentTarget.closest('.row') as HTMLElement;
    // ставим всю строку в качестве "drag image"
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(index));
    if (rowElem) {
      // смещение так, чтобы курсор оставался на одном месте
      const rect = rowElem.getBoundingClientRect();
      event.dataTransfer.setDragImage(rowElem, event.clientX - rect.left, event.clientY - rect.top);
    }
  };

  // Конец перетаскивания
  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  // Когда drag идёт над строкой
  const handleDragOver = (
    event: React.DragEvent<HTMLDivElement>,
    index: number
  ) => {
    event.preventDefault();
    setDragOverIndex(index);
    event.dataTransfer.dropEffect = 'move';
  };

  // Когда отпустили над строкой
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const src = event.dataTransfer.getData('text/plain');
    if (!src) return;
    const from = Number(src);
    const to = dragOverIndex;
    if (isNaN(from) || to === null || from === to) return;

    setRows(prev => {
      const updated = [...prev];
      const [moved] = updated.splice(from, 1);
      updated.splice(to, 0, moved);
      onOrderChange?.(updated);
      return updated;
    });

    setDragIndex(null);
    setDragOverIndex(null);
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 600, margin: '0 auto' }}>
      <div>
        {rows.map((row, index) => (
          <div
            key={row.id}
            className="row"
            onDragOver={e => handleDragOver(e, index)}
            onDrop={handleDrop}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px 12px',
              background: dragOverIndex === index ? 'rgba(0,0,0,0.04)' : 'white',
              borderBottom: '1px solid rgba(224,224,224,1)',
            }}
          >
            {/* drag-handle */}
            <span
              draggable
              onDragStart={e => handleDragStart(e, index)}
              onDragEnd={handleDragEnd}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 24,
                height: 24,
                marginRight: 12,
                cursor: 'grab',
              }}
            >
              <DragIndicatorIcon fontSize="small" />
            </span>

            {/* Контент строки */}
            <div style={{ flex: 1 }}>{row.name}</div>
            <div style={{ width: 150, textAlign: 'right' }}>{row.value}</div>
          </div>
        ))}
      </div>
    </Box>
  );
}
