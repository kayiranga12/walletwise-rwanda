import React from 'react';
import { useTranslation } from 'react-i18next';
import { TriangleAlert, Lightbulb, Sparkles, Info } from 'lucide-react';
import { formatMoney, formatDate } from '../../lib/format';

export const ProgressBar = ({ value, color, className = 'h-2' }) => (
    <div className={`w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden ${className}`}>
        <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(Math.max(value, 0), 1) * 100}%`, backgroundColor: color }}
        />
    </div>
);

export const CategoryIcon = ({ icon: Icon, color, size = 'md' }) => {
    const box = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-12 h-12' : 'w-10 h-10';
    const ico = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';
    return (
        <div className={`${box} rounded-xl flex items-center justify-center shrink-0`} style={{ backgroundColor: `${color}1f`, color }}>
            <Icon className={ico} />
        </div>
    );
};

export const EmptyState = ({ icon: Icon, text, action }) => (
    <div className="flex flex-col items-center justify-center text-center py-10 px-4">
        {Icon && <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3 text-gray-400"><Icon className="w-7 h-7" /></div>}
        <p className="muted text-sm max-w-xs">{text}</p>
        {action && <div className="mt-4">{action}</div>}
    </div>
);

export const PageHeader = ({ title, subtitle, children }) => (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
        <div>
            <h1 className="page-title">{title}</h1>
            {subtitle && <p className="muted mt-1">{subtitle}</p>}
        </div>
        {children && <div className="flex flex-wrap items-center gap-2 no-print">{children}</div>}
    </div>
);

export const Spinner = () => (
    <div className="flex justify-center items-center py-20">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
);

const LEVEL = {
    danger: { icon: TriangleAlert, cls: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300' },
    warning: { icon: TriangleAlert, cls: 'bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300' },
    good: { icon: Sparkles, cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' },
    info: { icon: Lightbulb, cls: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300' },
};

// Renders one insight from lib/insights with its numbers formatted for display
export const InsightItem = ({ insight }) => {
    const { t } = useTranslation();
    const { icon: Icon, cls } = LEVEL[insight.level] || { icon: Info, cls: LEVEL.info.cls };
    const p = { ...insight.params };
    if (p.amount !== undefined) p.amount = formatMoney(p.amount);
    if (p.bucket) p.bucket = t(`buckets.${p.bucket}`);
    if (p.category) p.category = t(`categories.${p.category}`);
    if (p.date) p.date = formatDate(p.date);

    return (
        <div className={`flex items-start gap-3 rounded-xl px-3.5 py-3 text-sm ${cls}`}>
            <Icon className="w-4 h-4 mt-0.5 shrink-0" />
            <p>{t(insight.key, p)}</p>
        </div>
    );
};
