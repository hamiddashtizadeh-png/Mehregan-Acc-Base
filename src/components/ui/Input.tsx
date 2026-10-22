import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  wrapperClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error,
      leftIcon,
      rightIcon,
      fullWidth = true,
      wrapperClassName = '',
      className = '',
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? `input-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);

    const baseInputStyles =
      'w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl border border-slate-200/90 dark:border-slate-700/80 px-3.5 py-2.5 transition-all duration-150 focus-ring disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-800/50 disabled:cursor-not-allowed';

    const errorInputStyles = error
      ? 'border-rose-500 dark:border-rose-500 focus-visible:ring-rose-500/80'
      : '';

    const leftPadding = leftIcon ? 'pl-10' : '';
    const rightPadding = rightIcon ? 'pr-10' : '';

    return (
      <div className={`${fullWidth ? 'w-full' : ''} space-y-1.5 ${wrapperClassName}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-extrabold text-slate-800 dark:text-slate-200"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {rightIcon && (
            <div className="absolute right-3 text-slate-400 dark:text-slate-500 pointer-events-none shrink-0">
              {rightIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={`${baseInputStyles} ${errorInputStyles} ${rightPadding} ${leftPadding} ${className}`}
            {...props}
          />

          {leftIcon && (
            <div className="absolute left-3 text-slate-400 dark:text-slate-500 pointer-events-none shrink-0">
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

Input.displayName = 'Input';
