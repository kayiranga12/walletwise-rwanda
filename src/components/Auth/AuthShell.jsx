import React from 'react';
import { useTranslation } from 'react-i18next';
import { PiggyBank, Target, Sparkles } from 'lucide-react';
import LanguageToggle from '../Profile/LanguageToggle';

const AuthShell = ({ title, children }) => {
    const { t } = useTranslation();
    return (
        <div className="min-h-screen grid lg:grid-cols-2">
            <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-primary to-orange-700 text-white">
                <div className="flex items-center gap-2 text-2xl font-extrabold"><img src="/icon.svg" alt="" className="w-9 h-9 rounded-lg ring-2 ring-white/40" /> WalletWise</div>
                <div>
                    <h1 className="text-4xl font-bold leading-tight">{t('auth.tagline')}</h1>
                    <div className="mt-8 space-y-4 text-orange-50">
                        <p className="flex items-center gap-3"><PiggyBank className="w-5 h-5" /> 50/30/20 · MoMo · Airtel Money · Ikimina</p>
                        <p className="flex items-center gap-3"><Target className="w-5 h-5" /> {t('goals.subtitle')}</p>
                        <p className="flex items-center gap-3"><Sparkles className="w-5 h-5" /> {t('dashboard.insights')}</p>
                    </div>
                </div>
                <p className="text-sm text-orange-100">🇷🇼 Made for Rwanda</p>
            </div>
            <div className="flex flex-col items-center justify-center p-6">
                <div className="w-full max-w-sm">
                    <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
                        <img src="/icon.svg" alt="" className="w-9 h-9 rounded-lg" />
                        <span className="text-2xl font-extrabold text-primary">WalletWise</span>
                    </div>
                    <h2 className="text-2xl font-bold mb-1">{title}</h2>
                    <p className="muted text-sm mb-6 lg:hidden">{t('auth.tagline')}</p>
                    {children}
                    <div className="mt-10"><LanguageToggle /></div>
                </div>
            </div>
        </div>
    );
};

export default AuthShell;
