import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: 'default' | 'outlined' | 'flat' | 'ghost';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  ...props
}) => {
  const variantStyles = {
    default: 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs rounded-2xl',
    outlined: 'bg-transparent border border-slate-200 dark:border-slate-800 rounded-2xl',
    flat: 'bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80 rounded-2xl',
    ghost: 'bg-transparent rounded-2xl',
  };

  const paddingStyles = {
    none: 'p-0',
    sm: 'p-3.5',
    md: 'p-5',
    lg: 'p-6',
  };

  return (
    <div className={`${variantStyles[variant]} ${paddingStyles[padding]} transition-all ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => <div className={`flex flex-col space-y-1 pb-3 ${className}`}>{children}</div>;

export const CardTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => <h3 className={`text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100 tracking-tight ${className}`}>{children}</h3>;

export const CardDescription: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => <p className={`text-xs font-medium text-slate-500 dark:text-slate-400 ${className}`}>{children}</p>;

export const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => <div className={`pt-1 ${className}`}>{children}</div>;

export const CardFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => <div className={`pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between ${className}`}>{children}</div>;

export interface CardStatProps {
  title: string;
  value: React.ReactNode;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  iconBgColor?: string;
  className?: string;
}

export const CardStat: React.FC<CardStatProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  iconBgColor = 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400',
  className = '',
}) => {
  return (
    <Card variant="default" padding="md" className={className}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5 min-w-0 flex-1">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block truncate">{title}</span>
          <div className="text-lg sm:text-2xl font-black text-slate-900 dark:text-slate-100 tabular-nums tracking-tight">
            {value}
          </div>
          {subtitle && <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>

        {icon && (
          <div className={`p-3 rounded-2xl shrink-0 ${iconBgColor}`}>
            {icon}
          </div>
        )}
      </div>

      {trend && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5 text-xs">
          <span
            className={`font-extrabold ${
              trend.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {trend.value}
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">نسبت به دوره قبل</span>
        </div>
      )}
    </Card>
  );
};
