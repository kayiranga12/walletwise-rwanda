import React from 'react';
import { TriangleAlert, RefreshCw, House } from 'lucide-react';
import i18n from '../../i18n';

// Shows what went wrong instead of a blank white page when a screen crashes.
// `resetKey` (e.g. the current path) clears the error when the user navigates away;
// `fallback` replaces the error card for small widgets.
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { error: null };
    }

    static getDerivedStateFromError(error) {
        return { error };
    }

    componentDidCatch(error, info) {
        console.error('WalletWise crashed:', error, info?.componentStack);
    }

    componentDidUpdate(prev) {
        if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null });
    }

    render() {
        const { error } = this.state;
        if (!error) return this.props.children;
        if ('fallback' in this.props) return this.props.fallback;
        const t = i18n.t.bind(i18n);

        return (
            <div className="min-h-[60vh] flex items-center justify-center p-6">
                <div className="card-pad max-w-md w-full text-center">
                    <div className="w-12 h-12 mx-auto rounded-2xl bg-red-100 text-red-600 dark:bg-red-500/15 flex items-center justify-center mb-4">
                        <TriangleAlert className="w-6 h-6" />
                    </div>
                    <h1 className="text-lg font-semibold">{t('errors.title')}</h1>
                    <p className="muted text-sm mt-1">{t('errors.body')}</p>
                    <pre className="mt-4 text-left text-xs bg-gray-100 dark:bg-gray-800 rounded-xl p-3 overflow-auto max-h-40 whitespace-pre-wrap break-words">
                        {String(error?.message || error)}
                    </pre>
                    <div className="flex gap-3 mt-5">
                        <button className="btn-secondary flex-1" onClick={() => { window.location.href = '/'; }}>
                            <House className="w-4 h-4" /> {t('nav.home')}
                        </button>
                        <button className="btn-primary flex-1" onClick={() => window.location.reload()}>
                            <RefreshCw className="w-4 h-4" /> {t('errors.reload')}
                        </button>
                    </div>
                </div>
            </div>
        );
    }
}

export default ErrorBoundary;
