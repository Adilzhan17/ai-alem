import Layout from '../components/Layout'
import { useAuth } from '../AuthContext'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export default function SupplierDashboardPage() {
    const { user, token } = useAuth()
    const [requests, setRequests] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [quoteInputs, setQuoteInputs] = useState<Record<number, { amount: string; notes: string }>>({})
    const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'archived'>('all')
    const [sort, setSort] = useState<'date_desc' | 'date_asc'>('date_desc')
    const [page, setPage] = useState(1)
    const pageSize = 10
    const [profile, setProfile] = useState<any>(null)
    const [profileLoading, setProfileLoading] = useState(true)
    const [profileForm, setProfileForm] = useState({
        company_name: '',
        city: '',
        catalog: '',
    })

    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

    const load = () => {
        setLoading(true)
        const params = new URLSearchParams()
        if (statusFilter !== 'all') {
            params.set('status_filter', statusFilter)
        }
        params.set('sort', sort)
        params.set('skip', String((page - 1) * pageSize))
        params.set('limit', String(pageSize))
        fetch(`/api/v1/supply-requests/inbox?${params}`, { headers })
            .then(r => r.json())
            .then(data => setRequests(Array.isArray(data) ? data : []))
            .catch(() => setRequests([]))
            .finally(() => setLoading(false))
    }

    const loadProfile = () => {
        setProfileLoading(true)
        fetch('/api/v1/suppliers/me', { headers })
            .then(r => r.json())
            .then(data => {
                setProfile(data)
                setProfileForm({
                    company_name: data.company_name || '',
                    city: data.city || '',
                    catalog: Array.isArray(data.catalog_json) ? data.catalog_json.join('\n') : '',
                })
            })
            .catch(() => setProfile(null))
            .finally(() => setProfileLoading(false))
    }

    useEffect(() => { load(); loadProfile() }, [])
    useEffect(() => { load() }, [statusFilter, sort, page])

    const submitQuote = async (requestId: number) => {
        const input = quoteInputs[requestId]
        if (!input?.amount) return toast.error('Укажите сумму')
        const res = await fetch(`/api/v1/supply-requests/${requestId}/quote`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                amount: parseFloat(input.amount),
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
                    <h1 className="text-3xl font-bold tracking-tight">Панель поставщика</h1>
                    <p className="text-muted-foreground mt-1">
                        Добро пожаловать, {user?.full_name || 'поставщик'}.
                    </p>
                </div>

                <div className="p-6 rounded-2xl border bg-card">
                    <h3 className="font-semibold mb-4">Каталог поставщика</h3>
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
                                <label className="text-xs text-muted-foreground">Каталог (по строке на позицию)</label>
                                <textarea
                                    className="w-full border rounded-lg px-3 py-2 text-sm"
                                    rows={4}
                                    value={profileForm.catalog}
                                    onChange={(e) => setProfileForm({ ...profileForm, catalog: e.target.value })}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <button
                                    className="px-4 py-2 bg-qal-primary text-white rounded-lg text-sm font-semibold"
                                    onClick={async () => {
                                        if (!profile?.id) return
                                        const res = await fetch(`/api/v1/suppliers/${profile.id}`, {
                                            method: 'PUT',
                                            headers,
                                            body: JSON.stringify({
                                                company_name: profileForm.company_name,
                                                city: profileForm.city,
                                                catalog_json: profileForm.catalog
                                                    ? profileForm.catalog.split('\n').map((s) => s.trim()).filter(Boolean)
                                                    : [],
                                            })
                                        })
                                        if (!res.ok) return toast.error('Не удалось сохранить')
                                        toast.success('Каталог обновлён')
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
                    <h3 className="font-semibold mb-4">Входящие заявки на поставку</h3>
                    <div className="flex flex-wrap gap-2 mb-4 items-center">
                        {['all', 'open', 'archived'].map(s => (
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
                    ) : requests.length === 0 ? (
                        <div className="text-sm text-muted-foreground">Нет новых заявок</div>
                    ) : (
                        <div className="space-y-4">
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[720px] text-sm border-collapse">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left py-2">Запрос</th>
                                            <th className="text-left py-2">Дата</th>
                                            <th className="text-left py-2">Позиции</th>
                                            <th className="text-left py-2">Ваше КП</th>
                                            <th className="text-left py-2">Действие</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {requests.map((r) => (
                                            <tr key={r.id} className="border-b">
                                                <td className="py-2">#{r.id}</td>
                                                <td className="py-2">{r.created_at ? new Date(r.created_at).toLocaleDateString() : ''}</td>
                                                <td className="py-2">{Array.isArray(r.items_json) ? r.items_json.length : 0}</td>
                                                <td className="py-2">
                                                    {r.my_quote ? `₸${r.my_quote.amount?.toLocaleString()}` : '—'}
                                                </td>
                                                <td className="py-2">
                                                    {!r.my_quote && statusFilter !== 'archived' && (
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                            <input
                                                                placeholder="Сумма"
                                                                className="border rounded-lg px-2 py-1"
                                                                value={quoteInputs[r.id]?.amount || ''}
                                                                onChange={(e) => setQuoteInputs(prev => ({ ...prev, [r.id]: { ...prev[r.id], amount: e.target.value, notes: prev[r.id]?.notes || '' } }))}
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
