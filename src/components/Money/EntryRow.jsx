import React from 'react';
import { useTranslation } from 'react-i18next';
import { Repeat, Pencil } from 'lucide-react';
import { CategoryIcon } from '../ui/bits';
import { getExpenseCategory, getIncomeCategory, getSource } from '../../lib/categories';
import { formatMoney, formatDate, entryDay } from '../../lib/format';

// One income or expense line. `kind` is 'income' | 'expense'.
const EntryRow = ({ entry, kind, onClick, showDate = true }) => {
    const { t } = useTranslation();
    const cat = kind === 'income' ? getIncomeCategory(entry.category) : getExpenseCategory(entry.category);
    const source = getSource(entry.source);
    const title = entry.description || t(`categories.${cat.id}`);

    return (
        <button onClick={onClick} title={t('common.edit')} className="group w-full flex items-center gap-3 px-4 sm:px-5 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
            <CategoryIcon icon={cat.icon} color={cat.color} />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{title}</p>
                <p className="text-xs muted flex items-center gap-1.5 truncate">
                    {entry.description && <span>{t(`categories.${cat.id}`)} ·</span>}
                    <span>{t(`sources.${source.id}`)}</span>
                    {showDate && <span>· {formatDate(entryDay(entry), { withYear: false })}</span>}
                    {entry.recurring_id && <Repeat className="w-3 h-3" aria-label={t('money.recurringBadge')} />}
                </p>
            </div>
            <span className={`text-sm font-semibold whitespace-nowrap ${kind === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-gray-100'}`}>
                {kind === 'income' ? '+' : '−'}{formatMoney(entry.amount)}
            </span>
            <Pencil className="w-4 h-4 shrink-0 text-gray-300 group-hover:text-primary transition" aria-label={t('common.edit')} />
        </button>
    );
};

export default EntryRow;
