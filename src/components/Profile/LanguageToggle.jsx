import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageToggle = () => {
    const { i18n } = useTranslation();

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
        localStorage.setItem('language', lng);
    };

    return (
        <div className="flex border border-gray-300 rounded-md overflow-hidden">
            <button
                onClick={() => changeLanguage('en')}
                className={`px-4 py-2 text-sm font-medium ${i18n.language === 'en'
                        ? 'bg-primary text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
            >
                English
            </button>
            <button
                onClick={() => changeLanguage('rw')}
                className={`px-4 py-2 text-sm font-medium ${i18n.language === 'rw'
                        ? 'bg-primary text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
            >
                Kinyarwanda
            </button>
        </div>
    );
};

export default LanguageToggle;
