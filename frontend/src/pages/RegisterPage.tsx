import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function RegisterPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [role, setRole] = useState<'client' | 'contractor' | 'supplier-materials'>('client');
    const [companyName, setCompanyName] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const res = await fetch('/api/v1/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    password,
                    full_name: fullName,
                    role,
                    company_name: companyName || null
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || 'Ошибка регистрации');
            }

            const data = await res.json();
            login(data.access_token, data.user);
            navigate('/');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-qal-bg p-6 relative overflow-hidden">
            {/* Decoration */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-qal-primary/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-qal-primary/5 blur-[100px] rounded-full pointer-events-none" />

            <div className="max-w-2xl w-full animate-in fade-in zoom-in-95 duration-700">
                {/* Logo Area */}
                <div className="flex flex-col items-center mb-10">
                    <div className="size-16 rounded-2xl bg-gradient-to-br from-qal-primary to-qal-primary-light shadow-lg shadow-qal-primary/20 flex items-center justify-center text-white mb-4 rotate-[6deg]">
                        <span className="material-symbols-outlined text-3xl">add_moderator</span>
                    </div>
                    <h1 className="text-2xl font-black text-qal-text-primary tracking-widest uppercase">Qal.<span className="text-qal-primary">ai</span></h1>
                    <p className="text-qal-text-secondary text-[10px] font-black uppercase tracking-[0.4em] mt-2 text-center opacity-60">AI platform for real estate and construction decisions</p>
                </div>

                <div className="bg-qal-surface border border-qal-border rounded-[3rem] p-12 shadow-sm relative overflow-hidden backdrop-blur-xl">
                    <div className="mb-10 text-center">
                        <h2 className="text-3xl font-black text-qal-text-primary tracking-tight mb-2">Создать аккаунт</h2>
                        <p className="text-qal-text-secondary text-sm font-bold opacity-60 italic">Начните работу с AI-брокером и модулями за 1 минуту</p>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-600 p-5 rounded-2xl mb-8 text-xs font-bold animate-in shake duration-500">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-8">
                        <div className="col-span-2">
                            <label className="block text-[10px] font-black text-qal-text-secondary uppercase tracking-[0.2em] mb-3 px-2 opacity-60">Ваша роль в системе</label>
                            <div className="grid grid-cols-3 gap-3 p-2 bg-qal-bg rounded-2xl border border-qal-border shadow-inner">
                                {[
                                    { id: 'client', label: 'Клиент', icon: 'person' },
                                    { id: 'contractor', label: 'Подрядчик', icon: 'engineering' },
                                    { id: 'supplier-materials', label: 'Поставщик', icon: 'inventory_2' }
                                ].map(r => (
                                    <button
                                        key={r.id}
                                        type="button"
                                        onClick={() => setRole(r.id as any)}
                                        className={`flex flex-col items-center gap-2 py-4 px-2 rounded-xl transition-all ${role === r.id ? 'bg-qal-primary text-white shadow-lg scale-[1.02]' : 'text-qal-text-secondary opacity-60 hover:opacity-100 hover:bg-qal-primary/5'}`}
                                    >
                                        <span className="material-symbols-outlined text-xl">{r.icon}</span>
                                        <span className="text-[10px] font-black uppercase tracking-wider">{r.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="col-span-2 space-y-2">
                            <label className="block text-[10px] font-black text-qal-text-secondary uppercase tracking-[0.2em] px-2 opacity-60">Полное имя (ФИО)</label>
                            <input
                                required
                                className="w-full bg-qal-bg border border-qal-border rounded-2xl px-6 py-4 text-qal-text-primary focus:outline-none focus:border-qal-primary/50 transition-all text-sm font-bold shadow-inner"
                                placeholder="Константин Константинопольский"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                            />
                        </div>

                        <div className="col-span-1 space-y-2">
                            <label className="block text-[10px] font-black text-qal-text-secondary uppercase tracking-[0.2em] px-2 opacity-60">Email Адрес</label>
                            <input
                                type="email"
                                required
                                className="w-full bg-qal-bg border border-qal-border rounded-2xl px-6 py-4 text-qal-text-primary focus:outline-none focus:border-qal-primary/50 transition-all text-sm font-bold shadow-inner"
                                placeholder="mail@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div className="col-span-1 space-y-2">
                            <label className="block text-[10px] font-black text-qal-text-secondary uppercase tracking-[0.2em] px-2 opacity-60">Пароль доступа</label>
                            <input
                                type="password"
                                required
                                className="w-full bg-qal-bg border border-qal-border rounded-2xl px-6 py-4 text-qal-text-primary focus:outline-none focus:border-qal-primary/50 transition-all text-sm font-bold shadow-inner"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        {role !== 'client' && (
                            <div className="col-span-2 space-y-2 animate-in slide-in-from-top-2 duration-300">
                                <label className="block text-[10px] font-black text-qal-text-secondary uppercase tracking-[0.2em] px-2 opacity-60">Организация / Компания</label>
                                <div className="relative group">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-qal-text-secondary opacity-40 group-focus-within:text-qal-primary transition-all">domain</span>
                                    <input
                                        required
                                        className="w-full bg-qal-bg border border-qal-border rounded-2xl pl-12 pr-6 py-4 text-qal-text-primary focus:outline-none focus:border-qal-primary/50 transition-all text-sm font-bold shadow-inner"
                                        placeholder="ТОО 'KazBuild Group'"
                                        value={companyName}
                                        onChange={(e) => setCompanyName(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="col-span-2 pt-6">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-qal-primary hover:bg-qal-primary-dark text-white font-black py-5 rounded-2xl shadow-lg shadow-qal-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 group"
                            >
                                {isLoading ? (
                                    <div className="size-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <span>Завершить регистрацию</span>
                                        <span className="material-symbols-outlined group-hover:rotate-12 transition-transform">how_to_reg</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="mt-12 text-center text-qal-text-secondary text-xs font-bold opacity-60">
                        Уже есть профессиональный аккаунт? <Link to="/login" className="text-qal-primary hover:text-qal-primary-dark font-black ml-1 transition-colors underline-offset-4 hover:underline">Войти</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
