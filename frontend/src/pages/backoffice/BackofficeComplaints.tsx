import { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext';

interface ComplaintItem {
    id: number;
    reporter_id: number;
    entity_type: string;
    entity_id: number;
    reason: string;
    status: string;
    resolution: string | null;
    created_at: string;
}

const API = '/api/v1';

const statusColors: Record<string, string> = {
    open: '#f59e0b',
    investigating: '#6366f1',
    resolved: '#10b981',
    dismissed: '#64748b',
};

export default function BackofficeComplaints() {
    const { token } = useAuth();
    const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [resolveId, setResolveId] = useState<number | null>(null);
    const [resolution, setResolution] = useState('');

    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

    const load = () => {
        const params = new URLSearchParams();
        if (statusFilter) params.set('status_filter', statusFilter);
        fetch(`${API}/backoffice/complaints?${params}`, { headers })
            .then(r => r.json())
            .then(data => { setComplaints(Array.isArray(data) ? data : []); setLoading(false); })
            .catch(() => setLoading(false));
    };

    useEffect(() => { load(); }, [statusFilter]);

    const resolve = async (id: number, status: 'resolved' | 'dismissed') => {
        await fetch(`${API}/backoffice/complaints/${id}`, {
            method: 'PUT', headers,
            body: JSON.stringify({ status, resolution: resolution || null }),
        });
        setResolveId(null);
        setResolution('');
        load();
    };

    return (
        <div className="p-8 bg-qal-bg min-h-full">
            <h1 className="text-3xl font-black tracking-tight text-qal-text-primary mb-1">
                ⚠️ Жалобы
            </h1>
            <p className="text-qal-text-secondary text-sm font-bold opacity-60 mb-10">
                Жалобы пользователей на объявления, пользователей и подрядчиков
            </p>

            {/* Status filter */}
            <div className="flex flex-wrap gap-3 mb-8">
                {['', 'open', 'investigating', 'resolved', 'dismissed'].map(s => (
                    <button
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border shadow-sm ${statusFilter === s ? 'bg-qal-primary text-white border-qal-primary shadow-qal-primary/20' : 'bg-qal-surface text-qal-text-secondary border-qal-border hover:border-qal-primary/40'}`}
                    >
                        {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'Все'}
                    </button>
                ))}
            </div>

            {/* List */}
            <div className="bg-qal-surface border border-qal-border rounded-[2.5rem] overflow-hidden shadow-sm">
                {loading ? (
                    <div className="p-20 text-center text-qal-text-secondary font-bold opacity-60 italic">⏳ Загрузка...</div>
                ) : complaints.length === 0 ? (
                    <div className="p-20 text-center">
                        <div className="size-20 rounded-3xl bg-qal-bg flex items-center justify-center text-4xl mx-auto mb-6 shadow-inner">🎉</div>
                        <h3 className="text-qal-text-primary text-2xl font-black tracking-tight mb-2">
                            {statusFilter ? 'Нет жалоб с таким статусом' : 'Нет жалоб'}
                        </h3>
                        <p className="text-qal-text-secondary text-sm font-bold opacity-60 max-w-xs mx-auto">
                            Похоже, все пользователи довольны платформой.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-qal-border/50">
                        {complaints.map(c => (
                            <div key={c.id} className="p-10 hover:bg-qal-primary/5 transition-all">
                                <div className="flex flex-col lg:flex-row justify-between items-start gap-8">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-4 mb-4">
                                            <span className="text-qal-text-secondary font-mono text-[11px] opacity-40">#{c.id}</span>
                                            <span
                                                className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border"
                                                style={{ background: `${statusColors[c.status] || '#64748b'}15`, color: statusColors[c.status] || '#64748b', borderColor: `${statusColors[c.status] || '#64748b'}30` }}
                                            >
                                                {c.status}
                                            </span>
                                            <span className="text-qal-text-secondary text-[10px] font-black uppercase tracking-widest opacity-40">
                                                {c.entity_type}:{c.entity_id}
                                            </span>
                                            <span className="text-qal-text-secondary text-[10px] font-black opacity-30 flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[14px]">person</span>
                                                от пользователя #{c.reporter_id}
                                            </span>
                                        </div>

                                        <p className="text-qal-text-primary text-sm font-bold leading-relaxed mb-4">
                                            {c.reason}
                                        </p>

                                        {c.resolution && (
                                            <div className="bg-qal-bg/50 border border-qal-border rounded-xl p-4 mb-4">
                                                <p className="text-qal-text-secondary text-[11px] font-black uppercase tracking-widest opacity-40 mb-1 flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-[14px]">verified</span> Решение
                                                </p>
                                                <p className="text-qal-text-primary text-xs font-bold italic opacity-80">
                                                    {c.resolution}
                                                </p>
                                            </div>
                                        )}

                                        <span className="text-qal-text-secondary text-[10px] font-bold opacity-30">
                                            {c.created_at ? new Date(c.created_at).toLocaleString('ru-RU') : ''}
                                        </span>
                                    </div>

                                    {/* Actions */}
                                    {(c.status === 'open' || c.status === 'investigating') && (
                                        <div className="flex flex-row lg:flex-col gap-3 min-w-[140px]">
                                            <button
                                                onClick={() => { setResolveId(c.id); setResolution(''); }}
                                                className="flex-1 px-4 py-2.5 rounded-xl bg-green-500/10 hover:bg-green-500 text-green-600 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all border border-green-500/20 shadow-sm"
                                            >
                                                ✅ Решить
                                            </button>
                                            <button
                                                onClick={() => resolve(c.id, 'dismissed')}
                                                className="flex-1 px-4 py-2.5 rounded-xl bg-qal-bg border border-qal-border text-qal-text-secondary hover:text-qal-text-primary text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
                                            >
                                                🗑️ Отклонить
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Resolve form */}
                                {resolveId === c.id && (
                                    <div className="mt-8 p-6 bg-qal-bg border border-qal-primary/20 rounded-[1.5rem] flex flex-col md:flex-row gap-4 animate-in slide-in-from-top-2 duration-300">
                                        <input
                                            value={resolution}
                                            onChange={e => setResolution(e.target.value)}
                                            placeholder="Описание решения..."
                                            className="flex-1 bg-qal-surface border border-qal-border rounded-xl px-5 py-3 text-qal-text-primary text-xs font-bold focus:border-qal-primary/50 focus:outline-none transition-all shadow-inner"
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => resolve(c.id, 'resolved')}
                                                className="px-6 py-3 rounded-xl bg-qal-primary hover:bg-qal-primary-dark text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-qal-primary/20"
                                            >
                                                Подтвердить
                                            </button>
                                            <button
                                                onClick={() => setResolveId(null)}
                                                className="px-6 py-3 rounded-xl text-qal-text-secondary hover:text-qal-text-primary text-[10px] font-black uppercase tracking-widest transition-all"
                                            >
                                                Отмена
                                            </button>
                                        </div>
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
