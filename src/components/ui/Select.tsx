import React from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  options?: SelectOption[];
  leftIcon?: React.ReactNode;
  fullWidth?: boolean;
  wrapperClassName?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      helperText,
      error,
      options,
      leftIcon,
      fullWidth = true,
      wrapperClassName = '',
      className = '',
      disabled,
      children,
      id,
      ...props
    },
    ref
  ) => {
    const selectId = id || (label ? `select-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);

    const baseSelectStyles =
      'w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-medium rounded-xl border border-slate-200/90 dark:border-slate-700/80 px-3.5 py-2.5 transition-all duration-150 focus-ring appearance-none pr-9 disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-800/50 disabled:cursor-not-allowed';

    const errorSelectStyles = error
      ? 'border-rose-500 dark:border-rose-500 focus-visible:ring-rose-500/80'
      : '';

    const leftPadding = leftIcon ? 'pl-10' : '';

    return (
      <div className={`${fullWidth ? 'w-full' : ''} space-y-1.5 ${wrapperClassName}`}>
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-extrabold text-slate-800 dark:text-slate-200"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            className={`${baseSelectStyles} ${errorSelectStyles} ${leftPadding} ${className}`}
            {...props}
          >
            {options
              ? options.map((opt) => (
                  <option key={String(opt.value)} value={opt.value} disabled={opt.disabled}>
                    {opt.label}
                  </option>
                ))
              : children}
          </select>

          <div className="absolute left-3 text-slate-400 dark:text-slate-500 pointer-events-none shrink-0">
            <ChevronDown className="w-4 h-4" />
          </div>

          {leftIcon && (
            <div className="absolute right-3 text-slate-400 dark:text-slate-500 pointer-events-none shrink-0">
              {leftIcon}
            </div>
          )}
        </div>

        {error ? (
          <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400">{error}</p>
        ) : helperText ? (
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = 'Select';
