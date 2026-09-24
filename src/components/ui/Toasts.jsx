import React from 'react';
import { CircleCheck, TriangleAlert, Info, X } from 'lucide-react';
import useStore from '../../store/useStore';

const STYLES = {
    success: { icon: CircleCheck, cls: 'text-emerald-500' },
    warning: { icon: TriangleAlert, cls: 'text-amber-500' },
    error: { icon: TriangleAlert, cls: 'text-red-500' },
    info: { icon: Info, cls: 'text-sky-500' },
};

const Toasts = () => {
    const toasts = useStore(s => s.toasts);
    const dismiss = useStore(s => s.dismissToast);

    return (
        <div className="fixed z-[70] top-4 inset-x-4 sm:inset-x-auto sm:right-4 sm:w-96 space-y-2 no-print" aria-live="polite">
            {toasts.map(({ id, message, type }) => {
                const { icon: Icon, cls } = STYLES[type] || STYLES.info;
                return (
                    <div key={id} className="card flex items-start gap-3 p-3.5 shadow-lg animate-fade-in-up">
                        <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${cls}`} />
                        <p className="flex-1 text-sm text-gray-800 dark:text-gray-100">{message}</p>
                        <button onClick={() => dismiss(id)} className="text-gray-400 hover:text-gray-600" aria-label="Dismiss">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                );
            })}
        </div>
    );
};

export default Toasts;
