import { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext';

interface ListingItem {
    id: number;
    title: string;
    city: string;
    district: string;
    price_kzt: number;
    rooms: number;
    status: string;
    owner_id: number;
    owner_name: string;
    created_at: string;
}

const API = '/api/v1';

const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
    draft: { label: 'Черновик', color: '#64748b', icon: '📝' },
    pending_review: { label: 'На модерации', color: '#f59e0b', icon: '⏳' },
    approved: { label: 'Опубликовано', color: '#10b981', icon: '✅' },
    rejected: { label: 'Отклонено', color: '#ef4444', icon: '❌' },
    needs_changes: { label: 'Нужны правки', color: '#f97316', icon: '✏️' },
    archived: { label: 'Архив', color: '#6b7280', icon: '📥' },
    removed: { label: 'Удалено', color: '#dc2626', icon: '🗑️' },
};

export default function BackofficeListings() {
    const { token } = useAuth();
    const [listings, setListings] = useState<ListingItem[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [cityFilter, setCityFilter] = useState('');

    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

    const load = () => {
        setLoading(true);
        const params = new URLSearchParams();
        if (statusFilter) params.set('status_filter', statusFilter);
        if (cityFilter) params.set('city', cityFilter);
        fetch(`${API}/backoffice/listings?${params}`, { headers })
            .then(r => r.json())
            .then(data => {
                setListings(data.items || []);
                setTotal(data.total || 0);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    useEffect(() => { load(); }, [statusFilter, cityFilter]);

    const doModAction = async (id: number, action: string, body?: object) => {
        await fetch(`${API}/moderation/listing/${id}/${action}`, {
            method: 'POST', headers, body: JSON.stringify(body || {}),
        });
        load();
    };

    const formatPrice = (p: number) => {
        if (!p) return '—';
        if (p >= 1e6) return `${(p / 1e6).toFixed(1)} млн ₸`;
        return `${p.toLocaleString()} ₸`;
    };

    return (
        <div className="p-8 bg-qal-bg min-h-full">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-qal-text-primary mb-1">
                        🏘️ Все объявления
                    </h1>
                    <p className="text-qal-text-secondary text-sm font-bold opacity-60">
                        {total} объявлений в системе
                    </p>
                </div>
            </div>

            {/* Status chips */}
            <div className="flex gap-3 mb-8 flex-wrap">
                <button
                    onClick={() => setStatusFilter('')}
                    className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!statusFilter ? 'bg-qal-primary text-white shadow-lg shadow-qal-primary/20' : 'bg-qal-surface text-qal-text-secondary border border-qal-border hover:border-qal-primary/40'}`}
                >
                    Все
                </button>
                {Object.entries(statusConfig).map(([key, cfg]) => {
                    const isActive = statusFilter === key;
                    return (
                        <button
                            key={key}
                            onClick={() => setStatusFilter(isActive ? '' : key)}
                            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border ${isActive ? 'bg-qal-surface border-qal-primary/40 text-qal-text-primary shadow-sm' : 'bg-qal-surface text-qal-text-secondary border-qal-border hover:border-qal-primary/40 opacity-60 hover:opacity-100'}`}
                        >
                            <span className="text-[14px]">{cfg.icon}</span> {cfg.label}
                        </button>
                    );
                })}
            </div>

            {/* City filter */}
            <div className="flex gap-4 mb-8">
                <div className="relative flex-1 max-w-sm">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-qal-text-secondary opacity-40 text-[20px]">search</span>
                    <input
                        value={cityFilter}
                        onChange={e => setCityFilter(e.target.value)}
                        placeholder="Фильтр по городу..."
                        className="w-full bg-qal-surface border border-qal-border rounded-2xl pl-12 pr-5 py-3.5 text-qal-text-primary text-xs font-bold focus:border-qal-primary/50 focus:outline-none shadow-sm transition-all"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-qal-surface border border-qal-border rounded-[2rem] overflow-hidden shadow-sm">
                {loading ? (
                    <div className="p-20 text-center text-qal-text-secondary font-bold opacity-60 italic">⏳ Загрузка...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-qal-border bg-qal-bg/30">
                                    {['ID', 'Заголовок', 'Город', 'Цена', 'Комнаты', 'Владелец', 'Статус', 'Дата', 'Действия'].map(h => (
                                        <th key={h} className="px-6 py-5 text-left text-qal-text-secondary text-[10px] font-black uppercase tracking-widest opacity-40">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {listings.map(l => {
                                    const cfg = statusConfig[l.status] || { label: l.status, color: '#64748b', icon: '⚪' };
                                    return (
                                        <tr key={l.id} className="border-b border-qal-border/50 hover:bg-qal-primary/5 transition-all group">
                                            <td className="px-6 py-5 text-qal-text-secondary font-mono text-[11px] opacity-60">#{l.id}</td>
                                            <td className="px-6 py-5 text-qal-text-primary text-xs font-black max-w-[200px] truncate tracking-tight">{l.title}</td>
                                            <td className="px-6 py-5 text-qal-text-secondary text-xs font-bold opacity-60">{l.city}</td>
                                            <td className="px-6 py-5 text-qal-primary text-xs font-black font-mono">{formatPrice(l.price_kzt)}</td>
                                            <td className="px-6 py-5 text-qal-text-secondary text-xs font-bold opacity-60 text-center">{l.rooms}</td>
                                            <td className="px-6 py-5 text-qal-text-secondary text-xs font-bold opacity-60">{l.owner_name || `#${l.owner_id}`}</td>
                                            <td className="px-6 py-5">
                                                <span
                                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border"
                                                    style={{ background: `${cfg.color}15`, color: cfg.color, borderColor: `${cfg.color}30` }}
                                                >
                                                    {cfg.icon} {cfg.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-qal-text-secondary text-[11px] font-bold opacity-40">
                                                {l.created_at ? new Date(l.created_at).toLocaleDateString('ru-RU') : '—'}
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex gap-2">
                                                    {l.status === 'pending_review' && (
                                                        <>
                                                            <button
                                                                onClick={() => doModAction(l.id, 'approve')}
                                                                title="Одобрить"
                                                                className="size-8 rounded-xl bg-green-500/10 hover:bg-green-500 text-green-600 hover:text-white flex items-center justify-center transition-all border border-green-500/20"
                                                            >
                                                                <span className="material-symbols-outlined text-[18px]">check</span>
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    const reason = prompt('Причина отклонения:');
                                                                    if (reason) doModAction(l.id, 'reject', { reason });
                                                                }}
                                                                title="Отклонить"
                                                                className="size-8 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-600 hover:text-white flex items-center justify-center transition-all border border-red-500/20"
                                                            >
                                                                <span className="material-symbols-outlined text-[18px]">close</span>
                                                            </button>
                                                        </>
                                                    )}
                                                    {l.status === 'approved' && (
                                                        <button
                                                            onClick={() => {
                                                                const reason = prompt('Причина удаления:');
                                                                if (reason) doModAction(l.id, 'remove', { reason });
                                                            }}
                                                            title="Удалить"
                                                            className="size-8 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-600 hover:text-white flex items-center justify-center transition-all border border-red-500/20"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {listings.length === 0 && (
                                    <tr>
                                        <td colSpan={9} className="px-8 py-20 text-center text-qal-text-secondary font-bold opacity-60 italic">
                                            Нет объявлений по заданным фильтрам
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
