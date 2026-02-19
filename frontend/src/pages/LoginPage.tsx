import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'client' | 'contractor' | 'supplier-materials'>('client');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login, logout } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('username', email);
            formData.append('password', password);

            const res = await fetch('/api/v1/auth/login', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || 'Неверные данные');
            }

            const data = await res.json();
            login(data.access_token, data.user);
            if (data.user?.role && data.user.role !== role) {
                logout();
                throw new Error(`Ваша роль в системе: ${data.user.role}. Вы выбрали: ${role}.`);
            }
            if (data.user?.role === 'contractor') navigate('/contractor');
            else if (data.user?.role === 'supplier-materials') navigate('/supplier');
            else navigate('/');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-qal-bg p-6 relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-qal-primary/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-qal-primary/5 blur-[100px] rounded-full pointer-events-none" />

            <div className="max-w-md w-full animate-in fade-in zoom-in-95 duration-700">
                {/* Logo Area */}
                <div className="flex flex-col items-center mb-10">
                    <div className="size-16 rounded-2xl bg-gradient-to-br from-qal-primary to-qal-primary-light shadow-lg shadow-qal-primary/20 flex items-center justify-center text-white mb-4 rotate-[-6deg]">
                        <span className="material-symbols-outlined text-4xl">token</span>
                    </div>
                    <h1 className="text-2xl font-black text-qal-text-primary tracking-widest uppercase">Qal.<span className="text-qal-primary">ai</span></h1>
                    <p className="text-qal-text-secondary text-[10px] font-black uppercase tracking-[0.4em] mt-2 text-center opacity-60">AI platform for real estate and construction decisions</p>
                </div>

                <div className="bg-qal-surface border border-qal-border rounded-[2.5rem] p-12 shadow-sm relative overflow-hidden backdrop-blur-xl">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none text-qal-primary">
                        <span className="material-symbols-outlined text-[120px]">security</span>
                    </div>

                    <div className="mb-10 text-center">
                        <h2 className="text-3xl font-black text-qal-text-primary tracking-tight mb-2">Авторизация</h2>
                        <p className="text-qal-text-secondary text-sm font-bold opacity-60">Безопасный доступ к вашей экосистеме</p>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-600 p-4 rounded-2xl mb-8 text-xs font-bold flex items-center gap-3 animate-in shake duration-500">
                            <span className="material-symbols-outlined text-sm">warning</span>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-qal-text-secondary uppercase tracking-[0.2em] px-2 opacity-60">Ваша роль</label>
                            <div className="grid grid-cols-3 gap-2 p-2 bg-qal-bg rounded-2xl border border-qal-border shadow-inner">
                                {[
                                    { id: 'client', label: 'Клиент', icon: 'person' },
                                    { id: 'contractor', label: 'Подрядчик', icon: 'engineering' },
                                    { id: 'supplier-materials', label: 'Поставщик', icon: 'inventory_2' }
                                ].map(r => (
                                    <button
                                        key={r.id}
                                        type="button"
                                        onClick={() => setRole(r.id as any)}
                                        className={`flex flex-col items-center gap-2 py-3 px-2 rounded-xl transition-all ${role === r.id ? 'bg-qal-primary text-white shadow-lg scale-[1.02]' : 'text-qal-text-secondary opacity-60 hover:opacity-100 hover:bg-qal-primary/5'}`}
                                    >
                                        <span className="material-symbols-outlined text-lg">{r.icon}</span>
                                        <span className="text-[9px] font-black uppercase tracking-wider">{r.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-qal-text-secondary uppercase tracking-[0.2em] px-2 opacity-60">Email</label>
                            <div className="relative group">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-qal-text-secondary opacity-40 group-focus-within:opacity-100 group-focus-within:text-qal-primary transition-all">mail</span>
                                <input
                                    type="email"
                                    required
                                    className="w-full bg-qal-bg border border-qal-border rounded-2xl pl-12 pr-6 py-4 text-qal-text-primary focus:outline-none focus:border-qal-primary/50 transition-all text-sm font-bold shadow-inner"
                                    placeholder="your@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-end px-2">
                                <label className="block text-[10px] font-black text-qal-text-secondary uppercase tracking-[0.2em] opacity-60">Пароль</label>
                                <a href="#" className="text-[10px] font-bold text-qal-primary/60 hover:text-qal-primary transition-colors">Забыли?</a>
                            </div>
                            <div className="relative group">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-qal-text-secondary opacity-40 group-focus-within:opacity-100 group-focus-within:text-qal-primary transition-all">lock</span>
                                <input
                                    type="password"
                                    required
                                    className="w-full bg-qal-bg border border-qal-border rounded-2xl pl-12 pr-6 py-4 text-qal-text-primary focus:outline-none focus:border-qal-primary/50 transition-all text-sm font-bold shadow-inner"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-qal-primary hover:bg-qal-primary-dark text-white font-black py-5 rounded-2xl shadow-lg shadow-qal-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 group"
                        >
                            {isLoading ? (
                                <div className="size-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>Войти в систему</span>
                                    <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-12 pt-8 border-t border-qal-border text-center">
                        <p className="text-qal-text-secondary text-xs font-bold opacity-60">
                            Новый пользователь? <Link to="/register" className="text-qal-primary hover:text-qal-primary-dark font-black ml-1 transition-colors underline-offset-4 hover:underline">Создать учетную запись</Link>
                        </p>
                    </div>
                </div>

                <div className="mt-10 flex items-center justify-center gap-6 opacity-30 grayscale hover:grayscale-0 transition-all pointer-events-none">
                    <span className="text-[10px] font-black text-qal-text-secondary uppercase tracking-widest flex items-center gap-1.5"><span className="material-symbols-outlined text-sm">shield</span> SSL Encrypted</span>
                    <div className="size-1 bg-qal-border rounded-full" />
                    <span className="text-[10px] font-black text-qal-text-secondary uppercase tracking-widest flex items-center gap-1.5"><span className="material-symbols-outlined text-sm">verified_user</span> ISO 27001</span>
                </div>
            </div>
        </div>
    );
}
