import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../AuthContext';
import { useLanguage } from '../LanguageContext';

export default function ProfilePage() {
    const { user, token, logout, updateUser } = useAuth();
    const { setLanguage } = useLanguage();
    const navigate = useNavigate();
    const [profile, setProfile] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');

    const [editData, setEditData] = useState({
        full_name: '',
        interface_lang: 'ru',
        currency_format: 'KZT',
        avatar_url: ''
    });

    useEffect(() => {
        const fetchProfile = async () => {
            // ... existing fetch logic
            try {
                const res = await fetch('/api/v1/users/me', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setProfile(data);
                    setEditData({
                        full_name: data.full_name || '',
                        interface_lang: data.interface_lang || 'ru',
                        currency_format: data.currency_format || 'KZT',
                        avatar_url: data.avatar_url || ''
                    });
                }
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        if (token) fetchProfile();
    }, [token]);

    const handleSave = async () => {
        setIsSaving(true);
        setMessage('');
        try {
            const res = await fetch('/api/v1/users/me', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(editData)
            });
            if (res.ok) {
                const updated = await res.json();
                setProfile(updated);
                // Update global auth context
                if (user) {
                    updateUser({ full_name: updated.full_name, avatar_url: updated.avatar_url });
                }
                setLanguage(updated.interface_lang);
                setMessage('Изменения успешно сохранены!');
                setTimeout(() => setMessage(''), 3000);
            }
        } catch (err) {
            console.error(err);
            setMessage('Ошибка при сохранении.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return (
        <div className="h-screen bg-qal-bg flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="size-12 border-4 border-qal-primary/20 border-t-qal-primary rounded-full animate-spin" />
                <span className="text-qal-text-secondary font-bold uppercase tracking-widest text-xs animate-pulse">Загрузка профиля...</span>
            </div>
        </div>
    );

    const displayUser = profile || user;

    return (
        <Layout activePage="profile">
            <div className="p-12 max-w-5xl mx-auto flex flex-col gap-10 bg-qal-bg relative">
                {/* Decoration */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-qal-primary/5 blur-[120px] pointer-events-none rounded-full" />

                {/* Profile Banner */}
                <div className="flex items-center gap-10 bg-qal-surface border border-qal-border p-10 rounded-[2.5rem] shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                        <span className="material-symbols-outlined text-[160px] text-qal-primary">account_circle</span>
                    </div>

                    <label className="relative cursor-pointer group">
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                    const base64 = reader.result as string;
                                    setProfile({ ...profile, avatar_url: base64 });
                                    const newData = { ...editData, avatar_url: base64 };
                                    setEditData(newData);
                                    fetch('/api/v1/users/me', {
                                        method: 'PUT',
                                        headers: {
                                            'Content-Type': 'application/json',
                                            'Authorization': `Bearer ${token}`
                                        },
                                        body: JSON.stringify({ avatar_url: base64 })
                                    }).then(res => res.json()).then(updated => {
                                        setProfile(updated);
                                        if (user) updateUser({ avatar_url: updated.avatar_url });
                                        setMessage('Фото профиля обновлено!');
                                        setTimeout(() => setMessage(''), 3000);
                                    });
                                };
                                reader.readAsDataURL(file);
                            }
                        }} />
                        <div className="size-32 rounded-[2rem] bg-gradient-to-br from-qal-primary to-qal-primary-light flex items-center justify-center text-white text-4xl font-black border-4 border-qal-bg shadow-lg rotate-3 group-hover:rotate-0 transition-transform duration-500 overflow-hidden relative">
                            {displayUser?.avatar_url ? (
                                <img src={displayUser.avatar_url} alt="Profile" className="size-full object-cover" />
                            ) : (
                                displayUser?.full_name?.charAt(0) || 'U'
                            )}

                            {/* Overlay for upload hint */}
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="material-symbols-outlined text-white text-3xl">photo_camera</span>
                            </div>
                        </div>
                        <div className="absolute -bottom-2 -right-2 size-8 bg-emerald-500 rounded-2xl border-4 border-qal-bg shadow-sm flex items-center justify-center pointer-events-none">
                            <div className="size-2 bg-white rounded-full animate-pulse" />
                        </div>
                    </label>

                    <div className="flex flex-col gap-2 relative z-10">
                        <h2 className="text-4xl font-black text-qal-text-primary tracking-tighter">{displayUser?.full_name}</h2>
                        <div className="flex items-center gap-4">
                            {displayUser?.system_role && displayUser.system_role !== 'user' && (
                                <span className="px-4 py-1 rounded-xl text-[10px] font-black bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 uppercase tracking-[0.2em]">
                                    {displayUser.system_role === 'admin' ? 'Администратор' : 'Модератор'}
                                </span>
                            )}
                            {(!displayUser?.system_role || displayUser.system_role === 'user') && (
                                <span className="px-4 py-1 rounded-xl text-[10px] font-black bg-qal-primary/10 text-qal-primary border border-qal-primary/20 uppercase tracking-[0.2em]">
                                    {displayUser?.role === 'client' ? 'Клиент' : displayUser?.role === 'contractor' ? 'Подрядчик' : 'Поставщик'}
                                </span>
                            )}
                            <span className="h-1 w-1 bg-qal-border rounded-full" />
                            <span className="text-qal-text-secondary text-sm font-bold opacity-60 tabular-nums">{displayUser?.email}</span>
                        </div>
                    </div>

                    <button
                        onClick={() => {
                            logout();
                            navigate('/login');
                        }}
                        className="ml-auto flex items-center gap-3 px-6 py-3 bg-qal-destructive/5 hover:bg-qal-destructive text-qal-destructive hover:text-white border border-qal-destructive/20 rounded-2xl text-xs font-black uppercase tracking-widest transition-all active:scale-95"
                    >
                        <span className="material-symbols-outlined text-[20px]">logout</span>
                        Выйти
                    </button>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Activity Feed */}
                    <div className="md:col-span-1 flex flex-col gap-6">
                        <div className="bg-qal-surface border border-qal-border p-4 md:p-8 rounded-[2rem] flex flex-col gap-6 shadow-sm relative overflow-hidden">
                            <h3 className="text-qal-text-primary font-black text-xs uppercase tracking-[0.2em] flex items-center gap-3">
                                <span className="material-symbols-outlined text-qal-primary">analytics</span>
                                Статистика
                            </h3>
                            <div className="space-y-6">
                                {[
                                    { label: 'Проектов', value: '12', icon: 'work' },
                                    { label: 'Смет создано', value: '8', icon: 'description' },
                                    { label: 'AI Анализов', value: '145', icon: 'psychology' }
                                ].map((stat, i) => (
                                    <div key={i} className="flex justify-between items-center group">
                                        <div className="flex items-center gap-3">
                                            <span className="material-symbols-outlined text-qal-text-secondary text-[18px] group-hover:text-qal-primary transition-colors">{stat.icon}</span>
                                            <span className="text-qal-text-secondary text-[10px] font-extrabold uppercase tracking-widest">{stat.label}</span>
                                        </div>
                                        <span className="text-xl font-black text-qal-text-primary group-hover:scale-110 transition-transform">{stat.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-qal-primary/5 border border-qal-primary/20 p-4 md:p-8 rounded-[2rem] flex flex-col gap-4">
                            <span className="text-[10px] font-black text-qal-primary uppercase tracking-widest">Premium Status</span>
                            <h4 className="text-qal-text-primary font-bold text-lg">AI Power-User</h4>
                            <p className="text-qal-text-secondary text-[11px] leading-relaxed">Вам доступны расширенные модели анализа чертежей и приоритетный доступ к GPT-4o.</p>
                        </div>
                    </div>

                    {/* Settings Panel */}
                    <div className="md:col-span-2 bg-qal-surface border border-qal-border p-10 rounded-[2.5rem] shadow-sm relative">
                        <div className="flex items-center justify-between mb-10 pb-6 border-b border-qal-border">
                            <div>
                                <h3 className="text-qal-text-primary font-black text-xl tracking-tight mb-1">Настройки профиля</h3>
                                <p className="text-qal-text-secondary text-[11px] font-bold uppercase tracking-widest">Персонализация вашего рабочего пространства</p>
                            </div>
                            {message && <span className="text-[11px] font-bold text-emerald-600 animate-in fade-in slide-in-from-right-2 uppercase tracking-widest">{message}</span>}
                        </div>

                        <div className="space-y-10">
                            <div className="flex flex-col gap-3">
                                <label className="text-[10px] font-black text-qal-text-secondary uppercase tracking-[0.2em] px-1">Отображаемое имя</label>
                                <input
                                    type="text"
                                    className="bg-qal-bg/50 border border-qal-border text-qal-text-primary rounded-2xl px-6 py-4 outline-none focus:border-qal-primary/50 focus:ring-4 focus:ring-qal-primary/5 transition-all text-lg font-bold"
                                    value={editData.full_name}
                                    onChange={e => setEditData({ ...editData, full_name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                                <div className="flex flex-col gap-3">
                                    <label className="text-[10px] font-black text-qal-text-secondary uppercase tracking-[0.2em] px-1">Язык интерфейса</label>
                                    <div className="relative">
                                        <select
                                            className="w-full bg-qal-bg/50 border border-qal-border text-qal-text-primary rounded-2xl px-6 py-4 outline-none appearance-none focus:border-qal-primary/50 transition-all font-bold cursor-pointer"
                                            value={editData.interface_lang}
                                            onChange={e => setLanguage(e.target.value as any)}
                                        >
                                            <option value="ru">Русский (RU)</option>
                                            <option value="kk">Қазақша (KK)</option>
                                            <option value="en">English (EN)</option>
                                        </select>
                                        <span className="material-symbols-outlined absolute right-6 top-1/2 -translate-y-1/2 text-qal-text-secondary pointer-events-none">unfold_more</span>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-3">
                                    <label className="text-[10px] font-black text-qal-text-secondary uppercase tracking-[0.2em] px-1">Валюта смет</label>
                                    <div className="relative">
                                        <select
                                            className="w-full bg-qal-bg/50 border border-qal-border text-qal-text-primary rounded-2xl px-6 py-4 outline-none appearance-none focus:border-qal-primary/50 transition-all font-bold cursor-pointer"
                                            value={editData.currency_format}
                                            onChange={e => setEditData({ ...editData, currency_format: e.target.value })}
                                        >
                                            <option value="KZT">Тенге (₸)</option>
                                            <option value="USD">Доллар ($)</option>
                                            <option value="RUB">Рубль (₽)</option>
                                        </select>
                                        <span className="material-symbols-outlined absolute right-6 top-1/2 -translate-y-1/2 text-qal-text-secondary pointer-events-none">unfold_more</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6">
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="w-full py-5 bg-qal-primary hover:bg-qal-primary-dark text-white text-sm font-black uppercase tracking-[0.25em] rounded-2xl shadow-lg shadow-qal-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 group"
                                >
                                    {isSaving ? (
                                        <div className="size-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined group-hover:rotate-12 transition-transform">save</span>
                                            Сохранить изменения
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
