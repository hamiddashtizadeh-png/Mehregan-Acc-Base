import React, { useEffect, useState, useRef, useId } from 'react';
import { formatWithCommas, parseNumberFromCommas, normalizePersianDigits } from '../utils/numberFormat';

export interface PriceInputProps {
  value: number | string | undefined | null;
  onChange: (numericValue: number) => void;
  placeholder?: string;
  className?: string;
  wrapperClassName?: string;
  disabled?: boolean;
  required?: boolean;
  unit?: string; // e.g. "تومان" or "ریال"
  min?: number;
  max?: number;
  id?: string;
  name?: string;
  label?: string;
  helperText?: string;
  error?: string;
  autoFocus?: boolean;
  step?: number | string;
  readOnly?: boolean;
}

/**
 * PriceInput: An input field that automatically formats numbers with 3-digit comma
 * separators (e.g. 1,000,000) dynamically as the user types.
 * Supports English, Persian (۰-۹) and Arabic (٠-٩) digits and maintains cursor position.
 */
export const PriceInput: React.FC<PriceInputProps> = ({
  value,
  onChange,
  placeholder = '0',
  className = '',
  wrapperClassName = '',
  disabled = false,
  required = false,
  unit,
  min,
  max,
  id,
  name,
  label,
  helperText,
  error,
  autoFocus = false,
  readOnly = false,
}) => {
  const generatedId = useId();
  const inputId = id || (label ? `price-input-${label.replace(/\s+/g, '-').toLowerCase()}` : generatedId);
  const inputRef = useRef<HTMLInputElement>(null);

  // Normalize initial value to formatted string
  const formatInitial = (val: number | string | undefined | null): string => {
    if (val === null || val === undefined || val === '') return '';
    const numeric = typeof val === 'number' ? val : parseNumberFromCommas(val);
    if (isNaN(numeric) || numeric === 0) return '';
    return formatWithCommas(numeric);
  };

  const [displayValue, setDisplayValue] = useState<string>(() => formatInitial(value));
  const isInternalChange = useRef(false);

  // Sync internal display when external value changes
  useEffect(() => {
    if (isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }
    const currentNum = parseNumberFromCommas(displayValue);
    const incomingNum = value !== null && value !== undefined && value !== '' ? parseNumberFromCommas(value) : 0;
    if (currentNum !== incomingNum) {
      setDisplayValue(incomingNum === 0 ? '' : formatWithCommas(incomingNum));
    }
  }, [value, displayValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const raw = input.value;
    const selectionStart = input.selectionStart || 0;

    // Count how many raw digits occurred before cursor
    const rawBeforeCursor = raw.slice(0, selectionStart);
    const digitsBeforeCursor = normalizePersianDigits(rawBeforeCursor).replace(/\D/g, '').length;

    if (!raw.trim()) {
      isInternalChange.current = true;
      setDisplayValue('');
      onChange(0);
      return;
    }

    const num = parseNumberFromCommas(raw);

    // Apply boundary checks if defined
    let clamped = num;
    if (min !== undefined && clamped < min) clamped = min;
    if (max !== undefined && clamped > max) clamped = max;

    const formatted = clamped === 0 && raw.trim() !== '' ? '0' : formatWithCommas(clamped);

    isInternalChange.current = true;
    setDisplayValue(formatted);
    onChange(clamped);

    // Restore cursor position seamlessly
    requestAnimationFrame(() => {
      if (!inputRef.current) return;
      let newCursor = 0;
      let digitCount = 0;
      for (let i = 0; i < formatted.length; i++) {
        if (/\d/.test(formatted[i])) {
          digitCount++;
        }
        if (digitCount <= digitsBeforeCursor) {
          newCursor = i + 1;
        }
      }
      try {
        inputRef.current.setSelectionRange(newCursor, newCursor);
      } catch {
        // ignore if not supported
      }
    });
  };

  return (
    <div className={`space-y-1 ${wrapperClassName}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-bold text-slate-700 dark:text-slate-200"
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <div className="relative flex items-center w-full">
        <input
          ref={inputRef}
          id={inputId}
          name={name}
          type="text"
          dir="ltr"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          autoFocus={autoFocus}
          className={`w-full text-left font-mono font-bold tracking-wider rounded-lg border border-slate-300 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:bg-slate-100 ${
            unit ? 'pl-12' : ''
          } ${error ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500' : ''} ${className}`}
        />
        {unit && (
          <span className="absolute left-2.5 text-[11px] font-bold text-slate-400 select-none pointer-events-none">
            {unit}
          </span>
        )}
      </div>

      {error ? (
        <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{helperText}</p>
      ) : null}
    </div>
  );
};
export default PriceInput;
