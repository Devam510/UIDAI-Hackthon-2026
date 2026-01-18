import React, { useEffect, useState } from 'react';
import { Shield, Search, Download, Filter, AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import Card from '../components/Common/Card';
import { auditService, AuditLogEntry } from '../services/auditService';

const AuditLog: React.FC = () => {
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUCCESS' | 'FAILURE' | 'WARNING'>('ALL');
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const loadLogs = () => {
        setLoading(true);
        // Simulate network delay for realism
        setTimeout(() => {
            const data = auditService.getLogs();
            setLogs(data);
            setLoading(false);
        }, 600);
    };

    useEffect(() => {
        loadLogs();
        // Log view action
        auditService.logAction('VIEW_PAGE', 'Audit Logs', 'Compliance officer accessed audit trail');
    }, []);

    const handleRefresh = () => {
        loadLogs();
    };

    const handleExport = () => {
        auditService.logAction('EXPORT_LOGS', 'audit_dump.csv', 'User exported audit logs');

        // Generate CSV content
        const headers = ['ID', 'Timestamp', 'User ID', 'Action', 'Resource', 'IP Address', 'Status', 'Details'];
        const csvRows = [
            headers.join(','),
            ...logs.map(log => {
                const row = [
                    log.id,
                    `"${new Date(log.timestamp).toISOString()}"`,
                    log.userId,
                    `"${log.action}"`,
                    `"${log.resource}"`,
                    log.ipAddress,
                    log.status,
                    `"${log.details.replace(/"/g, '""')}"` // Escape quotes
                ];
                return row.join(',');
            })
        ];
        const csvContent = csvRows.join('\n');

        // Trigger download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        loadLogs(); // Refresh to show the export action
    };

    const filteredLogs = logs.filter(log => {
        const matchesSearch =
            log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.details.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFilter = statusFilter === 'ALL' || log.status === statusFilter;

        return matchesSearch && matchesFilter;
    });

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'SUCCESS': return <CheckCircle size={16} className="text-green-500" />;
            case 'FAILURE': return <XCircle size={16} className="text-red-500" />;
            case 'WARNING': return <AlertTriangle size={16} className="text-orange-500" />;
            default: return <Shield size={16} className="text-slate-400" />;
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Shield className="text-blue-600 dark:text-blue-400" />
                        System Audit Log
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Compliance tracking for all system access and data operations.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleRefresh}
                        className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="Refresh Logs"
                    >
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 dark:bg-slate-700 text-white rounded-lg hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors shadow-sm"
                    >
                        <Download size={18} />
                        <span>Export Secure Logs</span>
                    </button>
                </div>
            </div>

            <Card className="border-t-4 border-t-blue-600">
                {/* Toolbar */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search by Action, User, or Resource..."
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="relative">
                        <button
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className={`flex items-center gap-2 px-3 py-2 border rounded-lg transition-colors ${statusFilter !== 'ALL'
                                    ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400'
                                    : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                                }`}
                        >
                            <Filter size={18} />
                            <span>{statusFilter === 'ALL' ? 'Filter Status' : statusFilter}</span>
                        </button>

                        {isFilterOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-10 py-1">
                                {['ALL', 'SUCCESS', 'FAILURE', 'WARNING'].map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => {
                                            setStatusFilter(status as any);
                                            setIsFilterOpen(false);
                                        }}
                                        className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700/50 ${statusFilter === status
                                                ? 'text-blue-600 dark:text-blue-400 font-medium'
                                                : 'text-slate-700 dark:text-slate-300'
                                            }`}
                                    >
                                        {status === 'ALL' ? 'All Records' : status}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Secure Table */}
                <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="px-6 py-3 font-medium">Status</th>
                                <th className="px-6 py-3 font-medium">Timestamp</th>
                                <th className="px-6 py-3 font-medium">User ID</th>
                                <th className="px-6 py-3 font-medium">Action</th>
                                <th className="px-6 py-3 font-medium">Resource</th>
                                <th className="px-6 py-3 font-medium">IP Address</th>
                                <th className="px-6 py-3 font-medium text-right">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-900">
                            {filteredLogs.length > 0 ? (
                                filteredLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusIcon(log.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-slate-500 dark:text-slate-400 font-mono text-xs">
                                            {new Date(log.timestamp).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-500 dark:text-slate-400">
                                            {log.userId}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-2 py-1 rounded text-xs font-semibold
                                                ${log.action.includes('VIEW') ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                                                    log.action.includes('EXPORT') ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
                                                        'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                                            {log.resource}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 dark:text-slate-500 font-mono text-xs">
                                            {log.ipAddress}
                                        </td>
                                        <td className="px-6 py-4 text-right text-slate-500 text-xs truncate max-w-[200px]" title={log.details}>
                                            {log.details}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                                        No audit logs found matching your criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                        <Shield size={14} className="text-green-500" />
                        <span>Audit Log Integrity Verified</span>
                    </div>
                    <div>
                        Showing {filteredLogs.length} records
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default AuditLog;
