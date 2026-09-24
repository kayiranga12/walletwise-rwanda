const escape = (value) => {
    const s = value === null || value === undefined ? '' : String(value);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

// columns: [{ key, label }] where key is a property name or (row) => value
export const toCSV = (rows, columns) => {
    const header = columns.map(c => escape(c.label)).join(',');
    const lines = rows.map(row =>
        columns.map(c => escape(typeof c.key === 'function' ? c.key(row) : row[c.key])).join(',')
    );
    return [header, ...lines].join('\r\n');
};

export const downloadFile = (filename, content, type = 'text/csv;charset=utf-8') => {
    // The BOM makes Excel open UTF-8 (Kinyarwanda text, emoji) correctly
    const blob = new Blob([type.startsWith('text/csv') ? '﻿' + content : content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
};
