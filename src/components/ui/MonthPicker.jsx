import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatMonth, shiftMonth, monthKey } from '../../lib/format';
import { useTranslation } from 'react-i18next';

const MonthPicker = ({ value, onChange }) => {
    const { t } = useTranslation();
    const isCurrent = value === monthKey();

    return (
        <div className="inline-flex items-center gap-1 card px-1.5 py-1 rounded-full">
            <button onClick={() => onChange(shiftMonth(value, -1))} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Previous month">
                <ChevronLeft className="w-4 h-4" />
            </button>
            <button
                onClick={() => onChange(monthKey())}
                className="min-w-[8.5rem] text-sm font-semibold text-center"
                title={t('common.thisMonth')}
            >
                {formatMonth(value)}
            </button>
            <button
                onClick={() => onChange(shiftMonth(value, 1))}
                disabled={isCurrent}
                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30"
                aria-label="Next month"
            >
                <ChevronRight className="w-4 h-4" />
            </button>
        </div>
    );
};

export default MonthPicker;
