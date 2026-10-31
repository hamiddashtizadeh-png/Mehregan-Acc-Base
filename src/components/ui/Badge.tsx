import React from 'react';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary' | 'purple';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  className = '',
  ...props
}) => {
  const variantStyles: Record<BadgeVariant, { container: string; dot: string }> = {
    success: {
      container: 'bg-emerald-50 text-emerald-800 border-emerald-200/90 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
      dot: 'bg-emerald-500',
    },
    warning: {
      container: 'bg-amber-50 text-amber-800 border-amber-200/90 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
      dot: 'bg-amber-500',
    },
    danger: {
      container: 'bg-rose-50 text-rose-800 border-rose-200/90 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
      dot: 'bg-rose-500',
    },
    info: {
      container: 'bg-cyan-50 text-cyan-800 border-cyan-200/90 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800',
      dot: 'bg-cyan-500',
    },
    primary: {
      container: 'bg-blue-50 text-blue-800 border-blue-200/90 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
      dot: 'bg-blue-500',
    },
    purple: {
      container: 'bg-purple-50 text-purple-800 border-purple-200/90 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
      dot: 'bg-purple-500',
    },
    neutral: {
      container: 'bg-slate-100 text-slate-700 border-slate-200/90 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
      dot: 'bg-slate-400',
    },
  };

  const sizeStyles: Record<BadgeSize, string> = {
    sm: 'text-[10px] px-2 py-0.5 gap-1 font-bold',
    md: 'text-xs px-2.5 py-0.5 gap-1.5 font-extrabold',
    lg: 'text-xs px-3 py-1 gap-1.5 font-black',
  };

  const { container, dot: dotColor } = variantStyles[variant];

  return (
    <span
      className={`inline-flex items-center rounded-full border tracking-tight select-none shrink-0 ${container} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />}
      <span>{children}</span>
    </span>
  );
};
