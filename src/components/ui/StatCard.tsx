import React from 'react';
import { TrendingUp, TrendingDown, ArrowUpRight, ChevronLeft } from 'lucide-react';

export type StatCardColor = 'emerald' | 'blue' | 'amber' | 'rose' | 'purple' | 'cyan' | 'slate';

export interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: StatCardColor;
  trend?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
  secondaryStats?: Array<{
    label: string;
    value: string | number;
    unit?: string;
  }>;
  onClick?: () => void;
  actionLabel?: string;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  unit = 'تومان',
  subtitle,
  icon,
  color = 'blue',
  trend,
  secondaryStats,
  onClick,
  actionLabel,
  className = '',
}) => {
  const colorMap: Record<StatCardColor, { iconBg: string; iconColor: string; accentBorder: string }> = {
    emerald: {
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/40',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      accentBorder: 'hover:border-emerald-300 dark:hover:border-emerald-700',
    },
    blue: {
      iconBg: 'bg-blue-50 dark:bg-blue-950/40',
      iconColor: 'text-blue-600 dark:text-blue-400',
      accentBorder: 'hover:border-blue-300 dark:hover:border-blue-700',
    },
    amber: {
      iconBg: 'bg-amber-50 dark:bg-amber-950/40',
      iconColor: 'text-amber-600 dark:text-amber-400',
      accentBorder: 'hover:border-amber-300 dark:hover:border-amber-700',
    },
    rose: {
      iconBg: 'bg-rose-50 dark:bg-rose-950/40',
      iconColor: 'text-rose-600 dark:text-rose-400',
      accentBorder: 'hover:border-rose-300 dark:hover:border-rose-700',
    },
    purple: {
      iconBg: 'bg-purple-50 dark:bg-purple-950/40',
      iconColor: 'text-purple-600 dark:text-purple-400',
      accentBorder: 'hover:border-purple-300 dark:hover:border-purple-700',
    },
    cyan: {
      iconBg: 'bg-cyan-50 dark:bg-cyan-950/40',
      iconColor: 'text-cyan-600 dark:text-cyan-400',
      accentBorder: 'hover:border-cyan-300 dark:hover:border-cyan-700',
    },
    slate: {
      iconBg: 'bg-slate-100 dark:bg-slate-800',
      iconColor: 'text-slate-700 dark:text-slate-300',
      accentBorder: 'hover:border-slate-300 dark:hover:border-slate-600',
    },
  };

  const scheme = colorMap[color];

  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 transition-all duration-200 flex flex-col justify-between ${
        onClick
          ? `cursor-pointer active:scale-[0.99] hover:shadow-md ${scheme.accentBorder}`
          : 'shadow-2xs'
      } ${className}`}
    >
      <div>
        {/* Top Header Row */}
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 truncate">
            {title}
          </span>
          {icon && (
            <div className={`p-2.5 rounded-xl ${scheme.iconBg} ${scheme.iconColor} shrink-0`}>
              {icon}
            </div>
          )}
        </div>

        {/* Primary Metric Number */}
        <div className="mt-3 flex items-baseline gap-1.5 flex-wrap">
          <span className="font-mono font-black text-2xl sm:text-3xl text-slate-900 dark:text-slate-100 tracking-tight tabular-nums">
            {typeof value === 'number' ? value.toLocaleString('fa-IR') : value}
          </span>
          {unit && (
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{unit}</span>
          )}
        </div>

        {/* Subtitle / Context description */}
        {subtitle && (
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1 leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {/* Trend or Secondary Breakdown or Footer Action */}
      {(trend || secondaryStats || actionLabel) && (
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
          {trend && (
            <div className="flex items-center gap-1 font-bold">
              {trend.isPositive !== false ? (
                <span className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span className="font-mono tabular-nums">{trend.value}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-0.5 text-rose-600 dark:text-rose-400">
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span className="font-mono tabular-nums">{trend.value}</span>
                </span>
              )}
              {trend.label && (
                <span className="text-[11px] text-slate-400 font-normal mr-1">{trend.label}</span>
              )}
            </div>
          )}

          {secondaryStats && secondaryStats.length > 0 && (
            <div className="flex items-center gap-3 text-[11px] text-slate-500">
              {secondaryStats.map((sec, idx) => (
                <span key={idx}>
                  <span className="text-slate-400">{sec.label}: </span>
                  <strong className="font-mono font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                    {typeof sec.value === 'number' ? sec.value.toLocaleString('fa-IR') : sec.value}
                  </strong>
                  {sec.unit && <span className="text-[10px] mr-0.5">{sec.unit}</span>}
                </span>
              ))}
            </div>
          )}

          {actionLabel && (
            <span className="text-blue-600 dark:text-blue-400 font-bold flex items-center gap-0.5 hover:underline mr-auto">
              <span>{actionLabel}</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </span>
          )}
        </div>
      )}
    </div>
  );
};
