import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AuditLogService, type AuditLogEntry, type AuditLogFilter } from '../services/auditLog.service';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import {
    Shield,
    Search,
    Filter,
    ChevronLeft,
    ChevronRight,
    AlertTriangle,
    FileText,
    User,
    Calendar,
    Activity,
    Loader2,
    RefreshCw,
    Eye,
} from 'lucide-react';

/**
 * Audit Log Page – /admin/audit-log
 * Read-only audit trail viewer for admin users.
 * Shows all recorded sensitive actions: user CRUD, password changes, role modifications.
 */

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
    CREATE_USER: { label: 'Buat User', color: 'bg-green-100 text-green-800' },
    UPDATE_USER: { label: 'Update User', color: 'bg-blue-100 text-blue-800' },
    UPDATE_USER_WITH_PASSWORD: { label: 'Update + Password', color: 'bg-amber-100 text-amber-800' },
    DELETE_USER: { label: 'Hapus User', color: 'bg-red-100 text-red-800' },
    RESET_PASSWORD: { label: 'Reset Password', color: 'bg-orange-100 text-orange-800' },
    CHANGE_ROLE: { label: 'Ubah Role', color: 'bg-purple-100 text-purple-800' },
    VIEW_PASSWORD: { label: 'Lihat Password', color: 'bg-yellow-100 text-yellow-800 border border-yellow-300' },
    GENERATE_MASSAL: { label: 'Generate Massal', color: 'bg-teal-100 text-teal-800' },
};

const PAGE_SIZE = 25;

