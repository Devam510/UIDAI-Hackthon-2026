
export interface AuditLogEntry {
    id: string;
    timestamp: string;
    userId: string;
    action: string;
    resource: string;
    details: string;
    ipAddress: string;
    status: 'SUCCESS' | 'FAILURE' | 'WARNING';
}

const STORAGE_KEY = 'uidai_audit_logs';

// Mock data to pre-fill if empty
const MOCK_LOGS: AuditLogEntry[] = [
    {
        id: 'log_001',
        timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
        userId: 'admin_usr_01',
        action: 'SYSTEM_STARTUP',
        resource: 'Core System',
        details: 'System services initialized successfully',
        ipAddress: '10.0.0.1',
        status: 'SUCCESS'
    },
    {
        id: 'log_002',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        userId: 'analyst_05',
        action: 'EXPORT_DATA',
        resource: 'District_Risk_UP.csv',
        details: 'Exported risk data for Uttar Pradesh',
        ipAddress: '192.168.1.45',
        status: 'SUCCESS'
    }
];

export const auditService = {
    getLogs: (): AuditLogEntry[] => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (!stored) {
                // Initialize with mock data
                localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_LOGS));
                return MOCK_LOGS;
            }
            return JSON.parse(stored).sort((a: AuditLogEntry, b: AuditLogEntry) =>
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );
        } catch (e) {
            console.error('Failed to retrieve logs', e);
            return [];
        }
    },

    logAction: (action: string, resource: string, details: string = '', status: 'SUCCESS' | 'FAILURE' | 'WARNING' = 'SUCCESS') => {
        try {
            const newLog: AuditLogEntry = {
                id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                timestamp: new Date().toISOString(),
                userId: 'current_user', // Simulated
                action,
                resource,
                details,
                ipAddress: '192.168.1.100', // Simulated
                status
            };

            const currentLogs = auditService.getLogs();
            const updatedLogs = [newLog, ...currentLogs].slice(0, 500); // Keep last 500 logs
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLogs));
            return newLog;
        } catch (e) {
            console.error('Failed to log action', e);
        }
    },

    clearLogs: () => {
        localStorage.removeItem(STORAGE_KEY);
    }
};
