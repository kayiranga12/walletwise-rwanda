import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDiscipline } from '../../lib/useDiscipline';
import { PageHeader, Spinner } from '../ui/bits';
import HealthScoreCard from './HealthScoreCard';
import AllowanceCard from './AllowanceCard';
import NoSpendCalendar from './NoSpendCalendar';
import { CommitmentCard, ReviewCard } from './CommitmentCard';
import { ChallengesCard, BadgesCard } from './ChallengesCard';
import WishlistCard from './WishlistCard';
import PatternsSection from './PatternsSection';

const TABS = ['today', 'discipline', 'patterns'];

// Everything that builds money discipline: score, daily limit, habits, commitments, challenges
const HabitsPage = () => {
    const { t } = useTranslation();
    const d = useDiscipline();
    const [tab, setTab] = useState(() => {
        try { return sessionStorage.getItem('walletwise:habitsTab') || 'today'; } catch { return 'today'; }
    });

    const pick = (id) => {
        setTab(id);
        try { sessionStorage.setItem('walletwise:habitsTab', id); } catch { /* private mode */ }
    };

    if (!d) return <Spinner />;

    return (
        <div className="animate-fade-in-up">
            <PageHeader title={t('habits.title')} subtitle={t('habits.subtitle')} />

            <div className="grid grid-cols-3 w-full sm:inline-grid sm:w-auto p-1 rounded-xl bg-gray-100 dark:bg-gray-800 mb-6">
                {TABS.map(id => (
                    <button key={id} onClick={() => pick(id)}
                        className={`px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium leading-tight transition ${tab === id ? 'bg-white dark:bg-gray-900 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500'}`}>
                        {t(`habits.tabs.${id}`)}
                    </button>
                ))}
            </div>

            {tab === 'today' && (
                <div className="grid lg:grid-cols-2 gap-6">
                    <div className="space-y-6">
                        <AllowanceCard allowance={d.allowance} streak={d.streak} />
                        <NoSpendCalendar calendar={d.calendar} />
                    </div>
                    <HealthScoreCard health={d.health} history={d.history} />
                </div>
            )}

            {tab === 'discipline' && (
                <div className="grid lg:grid-cols-2 gap-6">
                    <div className="space-y-6">
                        <CommitmentCard month={d.month} commitment={d.commitment} result={d.commitmentResult} />
                        <ReviewCard review={d.review} lastCommitment={d.lastCommitment} lastResult={d.lastCommitmentResult} />
                        <WishlistCard wishlist={d.wishlist} skippedTotal={d.skippedTotal} />
                    </div>
                    <div className="space-y-6">
                        <ChallengesCard challenges={d.challenges} />
                        <BadgesCard badges={d.badges} />
                    </div>
                </div>
            )}

            {tab === 'patterns' && <PatternsSection habits={d.habits} />}
        </div>
    );
};

export default HabitsPage;
