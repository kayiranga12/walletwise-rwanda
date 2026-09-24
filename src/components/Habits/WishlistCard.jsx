import React from 'react';
import { useTranslation } from 'react-i18next';
import { Hourglass, ShoppingCart, ThumbsDown } from 'lucide-react';
import { differenceInHours, parseISO } from 'date-fns';
import useStore from '../../store/useStore';
import { removeFromWishlist } from '../../lib/settings';
import { createRecord } from '../../lib/repo';
import { getExpenseCategory } from '../../lib/categories';
import { WAIT_HOURS } from '../../lib/discipline';
import { formatMoney, todayISO } from '../../lib/format';
import { CategoryIcon } from '../ui/bits';

// Purchases the user chose to sleep on. After 24 hours: buy it or skip it.
const WishlistCard = ({ wishlist, skippedTotal }) => {
    const { t } = useTranslation();
    const { user, toast } = useStore();

    const buy = async (item) => {
        await createRecord('expenses', user.id, {
            amount: item.amount, date: todayISO(), category: item.category, bucket: item.bucket || 'Wants',
            source: item.source || 'momo', description: item.description || '',
        });
        await removeFromWishlist(user.id, item.id);
        toast(t('common.saved'));
    };

    const skip = async (item) => {
        await removeFromWishlist(user.id, item.id, { skipped: true });
        toast(t('wishlist.skippedToast', { amount: formatMoney(item.amount) }));
    };

    return (
        <div className="card-pad">
            <h2 className="section-title flex items-center gap-2 mb-1"><Hourglass className="w-5 h-5 text-amber-500" /> {t('wishlist.title')}</h2>
            <p className="text-sm muted mb-4">{t('wishlist.subtitle')}</p>
            {wishlist.length === 0 ? (
                <p className="text-sm muted">{t('wishlist.empty')}</p>
            ) : (
                <div className="space-y-3">
                    {wishlist.map(item => {
                        const cat = getExpenseCategory(item.category);
                        const hours = differenceInHours(new Date(), parseISO(item.created_at));
                        const ready = hours >= WAIT_HOURS;
                        return (
                            <div key={item.id} className="rounded-xl border border-gray-100 dark:border-gray-800 p-3.5">
                                <div className="flex items-center gap-3">
                                    <CategoryIcon icon={cat.icon} color={cat.color} size="sm" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{item.description || t(`categories.${cat.id}`)}</p>
                                        <p className="text-xs muted">{ready ? t('wishlist.ready') : t('wishlist.waiting', { hours: WAIT_HOURS - hours })}</p>
                                    </div>
                                    <span className="text-sm font-semibold">{formatMoney(item.amount)}</span>
                                </div>
                                <div className="flex gap-2 mt-3">
                                    <button onClick={() => skip(item)} className="btn-secondary flex-1 py-1.5 text-emerald-700 dark:text-emerald-400">
                                        <ThumbsDown className="w-4 h-4" /> {t('wishlist.skip')}
                                    </button>
                                    <button onClick={() => buy(item)} disabled={!ready} className="btn-ghost flex-1 py-1.5 border border-gray-200 dark:border-gray-700" title={ready ? '' : t('wishlist.notYet')}>
                                        <ShoppingCart className="w-4 h-4" /> {t('wishlist.buy')}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
            {skippedTotal > 0 && (
                <p className="text-sm font-semibold text-emerald-600 mt-4">{t('wishlist.savedSoFar', { amount: formatMoney(skippedTotal) })}</p>
            )}
        </div>
    );
};

export default WishlistCard;
