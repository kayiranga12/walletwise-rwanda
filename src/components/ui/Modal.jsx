import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// A bottom sheet on phones, a centered dialog on larger screens.
const Modal = ({ open, onClose, title, children, footer, size = 'md' }) => {
    const { t } = useTranslation();

    useEffect(() => {
        if (!open) return;
        const onKey = (e) => e.key === 'Escape' && onClose?.();
        document.addEventListener('keydown', onKey);
        const overflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = overflow;
        };
    }, [open, onClose]);

    if (!open) return null;

    const width = size === 'sm' ? 'sm:max-w-sm' : size === 'lg' ? 'sm:max-w-2xl' : 'sm:max-w-lg';

    return (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center no-print" role="dialog" aria-modal="true" aria-label={title}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
            <div className={`relative w-full ${width} max-h-[92vh] flex flex-col bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-2xl shadow-2xl animate-fade-in-up`}>
                <div className="flex items-center justify-between px-5 pt-5 pb-3">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
                    <button onClick={onClose} className="p-2 -mr-2 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800" aria-label={t('common.close')}>
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="px-5 pb-5 overflow-y-auto">{children}</div>
                {footer && <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800">{footer}</div>}
            </div>
        </div>
    );
};

export default Modal;
