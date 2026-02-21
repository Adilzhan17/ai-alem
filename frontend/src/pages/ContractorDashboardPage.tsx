import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { BriefcaseBusiness, Clock3, FileText, Layers3 } from 'lucide-react'
import Layout from '../components/Layout'
import { useAuth } from '../AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

type RfqStatusFilter = 'all' | 'open' | 'quoted' | 'archived'
type SortDirection = 'date_desc' | 'date_asc'

const statusMeta: Record<RfqStatusFilter, { label: string }> = {
  all: { label: 'Все' },
  open: { label: 'Новые' },
  quoted: { label: 'С моим КП' },
  archived: { label: 'Архив' }
}

export default function ContractorDashboardPage() {
  const { user, token } = useAuth()
  const [rfqs, setRfqs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [quoteInputs, setQuoteInputs] = useState<Record<number, { amount: string; timeline_days: string; notes: string }>>({})
  const [statusFilter, setStatusFilter] = useState<RfqStatusFilter>('all')
  const [sort, setSort] = useState<SortDirection>('date_desc')
  const [page, setPage] = useState(1)
  const pageSize = 10

  const [profile, setProfile] = useState<any>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileForm, setProfileForm] = useState({
    company_name: '',
    city: '',
    description: '',
    specializations: ''
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
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : []
        setRfqs(statusFilter === 'quoted' ? list.filter((item: any) => !!item.my_quote) : list)
      })
      .catch(() => setRfqs([]))
      .finally(() => setLoading(false))
  }

  const loadProfile = () => {
    setProfileLoading(true)
    fetch('/api/v1/contractors/me', { headers })
      .then((r) => r.json())
      .then((data) => {
        setProfile(data)
        setProfileForm({
          company_name: data.company_name || '',
          city: data.city || '',
          description: data.description || '',
          specializations: Array.isArray(data.specializations) ? data.specializations.join(', ') : ''
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

  const submitQuote = async (rfqId: number) => {
    const input = quoteInputs[rfqId]
    if (!input?.amount) return toast.error('Укажите сумму')

    const res = await fetch(`/api/v1/rfq/${rfqId}/quote`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        amount: parseFloat(input.amount),
        timeline_days: input.timeline_days ? parseInt(input.timeline_days, 10) : null,
        notes: input.notes || null
      })
    })

    if (!res.ok) return toast.error('Не удалось отправить КП')
    toast.success('КП отправлено')
    load()
  }

  const totalWithQuote = rfqs.filter((item) => !!item.my_quote).length

  return (
    <Layout>
      <div className="relative max-w-6xl mx-auto overflow-hidden rounded-3xl px-4 py-6 md:px-6 md:py-8 space-y-6">
        <div className="magic-grid absolute inset-0 opacity-35" />
        <div className="magic-orb absolute -left-14 top-0 h-56 w-56 rounded-full bg-cyan-300/35" />
        <div className="magic-orb absolute -right-10 bottom-0 h-64 w-64 rounded-full bg-blue-300/30" />

        <div className="relative z-10 space-y-6">
          <section className="magic-card rounded-3xl p-6 md:p-8">
            <p className="inline-flex items-center gap-2 rounded-full border border-qal-primary/30 bg-qal-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-qal-primary">
              <span className="inline-block h-2 w-2 rounded-full bg-qal-primary" />
              Contractor Hub
            </p>
            <h1 className="mt-4 text-3xl font-bold tracking-tight">Панель подрядчика</h1>
            <p className="text-muted-foreground mt-2">Добро пожаловать, {user?.full_name || 'подрядчик'}.</p>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/70 bg-white/75 p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">RFQ в ленте</p>
                <p className="mt-2 text-2xl font-bold">{rfqs.length}</p>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/75 p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">С моим КП</p>
                <p className="mt-2 text-2xl font-bold">{totalWithQuote}</p>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/75 p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Текущий фильтр</p>
                <p className="mt-2 text-base font-semibold">{statusMeta[statusFilter].label}</p>
              </div>
            </div>
          </section>

          <section className="magic-card rounded-3xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <BriefcaseBusiness className="h-4 w-4 text-qal-primary" />
              <h3 className="font-semibold">Витрина подрядчика</h3>
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
                  <label className="text-xs text-muted-foreground">Специализации (через запятую)</label>
                  <Input
                    className="bg-white/85"
                    value={profileForm.specializations}
                    onChange={(e) => setProfileForm({ ...profileForm, specializations: e.target.value })}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs text-muted-foreground">Описание</label>
                  <Textarea
                    className="bg-white/85"
                    rows={3}
                    value={profileForm.description}
                    onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })}
                  />
                </div>

                <div className="md:col-span-2">
                  <Button
                    className="inline-flex items-center gap-2"
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
                            : []
                        })
                      })
                      if (!res.ok) return toast.error('Не удалось сохранить')
                      toast.success('Профиль обновлён')
                      loadProfile()
                    }}
                  >
                    <FileText className="h-4 w-4" />
                    Сохранить профиль
                  </Button>
                </div>
              </div>
            )}
          </section>

          <section className="magic-card rounded-3xl p-6">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2">
                <Layers3 className="h-4 w-4 text-qal-primary" />
                <h3 className="font-semibold">Входящие заявки (RFQ)</h3>
              </div>

              <div className="flex flex-wrap gap-2 items-center">
                {(['all', 'open', 'quoted', 'archived'] as RfqStatusFilter[]).map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                      statusFilter === status
                        ? 'border-qal-primary bg-qal-primary text-white'
                        : 'border-qal-border bg-white/70 text-qal-text-secondary hover:border-qal-primary/40 hover:text-qal-primary'
                    }`}
                  >
                    {statusMeta[status].label}
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
            ) : rfqs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-qal-border bg-white/60 p-6 text-sm text-muted-foreground">
                Нет новых заявок
              </div>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <Table className="min-w-[760px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>RFQ</TableHead>
                        <TableHead>Дата</TableHead>
                        <TableHead>Scope</TableHead>
                        <TableHead>Ваше КП</TableHead>
                        <TableHead>Действие</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rfqs.map((rfq) => (
                        <TableRow key={rfq.id}>
                          <TableCell className="font-semibold">#{rfq.id}</TableCell>
                          <TableCell>{rfq.created_at ? new Date(rfq.created_at).toLocaleDateString() : ''}</TableCell>
                          <TableCell>{rfq.scope || '—'}</TableCell>
                          <TableCell>
                            {rfq.my_quote ? `₸${rfq.my_quote.amount?.toLocaleString()} · ${rfq.my_quote.timeline_days || '—'} дн.` : '—'}
                          </TableCell>
                          <TableCell>
                            {!rfq.my_quote && statusFilter !== 'archived' && (
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                <Input
                                  placeholder="Сумма"
                                  className="h-9 bg-white/90"
                                  value={quoteInputs[rfq.id]?.amount || ''}
                                  onChange={(e) =>
                                    setQuoteInputs((prev) => ({
                                      ...prev,
                                      [rfq.id]: {
                                        ...prev[rfq.id],
                                        amount: e.target.value,
                                        timeline_days: prev[rfq.id]?.timeline_days || '',
                                        notes: prev[rfq.id]?.notes || ''
                                      }
                                    }))
                                  }
                                />
                                <Input
                                  placeholder="Срок (дн.)"
                                  className="h-9 bg-white/90"
                                  value={quoteInputs[rfq.id]?.timeline_days || ''}
                                  onChange={(e) =>
                                    setQuoteInputs((prev) => ({
                                      ...prev,
                                      [rfq.id]: {
                                        ...prev[rfq.id],
                                        amount: prev[rfq.id]?.amount || '',
                                        timeline_days: e.target.value,
                                        notes: prev[rfq.id]?.notes || ''
                                      }
                                    }))
                                  }
                                />
                                <Button size="sm" onClick={() => submitQuote(rfq.id)}>
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
                    className="inline-flex items-center gap-1"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <Clock3 className="h-3.5 w-3.5" />
                    Назад
                  </Button>
                  <span className="text-xs text-muted-foreground">Страница {page}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="inline-flex items-center gap-1"
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
