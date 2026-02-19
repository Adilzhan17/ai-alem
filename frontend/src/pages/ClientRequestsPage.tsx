import Layout from '../components/Layout'
import { useAuth } from '../AuthContext'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export default function ClientRequestsPage() {
    const { token } = useAuth()
    const [rfqs, setRfqs] = useState<any[]>([])
    const [supplies, setSupplies] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [tab, setTab] = useState<'rfq' | 'supply'>('rfq')
    const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'accepted' | 'rejected' | 'archived'>('all')
    const [sort, setSort] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc')
    const [rfqPage, setRfqPage] = useState(1)
    const [supplyPage, setSupplyPage] = useState(1)
    const pageSize = 10

    const headers = { Authorization: `Bearer ${token}` }

    const load = () => {
        setLoading(true)
        const rfqParams = new URLSearchParams()
        rfqParams.set('include_quotes', 'true')
        if (statusFilter !== 'all') rfqParams.set('status_filter', statusFilter === 'accepted' || statusFilter === 'rejected' ? 'archived' : statusFilter)
        rfqParams.set('sort', sort.startsWith('date') ? sort : 'date_desc')
        rfqParams.set('skip', String((rfqPage - 1) * pageSize))
        rfqParams.set('limit', String(pageSize))

        const supplyParams = new URLSearchParams()
        supplyParams.set('include_quotes', 'true')
        if (statusFilter !== 'all') supplyParams.set('status_filter', statusFilter === 'accepted' || statusFilter === 'rejected' ? 'archived' : statusFilter)
        supplyParams.set('sort', sort.startsWith('date') ? sort : 'date_desc')
        supplyParams.set('skip', String((supplyPage - 1) * pageSize))
        supplyParams.set('limit', String(pageSize))

        Promise.all([
            fetch(`/api/v1/rfq?${rfqParams}`, { headers }).then(r => r.json()),
            fetch(`/api/v1/supply-requests?${supplyParams}`, { headers }).then(r => r.json()),
        ]).then(([r, s]) => {
            setRfqs(Array.isArray(r) ? r : [])
            setSupplies(Array.isArray(s) ? s : [])
            setLoading(false)
        }).catch(() => {
            setRfqs([])
            setSupplies([])
            setLoading(false)
        })
    }

    useEffect(() => { load() }, [statusFilter, sort, rfqPage, supplyPage])

    const awardRfq = async (quoteId: number) => {
        const res = await fetch(`/api/v1/rfq/quotes/${quoteId}/award`, {
            method: 'POST',
            headers,
        })
        if (!res.ok) return toast.error('Не удалось выбрать подрядчика')
        toast.success('Подрядчик выбран')
        load()
    }

    const awardSupply = async (quoteId: number) => {
        const res = await fetch(`/api/v1/supply-requests/quotes/${quoteId}/award`, {
            method: 'POST',
            headers,
        })
        if (!res.ok) return toast.error('Не удалось выбрать поставщика')
        toast.success('Поставщик выбран')
        load()
    }

    return (
        <Layout>
            <div className="max-w-6xl mx-auto space-y-6 md:space-y-8 px-4 md:px-0">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Заявки</h1>
                    <p className="text-muted-foreground mt-1">RFQ подрядчикам и запросы поставщикам.</p>
                </div>

                {loading ? (
                    <div className="text-sm text-muted-foreground">Загрузка...</div>
                ) : (
                    <div className="space-y-10">
                        <div className="flex flex-wrap gap-2">
                            <button onClick={() => setTab('rfq')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${tab === 'rfq' ? 'bg-qal-primary text-white border-qal-primary' : 'bg-qal-bg text-qal-text-secondary border-qal-border'}`}>RFQ подрядчикам</button>
                            <button onClick={() => setTab('supply')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${tab === 'supply' ? 'bg-qal-primary text-white border-qal-primary' : 'bg-qal-bg text-qal-text-secondary border-qal-border'}`}>Запросы поставщикам</button>
                            <div className="flex flex-wrap gap-2 w-full md:w-auto md:ml-auto">
                                {['all', 'open', 'accepted', 'rejected', 'archived'].map(s => (
                                    <button key={s} onClick={() => setStatusFilter(s as any)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${statusFilter === s ? 'bg-qal-primary text-white border-qal-primary' : 'bg-qal-bg text-qal-text-secondary border-qal-border'}`}>{s}</button>
                                ))}
                            </div>
                            <select
                                value={sort}
                                onChange={(e) => setSort(e.target.value as any)}
                                className="w-full md:w-auto md:ml-auto border rounded-lg px-2 py-1.5 text-xs"
                            >
                                <option value="date_desc">Дата ↓</option>
                                <option value="date_asc">Дата ↑</option>
                                <option value="amount_desc">Сумма ↓</option>
                                <option value="amount_asc">Сумма ↑</option>
                            </select>
                        </div>

                        {tab === 'rfq' && (
                            <section className="space-y-4">
                                {rfqs.length === 0 ? (
                                    <div className="text-sm text-muted-foreground">Нет RFQ</div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[720px] text-sm border-collapse">
                                            <thead>
                                                <tr className="border-b">
                                                    <th className="text-left py-2">RFQ</th>
                                                    <th className="text-left py-2">Дата</th>
                                                    <th className="text-left py-2">Scope</th>
                                                    <th className="text-left py-2">Предложения</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {rfqs
                                                    .filter(r => {
                                                        if (statusFilter === 'archived') return ['accepted', 'rejected'].includes(r.status)
                                                        if (statusFilter === 'accepted') return r.status === 'accepted'
                                                        if (statusFilter === 'rejected') return r.status === 'rejected'
                                                        return true
                                                    })
                                                    .sort((a, b) => {
                                                        if (sort.startsWith('date')) {
                                                            const ad = new Date(a.created_at || 0).getTime()
                                                            const bd = new Date(b.created_at || 0).getTime()
                                                            return sort === 'date_desc' ? bd - ad : ad - bd
                                                        }
                                                        const abest = (a.quotes || [])[0]?.amount || 0
                                                        const bbest = (b.quotes || [])[0]?.amount || 0
                                                        return sort === 'amount_desc' ? bbest - abest : abest - bbest
                                                    })
                                                    .map((r) => (
                                                        <tr key={r.id} className="border-b align-top">
                                                            <td className="py-2">#{r.id}</td>
                                                            <td className="py-2">{r.created_at ? new Date(r.created_at).toLocaleDateString() : ''}</td>
                                                            <td className="py-2">{r.scope || '—'}</td>
                                                            <td className="py-2">
                                                                {(r.quotes || []).length === 0 ? (
                                                                    <span className="text-muted-foreground">Нет предложений</span>
                                                                ) : (
                                                                    <div className="space-y-2">
                                                                        {(r.quotes || []).map((q: any) => (
                                                                            <div key={q.id} className="flex items-center justify-between border rounded-lg p-2">
                                                                                <div>
                                                                                    <div className="font-semibold">{q.contractor_name || `Contractor #${q.contractor_id}`}</div>
                                                                                    <div className="text-xs text-muted-foreground">₸{q.amount?.toLocaleString()} · {q.timeline_days || '—'} дней</div>
                                                                                </div>
                                                                                <button
                                                                                    className="px-3 py-1.5 bg-qal-primary text-white rounded-lg text-xs font-semibold"
                                                                                    onClick={() => awardRfq(q.id)}
                                                                                >
                                                                                    Выбрать
                                                                                </button>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    <button className="px-3 py-1.5 border rounded-lg text-xs" onClick={() => setRfqPage(p => Math.max(1, p - 1))}>Назад</button>
                                    <span className="text-xs text-muted-foreground">Страница {rfqPage}</span>
                                    <button className="px-3 py-1.5 border rounded-lg text-xs" onClick={() => setRfqPage(p => p + 1)}>Вперед</button>
                                </div>
                            </section>
                        )}

                        {tab === 'supply' && (
                            <section className="space-y-4">
                                {supplies.length === 0 ? (
                                    <div className="text-sm text-muted-foreground">Нет запросов</div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[720px] text-sm border-collapse">
                                            <thead>
                                                <tr className="border-b">
                                                    <th className="text-left py-2">Запрос</th>
                                                    <th className="text-left py-2">Дата</th>
                                                    <th className="text-left py-2">Позиции</th>
                                                    <th className="text-left py-2">Предложения</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {supplies
                                                    .filter(r => {
                                                        if (statusFilter === 'archived') return ['accepted', 'rejected'].includes(r.status)
                                                        if (statusFilter === 'accepted') return r.status === 'accepted'
                                                        if (statusFilter === 'rejected') return r.status === 'rejected'
                                                        return true
                                                    })
                                                    .sort((a, b) => {
                                                        if (sort.startsWith('date')) {
                                                            const ad = new Date(a.created_at || 0).getTime()
                                                            const bd = new Date(b.created_at || 0).getTime()
                                                            return sort === 'date_desc' ? bd - ad : ad - bd
                                                        }
                                                        const abest = (a.quotes || [])[0]?.amount || 0
                                                        const bbest = (b.quotes || [])[0]?.amount || 0
                                                        return sort === 'amount_desc' ? bbest - abest : abest - bbest
                                                    })
                                                    .map((r) => (
                                                        <tr key={r.id} className="border-b align-top">
                                                            <td className="py-2">#{r.id}</td>
                                                            <td className="py-2">{r.created_at ? new Date(r.created_at).toLocaleDateString() : ''}</td>
                                                            <td className="py-2">{Array.isArray(r.items_json) ? r.items_json.length : 0}</td>
                                                            <td className="py-2">
                                                                {(r.quotes || []).length === 0 ? (
                                                                    <span className="text-muted-foreground">Нет предложений</span>
                                                                ) : (
                                                                    <div className="space-y-2">
                                                                        {(r.quotes || []).map((q: any) => (
                                                                            <div key={q.id} className="flex items-center justify-between border rounded-lg p-2">
                                                                                <div>
                                                                                    <div className="font-semibold">{q.supplier_name || `Supplier #${q.supplier_id}`}</div>
                                                                                    <div className="text-xs text-muted-foreground">₸{q.amount?.toLocaleString()}</div>
                                                                                </div>
                                                                                <button
                                                                                    className="px-3 py-1.5 bg-qal-primary text-white rounded-lg text-xs font-semibold"
                                                                                    onClick={() => awardSupply(q.id)}
                                                                                >
                                                                                    Выбрать
                                                                                </button>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    <button className="px-3 py-1.5 border rounded-lg text-xs" onClick={() => setSupplyPage(p => Math.max(1, p - 1))}>Назад</button>
                                    <span className="text-xs text-muted-foreground">Страница {supplyPage}</span>
                                    <button className="px-3 py-1.5 border rounded-lg text-xs" onClick={() => setSupplyPage(p => p + 1)}>Вперед</button>
                                </div>
                            </section>
                        )}
                    </div>
                )}
            </div>
        </Layout>
    )
}
