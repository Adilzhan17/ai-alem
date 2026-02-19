import { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext';

interface UserItem {
    id: number;
    email: string;
    full_name: string;
    role: string;
    system_role: string;
    is_banned: boolean;
    is_verified: boolean;
    company_name?: string;
    phone?: string;
    created_at: string;
    listings_count: number;
}

const API = '/api/v1';

export default function BackofficeUsers() {
    const { token, user: currentUser } = useAuth();
    const [users, setUsers] = useState<UserItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [actionUser, setActionUser] = useState<number | null>(null);

    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
    const isAdmin = currentUser?.system_role === 'admin';

    const loadUsers = () => {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (roleFilter) params.set('role', roleFilter);
        fetch(`${API}/backoffice/users?${params}`, { headers })
            .then(r => r.json())
            .then(data => { setUsers(data.items || []); setLoading(false); })
            .catch(() => setLoading(false));
    };

    useEffect(() => { loadUsers(); }, [search, roleFilter]);

    const banUser = async (uid: number, unban: boolean) => {
        setActionUser(uid);
        const reason = unban ? undefined : prompt('Причина бана:');
        if (!unban && !reason) { setActionUser(null); return; }
        await fetch(`${API}/backoffice/users/${uid}/ban`, {
            method: 'POST', headers,
            body: JSON.stringify({ reason, unban }),
        });
        loadUsers();
        setActionUser(null);
    };

    const setRole = async (uid: number) => {
        const newRole = prompt('Новая роль (user / moderator / admin):');
        if (!newRole || !['user', 'moderator', 'admin'].includes(newRole)) return;
        setActionUser(uid);
        await fetch(`${API}/backoffice/users/${uid}/set-role`, {
            method: 'POST', headers,
            body: JSON.stringify({ system_role: newRole }),
        });
        loadUsers();
        setActionUser(null);
    };

    const roleBadge = (role: string) => {
        const colors: Record<string, string> = {
            client: '#6366f1', contractor: '#14b8a6', 'supplier-materials': '#f97316',
        };
        return colors[role] || '#64748b';
    };

    const sysRoleBadge = (sr: string) => {
        const colors: Record<string, string> = { admin: '#ef4444', moderator: '#f59e0b', user: '#64748b' };
        return colors[sr] || '#64748b';
    };

    return (
        <div className="p-8 bg-qal-bg min-h-full">
            <h1 className="text-3xl font-black tracking-tight text-qal-text-primary mb-10">
                👥 Управление пользователями
            </h1>

            {/* Filters */}
            <div className="flex gap-4 mb-8">
                <div className="relative flex-1 max-w-sm">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-qal-text-secondary opacity-40 text-[20px]">search</span>
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Поиск по имени или email..."
                        className="w-full bg-qal-surface border border-qal-border rounded-2xl pl-12 pr-5 py-3.5 text-qal-text-primary text-xs font-bold focus:border-qal-primary/50 focus:outline-none shadow-sm transition-all"
                    />
                </div>
                <select
                    value={roleFilter}
                    onChange={e => setRoleFilter(e.target.value)}
                    className="bg-qal-surface border border-qal-border rounded-2xl px-5 py-3.5 text-qal-text-primary text-xs font-bold focus:border-qal-primary/50 focus:outline-none shadow-sm transition-all cursor-pointer"
                >
                    <option value="">Все роли</option>
                    <option value="client">Клиент</option>
                    <option value="contractor">Подрядчик</option>
                    <option value="supplier-materials">Поставщик</option>
                </select>
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
                                    {['ID', 'Имя', 'Email', 'Роль', 'Доступ', 'Объявления', 'Статус', 'Дата', 'Действия'].map(h => (
                                        <th key={h} className="px-6 py-5 text-left text-qal-text-secondary text-[10px] font-black uppercase tracking-widest opacity-40">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id} className="border-b border-qal-border/50 hover:bg-qal-primary/5 transition-all group">
                                        <td className="px-6 py-5 text-qal-text-secondary font-mono text-[11px] opacity-60">#{u.id}</td>
                                        <td className="px-6 py-5 text-qal-text-primary text-xs font-black tracking-tight">{u.full_name}</td>
                                        <td className="px-6 py-5 text-qal-text-secondary text-xs font-bold opacity-60">{u.email}</td>
                                        <td className="px-6 py-5">
                                            <span
                                                className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border"
                                                style={{ background: `${roleBadge(u.role)}15`, color: roleBadge(u.role), borderColor: `${roleBadge(u.role)}30` }}
                                            >
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span
                                                className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border"
                                                style={{ background: `${sysRoleBadge(u.system_role)}15`, color: sysRoleBadge(u.system_role), borderColor: `${sysRoleBadge(u.system_role)}30` }}
                                            >
                                                {u.system_role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-qal-text-secondary text-xs font-bold opacity-60 text-center">{u.listings_count}</td>
                                        <td className="px-6 py-5">
                                            {u.is_banned ? (
                                                <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-600 border border-red-500/20 text-[9px] font-black uppercase tracking-widest">Забанен</span>
                                            ) : u.is_verified ? (
                                                <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-600 border border-green-500/20 text-[9px] font-black uppercase tracking-widest">Верифицирован</span>
                                            ) : (
                                                <span className="px-3 py-1 rounded-full bg-qal-bg text-qal-text-secondary border border-qal-border text-[9px] font-black uppercase tracking-widest opacity-60">Активен</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-5 text-qal-text-secondary text-[11px] font-bold opacity-40">
                                            {u.created_at ? new Date(u.created_at).toLocaleDateString('ru-RU') : '—'}
                                        </td>
                                        <td className="px-6 py-5">
                                            {isAdmin && u.id !== currentUser?.id && (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => u.is_banned ? banUser(u.id, true) : banUser(u.id, false)}
                                                        disabled={actionUser === u.id}
                                                        title={u.is_banned ? 'Разбанить' : 'Забанить'}
                                                        className={`size-8 rounded-xl flex items-center justify-center transition-all border disabled:opacity-50 ${u.is_banned ? 'bg-green-500/10 hover:bg-green-500 text-green-600 hover:text-white border-green-500/20' : 'bg-red-500/10 hover:bg-red-500 text-red-600 hover:text-white border-red-500/20'}`}
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">{u.is_banned ? 'lock_open' : 'block'}</span>
                                                    </button>
                                                    <button
                                                        onClick={() => setRole(u.id)}
                                                        disabled={actionUser === u.id}
                                                        title="Изменить роль"
                                                        className="size-8 rounded-xl bg-qal-primary/10 hover:bg-qal-primary text-qal-primary hover:text-white flex items-center justify-center transition-all border border-qal-primary/20 disabled:opacity-50"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">key</span>
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
