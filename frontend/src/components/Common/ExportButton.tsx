import React from 'react';
import { Download } from 'lucide-react';
import client from '../../api/client';

interface ExportButtonProps {
    endpoint: string;
    filename: string;
    label?: string;
    state?: string;
    disabled?: boolean;
    className?: string;
}

const ExportButton: React.FC<ExportButtonProps> = ({
    endpoint,
    filename,
    label = 'Export CSV',
    state,
    disabled = false,
    className = ''
}) => {
    const [loading, setLoading] = React.useState(false);

    const handleExport = async () => {
        setLoading(true);
        try {
            const params = state ? { state } : {};
            const response = await client.get(endpoint, {
                params,
                responseType: 'blob'
            });

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            // Show success toast (optional)
            console.log('Export successful:', filename);
        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleExport}
            disabled={disabled || loading}
            className={`flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors ${className}`}
        >
            <Download size={18} className={loading ? 'animate-bounce' : ''} />
            {loading ? 'Exporting...' : label}
        </button>
    );
};

export default ExportButton;
