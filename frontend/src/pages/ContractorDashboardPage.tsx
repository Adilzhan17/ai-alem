import Layout from '../components/Layout'
import { useAuth } from '../AuthContext'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export default function ContractorDashboardPage() {
    const { user, token } = useAuth()
    const [rfqs, setRfqs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [quoteInputs, setQuoteInputs] = useState<Record<number, { amount: string; timeline_days: string; notes: string }>>({})
    const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'quoted' | 'archived'>('all')
    const [sort, setSort] = useState<'date_desc' | 'date_asc'>('date_desc')
    const [page, setPage] = useState(1)
    const pageSize = 10
    const [profile, setProfile] = useState<any>(null)
    const [profileLoading, setProfileLoading] = useState(true)
    const [profileForm, setProfileForm] = useState({
        company_name: '',
        city: '',
        description: '',
        specializations: '',
    })

    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

    const load = () => {
        setLoading(true)
        const params = new URLSearchParams()
        if (statusFilter !== 'all') {
            params.set('status_filter', statusFilter === 'quoted' ? 'open' : statusFilter === 'archived' ? 'archived' : statusFilter)
        }
        params.set('sort', sort)
        params.set('skip', String((page - 1) * pageSize))
        params.set('limit', String(pageSize))
        fetch(`/api/v1/rfq/inbox?${params}`, { headers })
            .then(r => r.json())
            .then(data => {
                const list = Array.isArray(data) ? data : []
                setRfqs(statusFilter === 'quoted' ? list.filter((r: any) => !!r.my_quote) : list)
            })
            .catch(() => setRfqs([]))
            .finally(() => setLoading(false))
    }

    const loadProfile = () => {
        setProfileLoading(true)
        fetch('/api/v1/contractors/me', { headers })
            .then(r => r.json())
            .then(data => {
                setProfile(data)
                setProfileForm({
                    company_name: data.company_name || '',
                    city: data.city || '',
                    description: data.description || '',
                    specializations: Array.isArray(data.specializations) ? data.specializations.join(', ') : '',
                })
            })
            .catch(() => setProfile(null))
            .finally(() => setProfileLoading(false))
    }

    useEffect(() => { load(); loadProfile() }, [])
    useEffect(() => { load() }, [statusFilter, sort, page])

    const submitQuote = async (rfqId: number) => {
        const input = quoteInputs[rfqId]
        if (!input?.amount) return toast.error('Укажите сумму')
        const res = await fetch(`/api/v1/rfq/${rfqId}/quote`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                amount: parseFloat(input.amount),
                timeline_days: input.timeline_days ? parseInt(input.timeline_days) : null,
                notes: input.notes || null,
            })
        })
        if (!res.ok) return toast.error('Не удалось отправить КП')
        toast.success('КП отправлено')
        load()
    }

    return (
        <Layout>
            <div className="max-w-5xl mx-auto space-y-6 px-4 md:px-0">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Панель подрядчика</h1>
                    <p className="text-muted-foreground mt-1">
                        Добро пожаловать, {user?.full_name || 'подрядчик'}.
                    </p>
                </div>

                <div className="p-6 rounded-2xl border bg-card">
                    <h3 className="font-semibold mb-4">Витрина подрядчика</h3>
                    {profileLoading ? (
                        <div className="text-sm text-muted-foreground">Загрузка...</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-muted-foreground">Компания</label>
                                <input
                                    className="w-full border rounded-lg px-3 py-2 text-sm"
                                    value={profileForm.company_name}
                                    onChange={(e) => setProfileForm({ ...profileForm, company_name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground">Город</label>
                                <input
                                    className="w-full border rounded-lg px-3 py-2 text-sm"
                                    value={profileForm.city}
                                    onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-xs text-muted-foreground">Специализации (через запятую)</label>
                                <input
                                    className="w-full border rounded-lg px-3 py-2 text-sm"
                                    value={profileForm.specializations}
                                    onChange={(e) => setProfileForm({ ...profileForm, specializations: e.target.value })}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-xs text-muted-foreground">Описание</label>
                                <textarea
                                    className="w-full border rounded-lg px-3 py-2 text-sm"
                                    rows={3}
                                    value={profileForm.description}
                                    onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <button
                                    className="px-4 py-2 bg-qal-primary text-white rounded-lg text-sm font-semibold"
                                    onClick={async () => {
                                        if (!profile?.id) return
                                        const res = await fetch(`/api/v1/contractors/${profile.id}`, {
                                            method: 'PUT',
                                            headers,
                                            body: JSON.stringify({
                                                company_name: profileForm.company_name,
                                                city: profileForm.city,
                                                description: profileForm.description,
                                                specializations: profileForm.specializations
                                                    ? profileForm.specializations.split(',').map((s) => s.trim()).filter(Boolean)
                                                    : [],
                                            })
                                        })
                                        if (!res.ok) return toast.error('Не удалось сохранить')
                                        toast.success('Профиль обновлён')
                                        loadProfile()
                                    }}
                                >
                                    Сохранить
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 rounded-2xl border bg-card">
                    <h3 className="font-semibold mb-4">Входящие заявки (RFQ)</h3>
                    <div className="flex flex-wrap gap-2 mb-4 items-center">
                        {['all', 'open', 'quoted', 'archived'].map(s => (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(s as any)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${statusFilter === s ? 'bg-qal-primary text-white border-qal-primary' : 'bg-qal-bg text-qal-text-secondary border-qal-border'}`}
                            >
                                {s}
                            </button>
                        ))}
                        <select
                            value={sort}
                            onChange={(e) => setSort(e.target.value as any)}
                            className="ml-auto border rounded-lg px-2 py-1.5 text-xs"
                        >
                            <option value="date_desc">Дата ↓</option>
                            <option value="date_asc">Дата ↑</option>
                        </select>
                    </div>
                    {loading ? (
                        <div className="text-sm text-muted-foreground">Загрузка...</div>
                    ) : rfqs.length === 0 ? (
                        <div className="text-sm text-muted-foreground">Нет новых заявок</div>
                    ) : (
                        <div className="space-y-4">
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[720px] text-sm border-collapse">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left py-2">RFQ</th>
                                            <th className="text-left py-2">Дата</th>
                                            <th className="text-left py-2">Scope</th>
                                            <th className="text-left py-2">Ваше КП</th>
                                            <th className="text-left py-2">Действие</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rfqs.map((r) => (
                                            <tr key={r.id} className="border-b">
                                                <td className="py-2">#{r.id}</td>
                                                <td className="py-2">{r.created_at ? new Date(r.created_at).toLocaleDateString() : ''}</td>
                                                <td className="py-2">{r.scope || '—'}</td>
                                                <td className="py-2">
                                                    {r.my_quote ? `₸${r.my_quote.amount?.toLocaleString()} · ${r.my_quote.timeline_days || '—'} дн.` : '—'}
                                                </td>
                                                <td className="py-2">
                                                    {!r.my_quote && statusFilter !== 'archived' && (
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                                            <input
                                                                placeholder="Сумма"
                                                                className="border rounded-lg px-2 py-1"
                                                                value={quoteInputs[r.id]?.amount || ''}
                                                                onChange={(e) => setQuoteInputs(prev => ({ ...prev, [r.id]: { ...prev[r.id], amount: e.target.value, timeline_days: prev[r.id]?.timeline_days || '', notes: prev[r.id]?.notes || '' } }))}
                                                            />
                                                            <input
                                                                placeholder="Срок (дн.)"
                                                                className="border rounded-lg px-2 py-1"
                                                                value={quoteInputs[r.id]?.timeline_days || ''}
                                                                onChange={(e) => setQuoteInputs(prev => ({ ...prev, [r.id]: { ...prev[r.id], timeline_days: e.target.value, amount: prev[r.id]?.amount || '', notes: prev[r.id]?.notes || '' } }))}
                                                            />
                                                            <button
                                                                className="px-3 py-1 bg-qal-primary text-white rounded-lg text-xs font-semibold"
                                                                onClick={() => submitQuote(r.id)}
                                                            >
                                                                Отправить КП
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="px-3 py-1.5 border rounded-lg text-xs" onClick={() => setPage(p => Math.max(1, p - 1))}>Назад</button>
                                <span className="text-xs text-muted-foreground">Страница {page}</span>
                                <button className="px-3 py-1.5 border rounded-lg text-xs" onClick={() => setPage(p => p + 1)}>Вперед</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    )
}
