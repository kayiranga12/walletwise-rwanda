import React from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../ui/Modal';
import useStore from '../../store/useStore';
import { getPet, getGoalColor } from '../../lib/categories';

const CONFETTI = ['🎉', '✨', '🎊', '⭐', '💰'];

// Shown when a deposit carries a goal past 25/50/75/100%
const Celebration = () => {
    const { t } = useTranslation();
    const celebration = useStore(s => s.celebration);
    const close = useStore(s => s.closeCelebration);
    if (!celebration) return null;

    const { goal, milestone } = celebration;
    const color = getGoalColor(goal.color_theme).hex;

    return (
        <Modal open onClose={close} title="" size="sm">
            <div className="text-center pb-2">
                <div className="relative inline-block">
                    <div className="w-28 h-28 rounded-full flex items-center justify-center text-6xl animate-pop" style={{ backgroundColor: `${color}22` }}>
                        {getPet(goal.pet_avatar).icon}
                    </div>
                    {CONFETTI.map((c, i) => (
                        <span key={i} className="absolute text-xl animate-bounce" style={{
                            top: `${[-8, 10, 80, 90, 30][i]}%`, left: `${[-10, 95, -15, 90, 105][i]}%`, animationDelay: `${i * 120}ms`
                        }}>{c}</span>
                    ))}
                </div>
                <h3 className="text-xl font-bold mt-5">{t(`goals.milestone.${milestone}`)}</h3>
                <p className="muted mt-1">{t('goals.milestoneBody', { name: goal.name, percent: milestone })}</p>
                <button onClick={close} className="btn-primary w-full mt-6">{t('goals.keepGoing')}</button>
            </div>
        </Modal>
    );
};

export default Celebration;
