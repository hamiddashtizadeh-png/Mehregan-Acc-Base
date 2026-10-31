import { useState, useCallback, useRef } from 'react';

export interface ColumnWidthConfig {
  [key: string]: number;
}

export function useColumnResizable(initialWidths: ColumnWidthConfig) {
  const [columnWidths, setColumnWidths] = useState<ColumnWidthConfig>(initialWidths);
  const isResizingRef = useRef<boolean>(false);
  const activeColRef = useRef<string | null>(null);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);

  const startResizing = useCallback(
    (e: React.MouseEvent, colKey: string) => {
      e.preventDefault();
      e.stopPropagation();

      isResizingRef.current = true;
      activeColRef.current = colKey;
      startXRef.current = e.clientX;
      startWidthRef.current = columnWidths[colKey] || 120;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!isResizingRef.current || !activeColRef.current) return;

        // In RTL layouts: dragging mouse to the left increases width, to the right decreases width
        const deltaX = startXRef.current - moveEvent.clientX;
        const newWidth = Math.max(60, Math.min(600, startWidthRef.current + deltaX));

        setColumnWidths((prev) => ({
          ...prev,
          [activeColRef.current as string]: newWidth,
        }));
      };

      const handleMouseUp = () => {
        isResizingRef.current = false;
        activeColRef.current = null;
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [columnWidths]
  );

  return { columnWidths, startResizing };
}
