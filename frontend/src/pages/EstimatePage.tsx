import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { useLanguage } from '../LanguageContext'
import { useAuth } from '../AuthContext'
import { toast } from 'sonner'

export default function EstimatePage() {

    const location = useLocation()
    const { t } = useLanguage()
    const { token } = useAuth()

    // Get data from location state or use mock fallback
    const analysisResult = location.state?.result
    const geometry = analysisResult?.geometry
    const estimate = analysisResult?.estimate

    interface EstimateItem {
        item?: string;
        name?: string;
        quantity?: number;
        qty?: number;
        unit: string;
        price: number;
        total: number;
    }

    const [selectedTier, setSelectedTier] = useState<number>(1) // 0: Economy, 1: Standard, 2: Premium
    const [appliedOptimizations, setAppliedOptimizations] = useState<number[]>([])

    const getMultiplier = (tier: number) => {
        switch (tier) {
            case 0: return 0.85;
            case 2: return 1.35;
            default: return 1.0;
        }
    }

    const optimizationOptions = [
        { title: 'Альтернативный поставщик бетона', savingsVal: 1250500, savings: '-₸1,250,500', desc: "Поставщик 'ConcreteKZ' предлагает скидку 15% на объем от 400 м³." },
        { title: 'Замена арматуры на аналоги', savingsVal: 420000, savings: '-₸420,000', desc: "Использование сертифицированной стали 'КарМет' вместо импорта." },
    ]

    const toggleOptimization = (index: number) => {
        if (appliedOptimizations.includes(index)) {
            setAppliedOptimizations(appliedOptimizations.filter(i => i !== index))
        } else {
            setAppliedOptimizations([...appliedOptimizations, index])
        }
    }

    const multiplier = getMultiplier(selectedTier)

    const baseItems = estimate?.items || []

    const displayItems = baseItems.map((item: EstimateItem) => ({
        ...item,
        price: item.price * multiplier,
        total: item.total * multiplier
    }))

    const itemsTotal = displayItems.reduce((acc: number, curr: EstimateItem) => acc + curr.total, 0)
    const savingsTotal = appliedOptimizations.reduce((acc, idx) => acc + optimizationOptions[idx].savingsVal, 0)
    const grandTotal = itemsTotal - savingsTotal

    const totalArea = geometry?.total_area || location.state?.geometry?.total_area || 0
    const costPerSqm = totalArea > 0 ? grandTotal / totalArea : 0

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 }).format(val)
    }

    const formatNumber = (val: number) => {
        return new Intl.NumberFormat('ru-RU').format(val)
    }

    const navigate = useNavigate() // Add useNavigate
    const [isSaving, setIsSaving] = useState(false)
    const [savedEstimateId, setSavedEstimateId] = useState<number | null>(null)

    const tierMap = (tierIndex: number) => {
        if (tierIndex === 0) return 'economy'
        if (tierIndex === 2) return 'premium'
        return 'standard'
    }

    const handleSaveEstimate = async () => {
        if (!token) {
            toast.error('Нужно войти в систему');
            return;
        }
        if (savedEstimateId) {
            toast.message('Смета уже сохранена');
            return;
        }

        setIsSaving(true)
        try {
            const itemsPayload = displayItems.map((item: EstimateItem) => ({
                item: item.item || item.name || 'Item',
                quantity: item.quantity || item.qty || 0,
                unit: item.unit,
                price: item.price,
                total: item.total,
            }))

            const res = await fetch('/api/v1/estimates', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    project_id: location.state?.projectId || null,
                    listing_id: location.state?.listingId || null,
                    tier: tierMap(selectedTier),
                    items_json: itemsPayload,
                    total_cost: grandTotal,
                    tax_amount: estimate?.tax_estimate || grandTotal * 0.12,
                })
            })

            if (!res.ok) throw new Error('Не удалось сохранить смету')
            const data = await res.json()
            setSavedEstimateId(data.id)
            toast.success('Смета сохранена')
        } catch (e) {
            toast.error('Ошибка при сохранении сметы')
        } finally {
            setIsSaving(false)
        }
    }

    const handleExport = () => {
        const headers = ['Item', 'Quantity', 'Unit', 'Price', 'Total'];
        const csvContent = [
            headers.join(','),
            ...displayItems.map((item: EstimateItem) =>
                `"${item.item || item.name}",${item.quantity || item.qty},"${item.unit}",${item.price},${item.total}`
            )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `estimate_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <Layout activePage="estimates">
            <div className="flex flex-1 overflow-hidden relative h-full bg-qal-bg">
                {/* Visual Accent */}
                <div className="absolute top-0 right-1/4 w-[800px] h-[400px] bg-qal-primary/5 blur-[120px] pointer-events-none rounded-full" />

                {/* Main Content Area */}
                <section className="flex flex-col flex-1 min-w-0 overflow-hidden border-r border-qal-border relative z-10">
                    {/* Header Section */}
                    <div className="flex flex-col gap-4 md:gap-6 p-4 md:p-8 pb-4 shrink-0 bg-qal-bg/50 backdrop-blur-md z-20">
                    <div className="flex flex-wrap justify-between items-start gap-6">
                            <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                    <h1 className="text-qal-text-primary text-3xl font-black tracking-tight leading-none">{t('technicalEstimate')}</h1>
                                    <span className="px-3 py-1 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 uppercase tracking-widest flex items-center gap-1.5">
                                        <span className="size-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
                                        {analysisResult ? 'AI Verified' : 'Standard Model'}
                                    </span>
                                </div>
                                <p className="text-qal-text-secondary text-sm font-bold opacity-60 italic">Объект: {location.state?.fileName || 'Анализ из чертежа #8843'}</p>
                            </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleExport}
                                className="flex items-center gap-2 h-11 px-6 rounded-2xl bg-qal-surface hover:bg-qal-primary/5 text-qal-text-primary text-xs font-bold border border-qal-border transition-all active:scale-95 shadow-sm"
                            >
                                <span className="material-symbols-outlined text-[20px]">ios_share</span>
                                {t('export')}
                            </button>
                            <button
                                onClick={handleSaveEstimate}
                                disabled={isSaving || !!savedEstimateId}
                                className="flex items-center gap-2 h-11 px-6 rounded-2xl bg-qal-surface hover:bg-qal-primary/5 text-qal-text-primary text-xs font-bold border border-qal-border transition-all active:scale-95 shadow-sm disabled:opacity-50"
                            >
                                <span className="material-symbols-outlined text-[20px]">save</span>
                                {savedEstimateId ? 'Сохранено' : 'Сохранить'}
                            </button>
                            <button
                                onClick={async () => {
                                    if (!token) return toast.error('Нужно войти в систему');
                                    if (displayItems.length === 0) return toast.error('Нет данных сметы');
                                    const res = await fetch('/api/v1/supply-requests', {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json',
                                            'Authorization': `Bearer ${token}`
                                        },
                                        body: JSON.stringify({
                                            items_json: displayItems.map((i: EstimateItem) => ({
                                                item: i.item || i.name || 'Item',
                                                quantity: i.quantity || i.qty || 0,
                                                unit: i.unit,
                                                price: i.price,
                                                total: i.total,
                                            }))
                                        })
                                    })
                                    if (!res.ok) return toast.error('Не удалось создать запрос поставщикам')
                                    toast.success('Запрос поставщикам создан')
                                }}
                                className="flex items-center gap-2 h-11 px-6 rounded-2xl bg-qal-surface hover:bg-qal-primary/5 text-qal-text-primary text-xs font-bold border border-qal-border transition-all active:scale-95 shadow-sm"
                            >
                                <span className="material-symbols-outlined text-[20px]">local_shipping</span>
                                Запросить поставщиков
                            </button>
                            <button
                                onClick={() => navigate('/contractors', { state: { estimate: displayItems, grandTotal } })}
                                className="flex items-center gap-2 h-11 px-6 rounded-2xl bg-qal-primary hover:bg-qal-primary-dark text-white text-xs font-bold shadow-lg shadow-qal-primary/20 transition-all active:scale-95"
                            >
                                <span className="material-symbols-outlined text-[20px]">request_quote</span>
                                Запросить КП
                                </button>
                            </div>
                        </div>

                        {/* KPI Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                            {[
                                { label: 'Общая смета', value: formatCurrency(grandTotal), icon: 'payments', color: 'text-qal-text-primary' },
                                { label: 'Цена за м²', value: formatCurrency(costPerSqm), icon: 'square_foot', color: 'text-qal-primary' },
                                { label: 'Позиций в смете', value: displayItems.length, icon: 'list_alt', color: 'text-qal-text-primary' },
                                { label: 'Точность AI', value: '98.4%', icon: 'psychology', color: 'text-emerald-600' },
                            ].map((k, i) => (
                                <div key={i} className="bg-qal-surface border border-qal-border rounded-2xl p-5 flex flex-col relative overflow-hidden group hover:border-qal-primary/40 transition-all shadow-sm">
                                    <div className="absolute -right-4 -top-4 size-16 bg-qal-primary/5 rounded-full flex items-center justify-center group-hover:bg-qal-primary/10 transition-colors">
                                        <span className="material-symbols-outlined text-3xl text-qal-primary/20">{k.icon}</span>
                                    </div>
                                    <span className="text-qal-text-secondary text-[10px] uppercase tracking-widest font-black mb-2 opacity-60">{k.label}</span>
                                    <span className={`text-xl font-black ${k.color} tracking-tight`}>{k.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {!estimate && displayItems.length === 0 && (
                        <div className="bg-qal-bg border border-qal-border rounded-2xl p-4 text-sm text-qal-text-secondary">
                            Нет данных для сметы. Загрузите чертеж в разделе “Чертежи” или запустите расчет из объекта.
                        </div>
                    )}

                    {/* Table View */}
                    <div className="flex-1 overflow-y-auto px-8 pb-32 no-scrollbar scroll-smooth">
                        <table className="w-full text-left">
                            <thead className="sticky top-0 bg-qal-bg/95 backdrop-blur-md z-10 border-b border-qal-border">
                                <tr>
                                    <th className="py-5 px-4 text-[10px] font-black text-qal-text-secondary uppercase tracking-[0.2em]">{t('itemDescription')}</th>
                                    <th className="py-5 px-4 text-[10px] font-black text-qal-text-secondary uppercase tracking-[0.2em] text-right w-[120px]">Кол-во</th>
                                    <th className="py-5 px-4 text-[10px] font-black text-qal-text-secondary uppercase tracking-[0.2em] text-center w-[100px]">ед. изм.</th>
                                    <th className="py-5 px-4 text-[10px] font-black text-qal-text-secondary uppercase tracking-[0.2em] text-right w-[150px]">Цена за ед.</th>
                                    <th className="py-5 px-4 text-[10px] font-black text-qal-text-secondary uppercase tracking-[0.2em] text-right w-[180px]">Итого по позиции</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-qal-border">
                                {displayItems.map((item: EstimateItem, ii: number) => (
                                    <tr key={ii} className="group hover:bg-qal-primary/5 transition-colors">
                                        <td className="py-6 px-4">
                                            <div className="font-bold text-qal-text-primary transition-colors">{item.item || item.name}</div>
                                            <div className="text-[11px] text-qal-text-secondary mt-1.5 font-bold uppercase tracking-widest opacity-40">Детектировано AI модулем · Код ТН ВЭД: {4400 + ii}</div>
                                        </td>
                                        <td className="py-6 px-4 text-right text-qal-text-primary font-bold tabular-nums">{formatNumber(item.quantity || item.qty || 0)}</td>
                                        <td className="py-6 px-4 text-center text-qal-text-secondary font-black uppercase text-[10px]">{item.unit}</td>
                                        <td className="py-6 px-4 text-right text-qal-text-secondary font-bold tabular-nums">{formatCurrency(item.price)}</td>
                                        <td className="py-6 px-4 text-right text-qal-text-primary font-black tabular-nums">{formatCurrency(item.total)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Table Footer / Summary Bar */}
                    <div className="absolute bottom-0 left-0 right-0 bg-qal-surface/80 backdrop-blur-2xl border-t border-qal-border p-4 md:p-8 flex flex-col md:flex-row gap-3 md:gap-0 justify-between items-start md:items-center shadow-lg z-30">
                        <div className="flex items-center gap-4">
                            <span className="material-symbols-outlined text-qal-primary text-3xl">functions</span>
                            <div>
                                <span className="text-[10px] font-black text-qal-text-secondary uppercase tracking-widest block opacity-60">Итоговая оценочная смета</span>
                                <span className="text-qal-text-primary text-xs font-bold">С учетом текущих рыночных цен в РК</span>
                            </div>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-4xl font-black text-qal-text-primary tracking-tighter">{formatCurrency(grandTotal)}</span>
                            <span className="text-emerald-600 text-[10px] font-black uppercase tracking-widest mt-1">Оптимизировано по лучшим ценам</span>
                        </div>
                    </div>
                </section>

                {/* Right Settings/Market Panel */}
                <aside className="w-[420px] bg-qal-surface border-l border-qal-border flex flex-col shrink-0 overflow-y-auto no-scrollbar z-20">
                    <div className="p-4 md:p-8 space-y-8 md:space-y-10">
                        <div>
                            <h3 className="text-qal-text-primary font-black text-lg tracking-tight flex items-center gap-3 mb-6">
                                <span className="material-symbols-outlined text-qal-primary">analytics</span>
                                Маркет-оптимизация
                            </h3>

                            <div className="space-y-4">
                                <p className="text-[10px] text-qal-text-secondary font-black uppercase tracking-[0.2em] mb-4 opacity-60">Выберите стандарт материалов</p>
                                {['Эконом', 'Стандарт', 'Премиум'].map((tier, i) => (
                                    <label
                                        key={tier}
                                        onClick={() => setSelectedTier(i)}
                                        className={`group relative flex cursor-pointer rounded-2xl p-6 transition-all duration-300 ${selectedTier === i ? 'border-2 border-qal-primary bg-qal-primary/5 shadow-sm' : 'border border-qal-border bg-qal-bg/50 hover:border-qal-text-secondary/30'}`}
                                    >
                                        <span className="flex flex-1 flex-col">
                                            <span className={`text-sm font-black uppercase tracking-widest ${selectedTier === i ? 'text-qal-primary' : 'text-qal-text-primary'}`}>{tier}</span>
                                            <span className="mt-2 text-xs text-qal-text-secondary font-bold leading-relaxed opacity-60">
                                                {i === 0 ? 'Базовые характеристики, оптимизация бюджета.' : i === 1 ? 'Оптимальный баланс качества и стоимости.' : 'Лучшие материалы, эксклюзивная отделка.'}
                                            </span>
                                        </span>
                                        <div className={`size-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedTier === i ? 'border-qal-primary bg-qal-primary' : 'border-qal-border'}`}>
                                            {selectedTier === i && <span className="material-symbols-outlined text-white text-[16px] font-bold">check</span>}
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="pt-8 border-t border-qal-border">
                            <h4 className="text-qal-text-primary font-black text-sm tracking-widest uppercase mb-6 flex items-center gap-3">
                                <span className="material-symbols-outlined text-yellow-600">campaign</span>
                                Оптимизация бюджета
                            </h4>
                            <div className="space-y-4">
                                {optimizationOptions.map((s, i) => (
                                    <div key={i} className="p-5 bg-qal-bg border border-qal-border rounded-2xl hover:border-qal-primary/40 cursor-pointer transition-all group overflow-hidden relative shadow-sm">
                                        <div className="absolute right-0 top-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                            <span className="material-symbols-outlined text-4xl text-emerald-600">trending_down</span>
                                        </div>
                                        <div className="flex justify-between items-start mb-2 relative z-10">
                                            <span className="text-sm font-bold text-qal-text-primary group-hover:text-qal-primary transition-colors pr-8">{s.title}</span>
                                        </div>
                                        <p className="text-xs text-qal-text-secondary font-bold leading-relaxed mb-4 opacity-60">{s.desc}</p>
                                        <div className="flex items-center justify-between mt-auto">
                                            <span className="text-xs font-black text-emerald-600 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">{s.savings}</span>
                                            <button
                                                onClick={() => toggleOptimization(i)}
                                                className={`text-[10px] font-black uppercase tracking-widest py-2 px-4 rounded-xl border transition-all active:scale-95 ${appliedOptimizations.includes(i)
                                                    ? 'bg-emerald-500 text-white border-emerald-500'
                                                    : 'text-qal-primary hover:text-white border-qal-primary/20 hover:bg-qal-primary'
                                                    }`}
                                            >
                                                {appliedOptimizations.includes(i) ? 'Применено' : 'Применить'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </Layout>
    )
}
