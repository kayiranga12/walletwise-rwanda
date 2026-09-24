import { format, parseISO, addMonths, getDaysInMonth } from 'date-fns';
import i18n from '../i18n';

const whole = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });

export const formatMoney = (n) => `${whole.format(Math.round(Number(n) || 0))} RWF`;
export const formatNumber = (n) => whole.format(Math.round(Number(n) || 0));
export const formatCompact = (n) => compact.format(Number(n) || 0);
export const formatPercent = (ratio) => `${Math.round((ratio || 0) * 100)}%`;

// Month keys are 'yyyy-MM'; entry dates are 'yyyy-MM-dd' (older rows hold a full ISO timestamp)
export const monthKey = (date = new Date()) => format(date, 'yyyy-MM');
export const entryMonth = (entry) => (entry.date || entry.transaction_date || entry.created_at || '').slice(0, 7);
export const entryDay = (entry) => (entry.date || entry.transaction_date || entry.created_at || '').slice(0, 10);
export const todayISO = () => format(new Date(), 'yyyy-MM-dd');

export const shiftMonth = (key, delta) => monthKey(addMonths(parseISO(`${key}-01`), delta));
export const daysInMonthKey = (key) => getDaysInMonth(parseISO(`${key}-01`));

export const formatMonth = (key, { short = false } = {}) => {
    const d = parseISO(`${key}-01`);
    const months = i18n.t(short ? 'months.short' : 'months.long', { returnObjects: true });
    const name = Array.isArray(months) ? months[d.getMonth()] : format(d, short ? 'MMM' : 'MMMM');
    return `${name} ${d.getFullYear()}`;
};

export const formatDate = (value, { withYear = true } = {}) => {
    if (!value) return '';
    const d = typeof value === 'string' ? parseISO(value) : value;
    const months = i18n.t('months.short', { returnObjects: true });
    const name = Array.isArray(months) ? months[d.getMonth()] : format(d, 'MMM');
    return withYear ? `${d.getDate()} ${name} ${d.getFullYear()}` : `${d.getDate()} ${name}`;
};