const AuditLogPage = () => {
    const { user, isAdmin } = useAuth();
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

    // Filters
    const [actionFilter, setActionFilter] = useState('');
    const [moduleFilter, setModuleFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [distinctActions, setDistinctActions] = useState<string[]>([]);
    const [distinctModules, setDistinctModules] = useState<string[]>([]);

    const fetchLogs = useCallback(async () => {
        if (!isAdmin) return;
        setLoading(true);

        try {
            const filter: AuditLogFilter = {
                limit: PAGE_SIZE,
                offset: page * PAGE_SIZE,
            };

            if (actionFilter) filter.action = actionFilter;
            if (moduleFilter) filter.module_code = moduleFilter;

            const { data, count } = await AuditLogService.list(filter);
            setLogs(data);
            setTotalCount(count);
        } catch (err) {
            console.error('[AuditLogPage] Error fetching logs:', err);
        } finally {
            setLoading(false);
        }
    }, [isAdmin, page, actionFilter, moduleFilter]);

    const fetchFilterOptions = useCallback(async () => {
        const [actions, modules] = await Promise.all([
            AuditLogService.getDistinctActions(),
            AuditLogService.getDistinctModules(),
        ]);
        setDistinctActions(actions);
        setDistinctModules(modules);
    }, []);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    useEffect(() => {
        fetchFilterOptions();
    }, [fetchFilterOptions]);

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    const getActionBadge = (action: string) => {
        const config = ACTION_LABELS[action] || { label: action, color: 'bg-gray-100 text-gray-700' };
        return (
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
                {config.label}
            </span>
        );
    };

    const formatDate = (dateStr: string) => {
        try {
            return format(new Date(dateStr), 'dd MMM yyyy, HH:mm', { locale: idLocale });
        } catch {
            return dateStr;
        }
    };

    const renderJsonPreview = (obj: Record<string, any> | null) => {
        if (!obj) return <span className="text-gray-400 italic">—</span>;
        const keys = Object.keys(obj);
        if (keys.length === 0) return <span className="text-gray-400 italic">—</span>;

        return (
            <div className="text-xs space-y-0.5 max-w-xs">
                {keys.slice(0, 3).map(key => (
                    <div key={key} className="truncate">
                        <span className="font-medium text-gray-600">{key}:</span>{' '}
                        <span className="text-gray-500">
                            {typeof obj[key] === 'object' ? JSON.stringify(obj[key]) : String(obj[key])}
                        </span>
                    </div>
                ))}
                {keys.length > 3 && (
                    <span className="text-gray-400 text-xs">+{keys.length - 3} more...</span>
                )}
            </div>
        );
    };

    if (!isAdmin) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                    <p className="text-gray-500">Anda tidak memiliki akses ke halaman ini.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl text-white shadow-lg shadow-purple-200">
                        <Shield className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Audit Log</h1>
                        <p className="text-sm text-gray-500">
                            Riwayat semua aksi sensitif • {totalCount} entri
                        </p>
                    </div>
                </div>
                <button
                    onClick={fetchLogs}
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <select
                    value={actionFilter}
                    onChange={e => { setActionFilter(e.target.value); setPage(0); }}
                    className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200"
                >
                    <option value="">Semua Aksi</option>
                    {distinctActions.map(a => (
                        <option key={a} value={a}>{ACTION_LABELS[a]?.label || a}</option>
                    ))}
                </select>

                <select
                    value={moduleFilter}
                    onChange={e => { setModuleFilter(e.target.value); setPage(0); }}
                    className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200"
                >
                    <option value="">Semua Modul</option>
                    {distinctModules.map(m => (
                        <option key={m} value={m}>{m}</option>
                    ))}
                </select>
            </div>

            {/* Warning banner */}
            <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-700">
                    <strong>Catatan Keamanan:</strong> Audit log bersifat <strong>immutable</strong> — tidak dapat diedit atau dihapus.
                    Semua aksi sensitif (hapus user, reset password, ubah role, lihat password plaintext) tercatat secara otomatis.
                </p>
            </div>

            {/* Table */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                    </div>
                ) : logs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                        <FileText className="w-10 h-10 mb-3" />
                        <p>Belum ada audit log</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">Waktu</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">User</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">Aksi</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">Modul</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">Detail Perubahan</th>
                                    <th className="px-4 py-3 text-center font-medium text-gray-500 w-12"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">
                                            {formatDate(log.created_at)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 bg-gradient-to-br from-purple-100 to-violet-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                    <User className="w-3.5 h-3.5 text-purple-600" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-medium text-gray-900 truncate max-w-[160px]">
                                                        {log.user_name || 'Unknown'}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400 truncate max-w-[160px]">
                                                        {log.user_email}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">{getActionBadge(log.action)}</td>
                                        <td className="px-4 py-3 text-xs text-gray-500">{log.module_code || '—'}</td>
                                        <td className="px-4 py-3">{renderJsonPreview(log.new_values)}</td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => setSelectedLog(log)}
                                                className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                                title="Lihat detail"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                        <p className="text-xs text-gray-500">
                            Halaman {page + 1} dari {totalPages} ({totalCount} total)
                        </p>
                        <div className="flex gap-1">
                            <button
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                disabled={page === 0}
                                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                disabled={page >= totalPages - 1}
                                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {selectedLog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedLog(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900">Detail Audit Log</h3>
                            <p className="text-xs text-gray-500 mt-1">{formatDate(selectedLog.created_at)}</p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs font-medium text-gray-500 mb-1">Aksi</p>
                                    {getActionBadge(selectedLog.action)}
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500 mb-1">Modul</p>
                                    <p className="text-sm text-gray-900">{selectedLog.module_code || '—'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500 mb-1">User (pelaku)</p>
                                    <p className="text-sm text-gray-900">{selectedLog.user_name}</p>
                                    <p className="text-xs text-gray-500">{selectedLog.user_email}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500 mb-1">Entity</p>
                                    <p className="text-sm text-gray-900">{selectedLog.entity || '—'}</p>
                                    <p className="text-xs text-gray-500 font-mono">{selectedLog.entity_id || ''}</p>
                                </div>
                            </div>

                            {selectedLog.old_values && (
                                <div>
                                    <p className="text-xs font-medium text-gray-500 mb-2">Nilai Lama</p>
                                    <pre className="p-3 bg-red-50 border border-red-100 rounded-lg text-xs font-mono text-red-800 overflow-x-auto whitespace-pre-wrap">
                                        {JSON.stringify(selectedLog.old_values, null, 2)}
                                    </pre>
                                </div>
                            )}

                            {selectedLog.new_values && (
                                <div>
                                    <p className="text-xs font-medium text-gray-500 mb-2">Nilai Baru</p>
                                    <pre className="p-3 bg-green-50 border border-green-100 rounded-lg text-xs font-mono text-green-800 overflow-x-auto whitespace-pre-wrap">
                                        {JSON.stringify(selectedLog.new_values, null, 2)}
                                    </pre>
                                </div>
                            )}

                            {selectedLog.user_agent && (
                                <div>
                                    <p className="text-xs font-medium text-gray-500 mb-1">User Agent</p>
                                    <p className="text-xs text-gray-400 font-mono break-all">{selectedLog.user_agent}</p>
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-gray-100 text-right">
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuditLogPage;
