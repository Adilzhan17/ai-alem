import { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext';

interface AuditEntry {
    id: number;
    actor_id: number;
    actor_email: string;
    action: string;
    entity_type: string;
    entity_id: number;
    old_value: any;
    new_value: any;
    metadata: any;
    created_at: string;
}

const API = '/api/v1';

export default function BackofficeAudit() {
    const { token } = useAuth();
    const [entries, setEntries] = useState<AuditEntry[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [actionFilter, setActionFilter] = useState('');
    const [entityFilter, setEntityFilter] = useState('');
    const [expanded, setExpanded] = useState<number | null>(null);

    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

    const load = () => {
        setLoading(true);
        const params = new URLSearchParams({ limit: '50' });
        if (actionFilter) params.set('action', actionFilter);
        if (entityFilter) params.set('entity_type', entityFilter);
        fetch(`${API}/audit-log?${params}`, { headers })
            .then(r => r.json())
            .then(data => {
                setEntries(data.items || []);
                setTotal(data.total || 0);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    useEffect(() => { load(); }, [actionFilter, entityFilter]);

    const badgeColor = (action: string) => {
        if (action.includes('approve')) return '#10b981';
        if (action.includes('reject') || action.includes('ban') || action.includes('remove')) return '#ef4444';
        if (action.includes('create') || action.includes('register')) return '#6366f1';
        if (action.includes('update') || action.includes('request_changes')) return '#f59e0b';
        if (action.includes('login')) return '#06b6d4';
        return '#64748b';
    };

    return (
        <div className="p-8 bg-qal-bg min-h-full">
            <h1 className="text-3xl font-black tracking-tight text-qal-text-primary mb-1">
                📜 Аудит-лог
            </h1>
            <p className="text-qal-text-secondary text-sm font-bold opacity-60 mb-8">
                Иммутабельный журнал всех действий в системе ({total} записей)
            </p>

            {/* Filters */}
            <div className="flex gap-4 mb-8">
                <div className="relative flex-1 max-w-sm">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-qal-text-secondary opacity-40 text-[20px]">search</span>
                    <input
                        value={actionFilter}
                        onChange={e => setActionFilter(e.target.value)}
                        placeholder="Фильтр по действию..."
                        className="w-full bg-qal-surface border border-qal-border rounded-2xl pl-12 pr-5 py-3.5 text-qal-text-primary text-xs font-bold focus:border-qal-primary/50 focus:outline-none shadow-sm transition-all"
                    />
                </div>
                <select
                    value={entityFilter}
                    onChange={e => setEntityFilter(e.target.value)}
                    className="bg-qal-surface border border-qal-border rounded-2xl px-5 py-3.5 text-qal-text-primary text-xs font-bold focus:border-qal-primary/50 focus:outline-none shadow-sm transition-all cursor-pointer"
                >
                    <option value="">Все типы</option>
                    <option value="user">Пользователи</option>
                    <option value="listing">Объявления</option>
                    <option value="project">Проекты</option>
                    <option value="estimate">Сметы</option>
                    <option value="contractor">Подрядчики</option>
                    <option value="system">Система</option>
                </select>
                <button
                    onClick={load}
                    className="size-[46px] rounded-2xl bg-qal-primary/10 hover:bg-qal-primary text-qal-primary hover:text-white flex items-center justify-center transition-all border border-qal-primary/20"
                >
                    <span className="material-symbols-outlined">refresh</span>
                </button>
            </div>

            {/* Table */}
            <div className="bg-qal-surface border border-qal-border rounded-[2rem] overflow-hidden shadow-sm">
                {loading ? (
                    <div className="p-20 text-center text-qal-text-secondary font-bold opacity-60 italic">⏳ Загрузка...</div>
                ) : entries.length === 0 ? (
                    <div className="p-20 text-center text-qal-text-secondary font-bold opacity-60 italic">Нет записей</div>
                ) : (
                    <div className="divide-y divide-qal-border/50">
                        {entries.map(e => (
                            <div key={e.id} className="group">
                                <div
                                    onClick={() => setExpanded(expanded === e.id ? null : e.id)}
                                    className="flex items-center gap-6 px-8 py-5 cursor-pointer hover:bg-qal-primary/5 transition-all"
                                >
                                    <span className="text-qal-text-secondary font-mono text-[11px] opacity-40 w-10">#{e.id}</span>
                                    <span
                                        className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border font-mono whitespace-nowrap min-w-[140px] text-center"
                                        style={{ background: `${badgeColor(e.action)}15`, color: badgeColor(e.action), borderColor: `${badgeColor(e.action)}30` }}
                                    >
                                        {e.action}
                                    </span>
                                    <span className="text-qal-text-primary text-xs font-black min-w-[200px]">{e.actor_email}</span>
                                    <span className="text-qal-text-secondary font-mono text-[11px] opacity-60 min-w-[120px]">
                                        {e.entity_type}:{e.entity_id || '—'}
                                    </span>
                                    <span className="flex-1" />
                                    <span className="text-qal-text-secondary text-[10px] font-bold opacity-40">
                                        {e.created_at ? new Date(e.created_at).toLocaleString('ru-RU') : ''}
                                    </span>
                                    <span className={`material-symbols-outlined text-qal-text-secondary opacity-40 transition-transform duration-300 ${expanded === e.id ? 'rotate-180' : ''}`}>
                                        expand_more
                                    </span>
                                </div>

                                {/* Expanded details */}
                                {expanded === e.id && (
                                    <div className="px-24 pb-8 pt-4 bg-qal-bg/30">
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl">
                                            {e.old_value && (
                                                <div>
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <span className="material-symbols-outlined text-[16px] text-red-500">history</span>
                                                        <div className="text-[10px] font-black uppercase tracking-widest text-qal-text-secondary opacity-60">До изменений</div>
                                                    </div>
                                                    <pre className="text-[11px] text-red-600 bg-red-500/5 border border-red-500/10 p-5 rounded-[1.5rem] overflow-auto max-h-80 font-mono shadow-inner">
                                                        {JSON.stringify(e.old_value, null, 2)}
                                                    </pre>
                                                </div>
                                            )}
                                            {e.new_value && (
                                                <div>
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <span className="material-symbols-outlined text-[16px] text-green-500">update</span>
                                                        <div className="text-[10px] font-black uppercase tracking-widest text-qal-text-secondary opacity-60">После изменений</div>
                                                    </div>
                                                    <pre className="text-[11px] text-green-700 bg-green-500/5 border border-green-500/10 p-5 rounded-[1.5rem] overflow-auto max-h-80 font-mono shadow-inner">
                                                        {JSON.stringify(e.new_value, null, 2)}
                                                    </pre>
                                                </div>
                                            )}
                                        </div>
                                        {e.metadata && (
                                            <div className="mt-8 max-w-5xl">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className="material-symbols-outlined text-[16px] text-qal-primary">info</span>
                                                    <div className="text-[10px] font-black uppercase tracking-widest text-qal-text-secondary opacity-60">Метаданные</div>
                                                </div>
                                                <pre className="text-[11px] text-qal-text-primary bg-qal-bg border border-qal-border p-5 rounded-[1.5rem] overflow-auto font-mono shadow-inner opacity-80">
                                                    {JSON.stringify(e.metadata, null, 2)}
                                                </pre>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
