import React from 'react';

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  children?: React.ReactNode;
  wrapperClassName?: string;
}

export const Table: React.FC<TableProps> = ({
  children,
  wrapperClassName = '',
  className = '',
  ...props
}) => {
  return (
    <div className={`w-full overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 ${wrapperClassName}`}>
      <table className={`w-full text-right border-collapse text-xs ${className}`} {...props}>
        {children}
      </table>
    </div>
  );
};

export const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <thead
    className={`bg-slate-50/90 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-extrabold select-none ${className}`}
    {...props}
  >
    {children}
  </thead>
);

export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <tbody className={`divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-200 ${className}`} {...props}>
    {children}
  </tbody>
);

export const TableFooter: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <tfoot
    className={`bg-slate-50/90 dark:bg-slate-800/80 border-t border-slate-200/80 dark:border-slate-800 font-extrabold text-slate-900 dark:text-slate-100 ${className}`}
    {...props}
  >
    {children}
  </tfoot>
);

export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <tr
    className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors duration-100 ${className}`}
    {...props}
  >
    {children}
  </tr>
);

export interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  numeric?: boolean;
}

export const TableHead: React.FC<TableHeadProps> = ({
  children,
  numeric = false,
  className = '',
  ...props
}) => (
  <th
    className={`px-3.5 py-3 text-[11px] font-extrabold tracking-tight whitespace-nowrap ${
      numeric ? 'text-left font-mono tabular-nums' : 'text-right'
    } ${className}`}
    {...props}
  >
    {children}
  </th>
);

export interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  numeric?: boolean;
}

export const TableCell: React.FC<TableCellProps> = ({
  children,
  numeric = false,
  className = '',
  ...props
}) => (
  <td
    className={`px-3.5 py-2.5 align-middle ${
      numeric ? 'font-mono tabular-nums' : ''
    } ${className}`}
    {...props}
  >
    {children}
  </td>
);

export interface TableEmptyStateProps {
  colSpan: number;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const TableEmptyState: React.FC<TableEmptyStateProps> = ({
  colSpan,
  title = 'هیچ رکوردی یافت نشد',
  description,
  icon,
  action,
}) => (
  <tr>
    <td colSpan={colSpan} className="px-4 py-10 text-center">
      <div className="flex flex-col items-center justify-center space-y-2 max-w-sm mx-auto">
        {icon && <div className="text-slate-400 dark:text-slate-500 mb-1">{icon}</div>}
        <p className="text-xs font-extrabold text-slate-700 dark:text-slate-300">{title}</p>
        {description && (
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{description}</p>
        )}
        {action && <div className="pt-2">{action}</div>}
      </div>
    </td>
  </tr>
);
