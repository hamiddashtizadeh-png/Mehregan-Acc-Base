import React from 'react';

interface ResizableThProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  colKey: string;
  width?: number;
  onStartResize?: (e: React.MouseEvent, colKey: string) => void;
  children: React.ReactNode;
  className?: string;
}

export const ResizableTh: React.FC<ResizableThProps> = ({
  colKey,
  width,
  onStartResize,
  children,
  className = '',
  ...props
}) => {
  return (
    <th
      {...props}
      style={{ width: width ? `${width}px` : undefined, minWidth: width ? `${width}px` : undefined, ...props.style }}
      className={`relative select-none py-3.5 px-3 text-right text-xs font-black text-slate-700 bg-slate-100/80 border-b border-slate-200/90 whitespace-nowrap transition-colors group ${className}`}
    >
      <div className="flex items-center justify-between gap-1">
        <div className="truncate">{children}</div>
      </div>

      {onStartResize && (
        <div
          onMouseDown={(e) => onStartResize(e, colKey)}
          className="absolute left-0 top-0 bottom-0 w-2.5 cursor-col-resize hover:bg-blue-500/40 active:bg-blue-600/70 transition-colors z-10 flex items-center justify-center group/handle"
          title="جهت تغییر عرض ستون، با ماوس بکشید"
        >
          <div className="w-0.5 h-4 bg-slate-300 group-hover/handle:bg-blue-600 rounded-full transition-colors" />
        </div>
      )}
    </th>
  );
};
