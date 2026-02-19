import { useState, useEffect, useCallback, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import Layout from '../components/Layout'
import { useLanguage } from '../LanguageContext'
import { useAuth } from '../AuthContext'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

interface ContractorItem {
    id: number;
    company_name: string;
    specializations: string[];
    rating: number;
    rating_count: number;
    is_verified: boolean;
    description: string;
    city: string;
    user_email?: string;
    user_name?: string;
}

interface SupplierItem {
    id: number;
    company_name: string;
    rating: number;
    rating_count: number;
    is_verified: boolean;
    city: string;
    user_email?: string;
    user_name?: string;
}

const API = '/api/v1';

export default function ContractorsPage() {
    const { t } = useLanguage()
    const { token } = useAuth()
    const navigate = useNavigate()
    const [contractors, setContractors] = useState<ContractorItem[]>([])
    const [suppliers, setSuppliers] = useState<SupplierItem[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [tab, setTab] = useState<'contractors' | 'suppliers'>('contractors')
    const [filtersOpen, setFiltersOpen] = useState(false)
    const [filterCity, setFilterCity] = useState('')
    const [filterVerifiedOnly, setFilterVerifiedOnly] = useState(false)
    const [filterMinRating, setFilterMinRating] = useState(0)
    const [detailsOpen, setDetailsOpen] = useState(false)
    const [selectedType, setSelectedType] = useState<'contractor' | 'supplier'>('contractor')
    const [selectedItem, setSelectedItem] = useState<ContractorItem | SupplierItem | null>(null)
    const [createRfqOpen, setCreateRfqOpen] = useState(false)
    const [rfqForm, setRfqForm] = useState({ scope: '', budget_range: '', total_cost: '' })

    const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token])

    const loadData = useCallback(() => {
        const params = new URLSearchParams()
        if (filterCity.trim()) params.set('city', filterCity.trim())
        if (filterVerifiedOnly) params.set('verified_only', 'true')
        const contractorsUrl = `${API}/contractors${params.toString() ? `?${params.toString()}` : ''}`

        const supplierParams = new URLSearchParams()
        if (filterCity.trim()) supplierParams.set('city', filterCity.trim())
        const suppliersUrl = `${API}/suppliers${supplierParams.toString() ? `?${supplierParams.toString()}` : ''}`

        setLoading(true)
        Promise.all([
            fetch(contractorsUrl, { headers }).then(r => r.json()),
            fetch(suppliersUrl, { headers }).then(r => r.json()),
        ]).then(([c, s]) => {
            setContractors(c.items || [])
            setSuppliers(s.items || [])
            setLoading(false)
        }).catch(() => setLoading(false))
    }, [filterCity, filterVerifiedOnly, headers])

    useEffect(() => {
        loadData()
    }, [loadData])

    const filtered = tab === 'contractors'
        ? contractors.filter(c => (!search || c.company_name.toLowerCase().includes(search.toLowerCase())) && (!filterMinRating || (c.rating || 0) >= filterMinRating))
        : suppliers.filter(s => (!search || s.company_name.toLowerCase().includes(search.toLowerCase())) && (!filterMinRating || (s.rating || 0) >= filterMinRating))

    const [rfqState, setRfqState] = useState<'idle' | 'generated' | 'compared' | 'awarded'>('idle');
    const [showComparisonModal, setShowComparisonModal] = useState(false);
    const [rfqId, setRfqId] = useState<number | null>(null);
    const [quotes, setQuotes] = useState<any[]>([]);

    const location = useLocation()
    const state = location.state as { autoAction?: string; estimate?: any[]; grandTotal?: number } | null;

    useEffect(() => {
        if (state?.autoAction === 'generate') {
            setTimeout(() => handleRFQAction('generate'), 1000)
        }
    }, [state]);

    const handleRFQAction = async (action: string) => {
        if (!token) {
            toast.error('Нужно войти в систему');
            return;
        }

        if (action === 'generate') {
            const estimateItems = state?.estimate || [];
            const totalCost = state?.grandTotal || 0;

            if (!estimateItems.length || !totalCost) {
                setCreateRfqOpen(true)
                toast.info('Добавьте данные сметы или создайте RFQ вручную')
                return;
            }

            toast.loading('AI Assistant: Generating RFQ based on your estimate...')
            try {
                const res = await fetch(`${API}/rfq`, {
                    method: 'POST',
                    headers: { ...headers, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        estimate_items: estimateItems.map((i: any) => ({
                            item: i.item || i.name || 'Item',
                            quantity: i.quantity || i.qty || 0,
                            unit: i.unit,
                            price: i.price,
                            total: i.total,
                        })),
                        total_cost: totalCost,
                        scope: 'Estimate-based RFQ',
                    })
                });
                if (!res.ok) throw new Error('RFQ generation failed');
                const data = await res.json();
                setRfqId(data.rfq?.id || null);
                setQuotes(data.quotes || []);
                setRfqState('generated');
                toast.success('RFQ успешно сгенерирован и отправлен подрядчикам.');
            } catch (e) {
                toast.error('Не удалось сгенерировать RFQ');
            }
        } else if (action === 'compare') {
            if (!rfqId) {
                toast.error('RFQ ещё не создан');
                return;
            }
            try {
                const res = await fetch(`${API}/rfq/${rfqId}/quotes`, { headers });
                const data = await res.json();
                setQuotes(Array.isArray(data) ? data : []);
                setShowComparisonModal(true);
            } catch {
                toast.error('Не удалось загрузить предложения');
            }
        } else if (action === 'award') {
            const best = quotes[0];
            if (!best?.id) {
                toast.error('Нет выбранного предложения');
                return;
            }
            try {
                const res = await fetch(`${API}/rfq/quotes/${best.id}/award`, {
                    method: 'POST',
                    headers,
                });
                if (!res.ok) throw new Error('Award failed');
                setRfqState('awarded');
                toast.success('Контракт отправлен на подпись подрядчику.');
            } catch {
                toast.error('Не удалось назначить подрядчика');
            }
        }
    };

    const handleOpenDetails = (type: 'contractor' | 'supplier', item: ContractorItem | SupplierItem) => {
        setSelectedType(type)
        setSelectedItem(item)
        setDetailsOpen(true)
    }

    const handleMessage = (item: ContractorItem | SupplierItem) => {
        if (!item.user_email) {
            toast.error('У пользователя нет email для связи')
            return
        }
        window.location.href = `mailto:${item.user_email}`
    }

    const handleCopyEmail = (item: ContractorItem | SupplierItem) => {
        if (!item.user_email) {
            toast.error('Email не найден')
            return
        }
        navigator.clipboard.writeText(item.user_email).then(() => toast.success('Email скопирован'))
    }

    const handleCreateRfqManual = async () => {
        if (!token) {
            toast.error('Нужно войти в систему')
            return
        }
        const payload = {
            scope: rfqForm.scope || 'Manual RFQ',
            budget_range: rfqForm.budget_range || undefined,
            total_cost: rfqForm.total_cost ? Number(rfqForm.total_cost) : undefined,
        }
        try {
            const res = await fetch(`${API}/rfq`, {
                method: 'POST',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            if (!res.ok) throw new Error('RFQ create failed')
            const data = await res.json()
            setRfqId(data.rfq?.id || null)
            setQuotes(data.quotes || [])
            setRfqState('generated')
            setCreateRfqOpen(false)
            toast.success('RFQ создан и отправлен подрядчикам')
            navigate('/requests')
        } catch {
            toast.error('Не удалось создать RFQ')
        }
    }

    const closeComparison = () => {
        setShowComparisonModal(false);
        setRfqState('compared');
    };

    return (
        <Layout activePage="contractors">
            {showComparisonModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-qal-surface w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-qal-border shadow-2xl p-8 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h2 className="text-2xl font-black text-qal-text-primary">Сравнение предложений</h2>
                                <p className="text-sm font-bold text-qal-text-secondary opacity-60 mt-2">Анализ 3 полученных КП</p>
                            </div>
                            <button onClick={closeComparison} className="p-2 hover:bg-qal-bg rounded-full transition-colors">
                                <span className="material-symbols-outlined text-qal-text-secondary">close</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-4 gap-4 border-b border-qal-border pb-4 mb-4">
                            <div className="font-bold text-qal-text-secondary uppercase text-[10px] tracking-widest pt-4">Критерий</div>
                            {quotes.slice(0, 3).map((q) => (
                                <div key={q.id} className="font-black text-qal-text-primary text-center bg-qal-bg/50 p-4 rounded-xl border border-qal-border">
                                    {q.contractor_name || `Contractor #${q.contractor_id}`}
                                </div>
                            ))}
                        </div>

                        {quotes.length > 0 ? (
                            [
                                { label: 'Стоимость', key: 'amount', fmt: (v: number) => `₸${(v / 1000000).toFixed(1)}M` },
                                { label: 'Сроки', key: 'timeline_days', fmt: (v: number) => `${v || 0} дней` },
                            ].map((row, i) => (
                                <div key={i} className="grid grid-cols-4 gap-4 py-4 border-b border-qal-border/50 items-center">
                                    <div className="font-bold text-qal-text-secondary text-xs">{row.label}</div>
                                    {quotes.slice(0, 3).map((q, idx) => (
                                        <div key={idx} className="text-center font-bold text-sm text-qal-text-primary">
                                            {row.fmt(q[row.key])}
                                        </div>
                                    ))}
                                </div>
                            ))
                        ) : (
                            <div className="py-6 text-center text-qal-text-secondary">Нет предложений для сравнения</div>
                        )}

                        <div className="mt-8 flex justify-end">
                            <button onClick={() => { closeComparison(); handleRFQAction('award'); }} className="bg-qal-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-qal-primary-dark transition-all shadow-lg shadow-qal-primary/20">
                                Выбрать победителя
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-qal-bg">
                <div className="max-w-6xl mx-auto flex flex-col gap-8">
                    {/* ... (keep existing header and cards) ... */}
                    {/* Page Header */}
                    <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-4">
                        <div>
                            <h1 className="text-3xl font-black tracking-tight text-qal-text-primary">{t('contractorNetwork')}</h1>
                            <p className="text-qal-text-secondary text-sm mt-1 font-bold opacity-60">{t('contractorSubtitle')}</p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <button
                                className="flex items-center gap-2 h-11 px-6 rounded-2xl bg-qal-surface hover:bg-qal-bg text-qal-text-primary text-xs font-black uppercase tracking-widest border border-qal-border transition-all shadow-sm"
                                onClick={() => setFiltersOpen(true)}
                            >
                                <span className="material-symbols-outlined text-[18px]">filter_list</span>
                                {t('filter')}
                            </button>
                            <button
                                className="flex items-center gap-2 h-11 px-6 rounded-2xl bg-qal-primary hover:bg-qal-primary-dark text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-qal-primary/20 transition-all"
                                onClick={() => setCreateRfqOpen(true)}
                            >
                                <span className="material-symbols-outlined text-[18px]">add</span>
                                {t('inviteContractor')}
                            </button>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { icon: 'engineering', label: t('activeContractors'), value: String(contractors.length), color: 'text-qal-primary' },
                            { icon: 'local_shipping', label: 'Поставщики', value: String(suppliers.length), color: 'text-orange-600' },
                            { icon: 'verified', label: 'Верифицировано', value: String([...contractors, ...suppliers].filter(c => c.is_verified).length), color: 'text-emerald-600' },
                            { icon: 'star', label: 'Средний рейтинг', value: contractors.length ? (contractors.reduce((s, c) => s + c.rating, 0) / contractors.length).toFixed(1) : '—', color: 'text-yellow-600' },
                        ].map((s, i) => (
                            <div key={i} className="bg-qal-surface border border-qal-border rounded-2xl p-6 flex items-center gap-5 hover:border-qal-primary/40 transition-all shadow-sm group">
                                <div className="size-14 rounded-xl bg-qal-bg flex items-center justify-center text-qal-text-secondary group-hover:bg-qal-primary group-hover:text-white transition-all shadow-inner">
                                    <span className={`material-symbols-outlined text-2xl`}>{s.icon}</span>
                                </div>
                                <div className="flex flex-col">
                                    <div className="text-2xl font-black text-qal-text-primary tracking-tight">{s.value}</div>
                                    <div className="text-[10px] text-qal-text-secondary uppercase tracking-widest font-black opacity-60">{s.label}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Table */}
                    <div className="bg-qal-surface border border-qal-border rounded-[2rem] overflow-hidden shadow-sm">
                        <div className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-4 border-b border-qal-border bg-qal-bg/30">
                            {/* Tabs */}
                            <div className="flex gap-1 bg-qal-bg rounded-xl p-1 border border-qal-border">
                                <button
                                    onClick={() => setTab('contractors')}
                                    className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'contractors' ? 'bg-qal-primary text-white shadow-lg shadow-qal-primary/20' : 'text-qal-text-secondary opacity-60 hover:opacity-100'}`}
                                >
                                    🔧 Подрядчики ({contractors.length})
                                </button>
                                <button
                                    onClick={() => setTab('suppliers')}
                                    className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'suppliers' ? 'bg-qal-primary text-white shadow-lg shadow-qal-primary/20' : 'text-qal-text-secondary opacity-60 hover:opacity-100'}`}
                                >
                                    📦 Поставщики ({suppliers.length})
                                </button>
                            </div>
                            <div className="relative">
                                <span className="material-symbols-outlined text-qal-text-secondary absolute left-4 top-1/2 -translate-y-1/2 text-[18px] opacity-40">search</span>
                                <input
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="w-full md:w-80 bg-qal-bg border border-qal-border text-qal-text-primary text-sm pl-11 pr-4 py-2.5 rounded-xl placeholder:text-qal-text-secondary/40 focus:border-qal-primary/50 focus:outline-none transition-all font-bold shadow-inner"
                                    placeholder={t('searchContractors')}
                                />
                            </div>
                        </div>

                        {loading ? (
                            <div className="p-16 text-center text-qal-text-secondary font-bold opacity-60 italic">⏳ Загрузка...</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[720px]">
                                    <thead>
                                        <tr className="border-b border-qal-border bg-qal-bg/10">
                                        <th className="text-[10px] font-black text-qal-text-secondary uppercase tracking-[0.2em] text-left py-4 px-6 opacity-60">Компания</th>
                                        <th className="text-[10px] font-black text-qal-text-secondary uppercase tracking-[0.2em] text-left py-4 px-6 opacity-60">{tab === 'contractors' ? 'Специализации' : 'Город'}</th>
                                        <th className="text-[10px] font-black text-qal-text-secondary uppercase tracking-[0.2em] text-center py-4 px-6 opacity-60">{t('rating')}</th>
                                        <th className="text-[10px] font-black text-qal-text-secondary uppercase tracking-[0.2em] text-center py-4 px-6 opacity-60">{t('status')}</th>
                                        <th className="text-[10px] font-black text-qal-text-secondary uppercase tracking-[0.2em] text-center py-4 px-6 opacity-60">{t('actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((item) => {
                                        const c = item as any;
                                        return (
                                            <tr key={c.id} className="border-b border-qal-border/50 hover:bg-qal-primary/5 transition-colors group">
                                                <td className="py-5 px-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="size-12 rounded-xl bg-gradient-to-br from-qal-bg to-qal-border flex items-center justify-center text-qal-text-primary font-black text-xs shadow-sm">
                                                            {c.company_name?.split(' ').map((w: string) => w[0]).slice(0, 2).join('')}
                                                        </div>
                                                        <div>
                                                            <div className="text-qal-text-primary font-black text-sm group-hover:text-qal-primary transition-colors">{c.company_name}</div>
                                                            {c.is_verified && (
                                                                <span className="inline-flex items-center text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-black uppercase tracking-widest mt-1">✓ Verified</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-5 px-6 text-[11px] text-qal-text-secondary font-bold opacity-80">
                                                    {c.specializations
                                                        ? c.specializations.join(', ')
                                                        : c.city || '—'
                                                    }
                                                </td>
                                                <td className="py-5 px-6 text-center">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        <span className="material-symbols-outlined text-yellow-500 text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                                        <span className="text-qal-text-primary text-sm font-black">{c.rating?.toFixed(1) || '—'}</span>
                                                        <span className="text-qal-text-secondary text-[10px] font-black opacity-40">({c.rating_count})</span>
                                                    </div>
                                                </td>
                                                <td className="py-5 px-6 text-center">
                                                    <span className={`inline-flex items-center text-[10px] px-3 py-1 rounded-full border font-black uppercase tracking-widest ${c.is_verified ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20'}`}>
                                                        {c.is_verified ? 'Верифицирован' : 'На проверке'}
                                                    </span>
                                                </td>
                                                <td className="py-5 px-6 text-center">
                                                    <div className="flex justify-center gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            className="size-9 rounded-lg hover:bg-white text-qal-text-secondary hover:text-qal-text-primary transition-all border border-transparent hover:border-qal-border shadow-sm flex items-center justify-center"
                                                            onClick={() => handleOpenDetails(tab === 'contractors' ? 'contractor' : 'supplier', c as any)}
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                                                        </button>
                                                        <button
                                                            className="size-9 rounded-lg hover:bg-white text-qal-text-secondary hover:text-qal-primary transition-all border border-transparent hover:border-qal-border shadow-sm flex items-center justify-center"
                                                            onClick={() => handleMessage(c as any)}
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">chat</span>
                                                        </button>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <button className="size-9 rounded-lg hover:bg-white text-qal-text-secondary hover:text-qal-text-primary transition-all border border-transparent hover:border-qal-border shadow-sm flex items-center justify-center">
                                                                    <span className="material-symbols-outlined text-[18px]">more_vert</span>
                                                                </button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem onClick={() => handleOpenDetails(tab === 'contractors' ? 'contractor' : 'supplier', c as any)}>
                                                                    Открыть профиль
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => handleCopyEmail(c as any)}>
                                                                    Скопировать email
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => setCreateRfqOpen(true)}>
                                                                    Создать RFQ
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filtered.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="py-20 text-center text-qal-text-secondary font-bold opacity-60 italic">
                                                {search ? 'Ничего не найдено' : `Нет ${tab === 'contractors' ? 'подрядчиков' : 'поставщиков'}`}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                                </table>
                            </div>
                        )}

                        <div className="flex items-center justify-between p-6 border-t border-qal-border text-[10px] font-black uppercase tracking-widest text-qal-text-secondary opacity-40">
                            <span>Найдено: {filtered.length} {tab === 'contractors' ? 'подрядчиков' : 'поставщиков'}</span>
                        </div>
                    </div>

                    {/* Quick Action Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            {
                                icon: 'description',
                                title: t('generateRFQ'),
                                desc: 'AI-генерация запроса на коммерческое предложение по вашей BOQ.',
                                action: 'Создать',
                                key: 'generate',
                                disabled: rfqState !== 'idle'
                            },
                            {
                                icon: 'compare_arrows',
                                title: t('compareQuotes'),
                                desc: 'Сравнение предложений подрядчиков по вашему проекту.',
                                action: 'Сравнить',
                                key: 'compare',
                                disabled: rfqState === 'idle'
                            },
                            {
                                icon: 'gavel',
                                title: t('awardContract'),
                                desc: 'Финализация и отправка уведомления выбранному подрядчику.',
                                action: 'Назначить',
                                key: 'award',
                                disabled: rfqState !== 'compared'
                            },
                        ].map((a, i) => (
                            <button
                                key={i}
                                onClick={() => !a.disabled && handleRFQAction(a.key)}
                                className={`bg-qal-surface border border-qal-border rounded-[2rem] p-8 text-left transition-all group shadow-sm ${a.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-qal-primary/40 hover:bg-qal-primary/5'}`}
                            >
                                <span className={`material-symbols-outlined text-3xl mb-6 block transition-transform ${a.disabled ? 'text-gray-400' : 'text-qal-primary group-hover:scale-110'}`}>{a.icon}</span>
                                <h4 className={`text-lg font-black mb-2 transition-colors tracking-tight ${a.disabled ? 'text-gray-400' : 'text-qal-text-primary group-hover:text-qal-primary'}`}>{a.title}</h4>
                                <p className="text-qal-text-secondary text-xs font-bold opacity-60 mb-6 leading-relaxed">{a.desc}</p>
                                <span className={`text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 transition-all ${a.disabled ? 'text-gray-400' : 'text-qal-primary group-hover:gap-3'}`}>
                                    {a.action} <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Filters Dialog */}
                    <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Фильтры подрядчиков</DialogTitle>
                                <DialogDescription>Фильтруйте сеть по городу, рейтингу и статусу верификации.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="filter-city">Город</Label>
                                    <Input
                                        id="filter-city"
                                        placeholder="Например, Алматы"
                                        value={filterCity}
                                        onChange={(e) => setFilterCity(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="filter-rating">Минимальный рейтинг</Label>
                                    <Input
                                        id="filter-rating"
                                        type="number"
                                        min={0}
                                        max={5}
                                        step="0.1"
                                        value={filterMinRating}
                                        onChange={(e) => setFilterMinRating(Number(e.target.value) || 0)}
                                    />
                                </div>
                                <div className="flex items-center justify-between rounded-lg border p-3">
                                    <div>
                                        <div className="font-semibold text-sm">Только верифицированные</div>
                                        <div className="text-xs text-muted-foreground">Показывать только проверенных исполнителей</div>
                                    </div>
                                    <Switch checked={filterVerifiedOnly} onCheckedChange={setFilterVerifiedOnly} />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => {
                                    setFilterCity('')
                                    setFilterVerifiedOnly(false)
                                    setFilterMinRating(0)
                                    setFiltersOpen(false)
                                }}>
                                    Сбросить
                                </Button>
                                <Button onClick={() => { setFiltersOpen(false); loadData() }}>
                                    Применить
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Details Dialog */}
                    <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{selectedType === 'contractor' ? 'Профиль подрядчика' : 'Профиль поставщика'}</DialogTitle>
                                <DialogDescription>Контактные данные и краткая информация.</DialogDescription>
                            </DialogHeader>
                            {selectedItem ? (
                                <div className="space-y-3 text-sm">
                                    <div><span className="text-muted-foreground">Компания:</span> <span className="font-semibold">{selectedItem.company_name}</span></div>
                                    <div><span className="text-muted-foreground">Город:</span> {selectedItem.city || '—'}</div>
                                    <div><span className="text-muted-foreground">Рейтинг:</span> {(selectedItem.rating || 0).toFixed(1)} ({selectedItem.rating_count || 0})</div>
                                    <div><span className="text-muted-foreground">Статус:</span> {selectedItem.is_verified ? 'Верифицирован' : 'На проверке'}</div>
                                    {"description" in selectedItem && (
                                        <div><span className="text-muted-foreground">Описание:</span> {selectedItem.description || '—'}</div>
                                    )}
                                    <div><span className="text-muted-foreground">Email:</span> {selectedItem.user_email || '—'}</div>
                                </div>
                            ) : (
                                <div className="text-sm text-muted-foreground">Нет данных</div>
                            )}
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setDetailsOpen(false)}>Закрыть</Button>
                                {selectedItem?.user_email && (
                                    <Button onClick={() => handleMessage(selectedItem)}>Написать</Button>
                                )}
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Create RFQ Dialog */}
                    <Dialog open={createRfqOpen} onOpenChange={setCreateRfqOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Создать RFQ</DialogTitle>
                                <DialogDescription>Заполните краткое описание и бюджет. Можно без сметы.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="rfq-scope">Описание работ</Label>
                                    <Input
                                        id="rfq-scope"
                                        placeholder="Например, ремонт 2-комн. квартиры"
                                        value={rfqForm.scope}
                                        onChange={(e) => setRfqForm(f => ({ ...f, scope: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="rfq-budget">Бюджет (диапазон)</Label>
                                    <Input
                                        id="rfq-budget"
                                        placeholder="Например, 3-5 млн KZT"
                                        value={rfqForm.budget_range}
                                        onChange={(e) => setRfqForm(f => ({ ...f, budget_range: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="rfq-total">Итоговая сумма (опционально)</Label>
                                    <Input
                                        id="rfq-total"
                                        type="number"
                                        min={0}
                                        placeholder="0"
                                        value={rfqForm.total_cost}
                                        onChange={(e) => setRfqForm(f => ({ ...f, total_cost: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setCreateRfqOpen(false)}>Отмена</Button>
                                <Button onClick={handleCreateRfqManual}>Создать</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        </Layout>
    )
}
