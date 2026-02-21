import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Boxes, ClipboardList, FileCog2, PackageSearch } from 'lucide-react'
import Layout from '../components/Layout'
import { useAuth } from '../AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

type RequestStatusFilter = 'all' | 'open' | 'archived'
type SortDirection = 'date_desc' | 'date_asc'

const statusMeta: Record<RequestStatusFilter, string> = {
  all: 'Все',
  open: 'Новые',
  archived: 'Архив'
}

export default function SupplierDashboardPage() {
  const { user, token } = useAuth()
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [quoteInputs, setQuoteInputs] = useState<Record<number, { amount: string; notes: string }>>({})
  const [statusFilter, setStatusFilter] = useState<RequestStatusFilter>('all')
  const [sort, setSort] = useState<SortDirection>('date_desc')
  const [page, setPage] = useState(1)
  const pageSize = 10

  const [profile, setProfile] = useState<any>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileForm, setProfileForm] = useState({
    company_name: '',
    city: '',
    catalog: ''
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
      .then((r) => r.json())
      .then((data) => setRequests(Array.isArray(data) ? data : []))
      .catch(() => setRequests([]))
      .finally(() => setLoading(false))
  }

  const loadProfile = () => {
    setProfileLoading(true)
    fetch('/api/v1/suppliers/me', { headers })
      .then((r) => r.json())
      .then((data) => {
        setProfile(data)
        setProfileForm({
          company_name: data.company_name || '',
          city: data.city || '',
          catalog: Array.isArray(data.catalog_json) ? data.catalog_json.join('\n') : ''
        })
      })
      .catch(() => setProfile(null))
      .finally(() => setProfileLoading(false))
  }

  useEffect(() => {
    load()
    loadProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, sort, page])

  const submitQuote = async (requestId: number) => {
    const input = quoteInputs[requestId]
    if (!input?.amount) return toast.error('Укажите сумму')

    const res = await fetch(`/api/v1/supply-requests/${requestId}/quote`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        amount: parseFloat(input.amount),
        notes: input.notes || null
      })
    })

    if (!res.ok) return toast.error('Не удалось отправить КП')
    toast.success('КП отправлено')
    load()
  }

  const withQuoteCount = requests.filter((item) => !!item.my_quote).length

  return (
    <Layout>
      <div className="relative max-w-6xl mx-auto overflow-hidden rounded-3xl px-4 py-6 md:px-6 md:py-8 space-y-6">
        <div className="magic-grid absolute inset-0 opacity-35" />
        <div className="magic-orb absolute -left-16 top-0 h-56 w-56 rounded-full bg-emerald-300/35" />
        <div className="magic-orb absolute -right-8 bottom-0 h-64 w-64 rounded-full bg-cyan-300/30" />

        <div className="relative z-10 space-y-6">
          <section className="magic-card rounded-3xl p-6 md:p-8">
            <p className="inline-flex items-center gap-2 rounded-full border border-qal-primary/30 bg-qal-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-qal-primary">
              <span className="inline-block h-2 w-2 rounded-full bg-qal-primary" />
              Supplier Hub
            </p>
            <h1 className="mt-4 text-3xl font-bold tracking-tight">Панель поставщика</h1>
            <p className="text-muted-foreground mt-2">Добро пожаловать, {user?.full_name || 'поставщик'}.</p>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/70 bg-white/75 p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Запросов в ленте</p>
                <p className="mt-2 text-2xl font-bold">{requests.length}</p>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/75 p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">С моим КП</p>
                <p className="mt-2 text-2xl font-bold">{withQuoteCount}</p>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/75 p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Текущий фильтр</p>
                <p className="mt-2 text-base font-semibold">{statusMeta[statusFilter]}</p>
              </div>
            </div>
          </section>

          <section className="magic-card rounded-3xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <PackageSearch className="h-4 w-4 text-qal-primary" />
              <h3 className="font-semibold">Каталог поставщика</h3>
            </div>

            {profileLoading ? (
              <div className="text-sm text-muted-foreground">Загрузка...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground">Компания</label>
                  <Input
                    className="bg-white/85"
                    value={profileForm.company_name}
                    onChange={(e) => setProfileForm({ ...profileForm, company_name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground">Город</label>
                  <Input
                    className="bg-white/85"
                    value={profileForm.city}
                    onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs text-muted-foreground">Каталог (по строке на позицию)</label>
                  <Textarea
                    className="bg-white/85"
                    rows={4}
                    value={profileForm.catalog}
                    onChange={(e) => setProfileForm({ ...profileForm, catalog: e.target.value })}
                  />
                </div>

                <div className="md:col-span-2">
                  <Button
                    className="inline-flex items-center gap-2"
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
                            : []
                        })
                      })
                      if (!res.ok) return toast.error('Не удалось сохранить')
                      toast.success('Каталог обновлён')
                      loadProfile()
                    }}
                  >
                    <FileCog2 className="h-4 w-4" />
                    Сохранить каталог
                  </Button>
                </div>
              </div>
            )}
          </section>

          <section className="magic-card rounded-3xl p-6">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-qal-primary" />
                <h3 className="font-semibold">Входящие заявки на поставку</h3>
              </div>

              <div className="flex flex-wrap gap-2 items-center">
                {(['all', 'open', 'archived'] as RequestStatusFilter[]).map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                      statusFilter === status
                        ? 'border-qal-primary bg-qal-primary text-white'
                        : 'border-qal-border bg-white/70 text-qal-text-secondary hover:border-qal-primary/40 hover:text-qal-primary'
                    }`}
                  >
                    {statusMeta[status]}
                  </button>
                ))}
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortDirection)}
                  className="h-10 rounded-xl border border-qal-border bg-white/85 px-3 text-xs font-semibold outline-none focus:border-qal-primary"
                >
                  <option value="date_desc">Дата: новые</option>
                  <option value="date_asc">Дата: старые</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="text-sm text-muted-foreground">Загрузка...</div>
            ) : requests.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-qal-border bg-white/60 p-6 text-sm text-muted-foreground">
                Нет новых заявок
              </div>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <Table className="min-w-[760px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Запрос</TableHead>
                        <TableHead>Дата</TableHead>
                        <TableHead>Позиции</TableHead>
                        <TableHead>Ваше КП</TableHead>
                        <TableHead>Действие</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {requests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell className="font-semibold">#{request.id}</TableCell>
                          <TableCell>{request.created_at ? new Date(request.created_at).toLocaleDateString() : ''}</TableCell>
                          <TableCell>{Array.isArray(request.items_json) ? request.items_json.length : 0}</TableCell>
                          <TableCell>{request.my_quote ? `₸${request.my_quote.amount?.toLocaleString()}` : '—'}</TableCell>
                          <TableCell>
                            {!request.my_quote && statusFilter !== 'archived' && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                <Input
                                  placeholder="Сумма"
                                  className="h-9 bg-white/90"
                                  value={quoteInputs[request.id]?.amount || ''}
                                  onChange={(e) =>
                                    setQuoteInputs((prev) => ({
                                      ...prev,
                                      [request.id]: {
                                        ...prev[request.id],
                                        amount: e.target.value,
                                        notes: prev[request.id]?.notes || ''
                                      }
                                    }))
                                  }
                                />
                                <Button size="sm" className="inline-flex items-center justify-center gap-1" onClick={() => submitQuote(request.id)}>
                                  <Boxes className="h-3.5 w-3.5" />
                                  Отправить КП
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Назад
                  </Button>
                  <span className="text-xs text-muted-foreground">Страница {page}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Вперед
                  </Button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </Layout>
  )
}
