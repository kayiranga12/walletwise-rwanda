import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import rw from './locales/rw.json';

i18n
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: en },
            rw: { translation: rw },
        },
        lng: localStorage.getItem('language') || 'en', // Default to stored or English
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false,
        },
    });

document.documentElement.lang = i18n.language;
i18n.on('languageChanged', (lng) => { document.documentElement.lang = lng; });

export default i18n;
