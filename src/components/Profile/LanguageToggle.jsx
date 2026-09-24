import React from 'react';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
    { id: 'rw', label: 'Kinyarwanda' },
    { id: 'en', label: 'English' },
];

const LanguageToggle = () => {
    const { i18n } = useTranslation();

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
        localStorage.setItem('language', lng);
    };

    return (
        <div className="grid grid-cols-2 gap-2">
            {LANGUAGES.map(({ id, label }) => (
                <button
                    key={id}
                    onClick={() => changeLanguage(id)}
                    className={`rounded-xl border-2 py-3 text-sm font-medium transition ${i18n.language === id
                        ? 'border-primary text-primary bg-primary/5'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}
                >
                    {label}
                </button>
            ))}
        </div>
    );
};

export default LanguageToggle;
