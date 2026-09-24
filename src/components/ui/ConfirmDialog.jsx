import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';

const ConfirmDialog = ({ open, title, message, confirmLabel, onConfirm, onCancel }) => {
    const { t } = useTranslation();
    const [busy, setBusy] = useState(false);

    const handleConfirm = async () => {
        setBusy(true);
        try { await onConfirm(); } finally { setBusy(false); }
    };

    return (
        <Modal open={open} onClose={onCancel} title={title || t('common.areYouSure')} size="sm">
            <p className="muted text-sm">{message || t('common.cannotUndo')}</p>
            <div className="flex gap-3 mt-6">
                <button className="btn-secondary flex-1" onClick={onCancel}>{t('common.cancel')}</button>
                <button className="btn-danger flex-1" onClick={handleConfirm} disabled={busy}>
                    {confirmLabel || t('common.delete')}
                </button>
            </div>
        </Modal>
    );
};

export default ConfirmDialog;
