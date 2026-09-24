import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CalendarClock } from 'lucide-react';
import { getExpenseCategory } from '../../lib/categories';
import { formatMoney } from '../../lib/format';
import { CategoryIcon } from '../ui/bits';

// Recurring expenses still due this month, and what's left once they're paid
const UpcomingBills = ({ bills, left, compact = false }) => {
    const { t } = useTranslation();
    const total = bills.reduce((s, b) => s + b.amount, 0);
    return (
        <div className="card-pad">
            <div className="flex items-center justify-between mb-3">
                <h3 className="section-title flex items-center gap-2"><CalendarClock className="w-5 h-5 text-sky-500" /> {t('salary.upcomingBills')}</h3>
                <Link to="/recurring" className="text-sm text-primary font-medium">{t('common.viewAll')}</Link>
            </div>
            {bills.length === 0 ? (
                <p className="muted text-sm">{t('salary.noBills')}</p>
            ) : (
                <>
                    <div className="space-y-2.5">
                        {bills.slice(0, compact ? 3 : 20).map(b => {
                            const cat = getExpenseCategory(b.category);
                            return (
                                <div key={b.id} className="flex items-center gap-3">
                                    <CategoryIcon icon={cat.icon} color={cat.color} size="sm" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{b.description || t(`categories.${cat.id}`)}</p>
                                        <p className="text-xs muted">{t('salary.dueOn', { day: b.due_day })}</p>
                                    </div>
                                    <span className="text-sm font-semibold">{formatMoney(b.amount)}</span>
                                </div>
                            );
                        })}
                    </div>
                    <div className="flex justify-between text-sm mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                        <span className="muted">{t('salary.billsTotal')}</span>
                        <span className="font-semibold">{formatMoney(total)}</span>
                    </div>
                    {left !== undefined && (
                        <div className="flex justify-between text-sm mt-1">
                            <span className="muted">{t('salary.afterBills')}</span>
                            <span className={`font-bold ${left - total < 0 ? 'text-red-600' : 'text-emerald-600'}`}>{formatMoney(left - total)}</span>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default UpcomingBills;
