import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useUserTable, useUpcomingBills } from '../../lib/hooks';
import { useDiscipline } from '../../lib/useDiscipline';
import { sendReminders } from '../../lib/reminders';
import { entryDay, formatMoney, todayISO, monthKey } from '../../lib/format';
import { salaryForMonth } from '../../lib/salary';

// Works out which reminders are due and shows them as notifications (if the
// user switched reminders on). Renders nothing.
const ReminderRunner = () => {
    const { t } = useTranslation();
    const incomes = useUserTable('incomes');
    const expenses = useUserTable('expenses');
    const bills = useUpcomingBills();
    const d = useDiscipline();

    useEffect(() => {
        if (!incomes || !expenses || !d) return;

        const check = () => {
            const now = new Date();
            const today = todayISO();
            const month = monthKey(now);
            const reminders = [];

            // Evening nudge when nothing was recorded today
            const loggedToday = [...incomes, ...expenses].some(e => entryDay(e) === today);
            if (now.getHours() >= 19 && !loggedToday) {
                reminders.push({ key: `log-${today}`, title: t('reminders.logTitle'), body: t('reminders.logBody') });
            }

            // Payday: save before spending
            if (salaryForMonth(incomes, month) > 0 && d.allowance.pendingSavings > 0) {
                reminders.push({ key: `payday-${month}`, title: t('reminders.paydayTitle'), body: t('reminders.paydayBody', { amount: formatMoney(d.allowance.pendingSavings) }) });
            }

            // Bills due tomorrow
            for (const b of bills.filter(b => b.due_day === now.getDate() + 1)) {
                reminders.push({ key: `bill-${b.id}-${month}`, title: t('reminders.billTitle'), body: t('reminders.billBody', { name: b.description || t(`categories.${b.category}`), amount: formatMoney(b.amount) }) });
            }

            // Went over today's allowance
            if (d.allowance.hasIncome && d.allowance.remaining < 0) {
                reminders.push({ key: `over-${today}`, title: t('reminders.overTitle'), body: t('reminders.overBody', { amount: formatMoney(-d.allowance.remaining) }) });
            }

            sendReminders(reminders);
        };

        check();
        const timer = setInterval(check, 30 * 60 * 1000);
        return () => clearInterval(timer);
    }, [incomes, expenses, bills, d, t]);

    return null;
};

export default ReminderRunner;
