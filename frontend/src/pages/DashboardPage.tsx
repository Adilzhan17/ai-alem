import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  ArrowUpRight,
  MoreHorizontal,
  Calendar,
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  Plus
} from 'lucide-react'

import Layout from '../components/Layout'
import { useAuth } from '../AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

const API = '/api/v1'

import { useLanguage } from '../LanguageContext'

export default function DashboardPage() {
  const { user, token } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [stats, setStats] = useState<{ listings: any[] }>({ listings: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        setLoading(false)
        return
      }

      try {
        const listingsRes = await fetch(`${API}/listings/mine`, { headers: { Authorization: `Bearer ${token}` } })
        const listingsData = await listingsRes.json()
        setStats({
          listings: Array.isArray(listingsData) ? listingsData : (listingsData.items || [])
        })
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [token])

  const activeListingsCount = stats.listings.filter((l: any) => l.status === 'approved').length
  const pendingListingsCount = stats.listings.filter((l: any) => l.status === 'pending_review').length

  const quickActions = [
    { label: t('createListing'), desc: t('createListingDesc'), icon: Plus, path: '/listings/create', color: 'text-emerald-600', bg: 'bg-emerald-500/15' },
    { label: t('marketAnalysis'), desc: t('marketAnalysisDesc'), icon: TrendingUp, path: '/results', color: 'text-indigo-600', bg: 'bg-indigo-500/15' },
    { label: t('costEstimation'), desc: t('costEstimationDesc'), icon: DollarSign, path: '/estimate', color: 'text-amber-600', bg: 'bg-amber-500/15' },
    { label: t('findContractors'), desc: t('findContractorsDesc'), icon: Users, path: '/contractors', color: 'text-sky-600', bg: 'bg-sky-500/15' }
  ]

  return (
    <Layout>
      <div className="relative w-full max-w-7xl mx-auto overflow-hidden rounded-3xl px-4 py-6 md:px-6 md:py-8">
        <div className="magic-grid absolute inset-0 opacity-40" />
        <div className="magic-orb absolute -left-20 top-0 h-64 w-64 rounded-full bg-cyan-300/40" />
        <div className="magic-orb absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-indigo-300/35" />

        <div className="relative z-10 flex flex-col gap-6 md:gap-8">
          <section className="magic-card rounded-3xl p-6 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-qal-primary/30 bg-qal-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-qal-primary">
                  <span className="inline-block h-2 w-2 rounded-full bg-qal-primary" />
                  Qal Intelligence
                </p>
                <h1 className="text-3xl font-bold tracking-tight">{t('commandCenter')}</h1>
                <p className="text-muted-foreground mt-1">
                  {t('welcomeBack')}, {user?.full_name?.split(' ')[0] || t('guestUser')}. {t('heresWhatsHappening')}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" className="gap-2 bg-white/70" onClick={() => toast.info('Фильтр по датам пока не доступен')}>
                  <Calendar className="h-4 w-4" /> {t('today')}
                </Button>
                <Button onClick={() => navigate('/listings/create')} className="bg-qal-primary hover:bg-qal-primary-dark shadow-lg shadow-qal-primary/30">
                  <Plus className="mr-2 h-4 w-4" /> {t('newProject')}
                </Button>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="magic-card border-white/90 bg-white/75">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('totalListings')}</CardTitle>
                <LayoutDashboard className="h-4 w-4 text-qal-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : stats.listings.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {activeListingsCount} {t('activeState')}, {pendingListingsCount} {t('pendingState')}
                </p>
              </CardContent>
            </Card>

            <Card className="magic-card border-white/90 bg-white/75">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('portfolioValue')}</CardTitle>
                <DollarSign className="h-4 w-4 text-amber-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$0.00</div>
                <p className="text-xs text-muted-foreground mt-1">+0% {t('fromLastMonth')}</p>
              </CardContent>
            </Card>

            <Card className="magic-card border-white/90 bg-white/75">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('activeContractors')}</CardTitle>
                <Users className="h-4 w-4 text-sky-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground mt-1">{t('noActiveContracts')}</p>
              </CardContent>
            </Card>

            <Card className="magic-card border-white/90 bg-white/75">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('systemHealth')}</CardTitle>
                <Activity className="h-4 w-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">98%</div>
                <p className="text-xs text-muted-foreground mt-1">{t('operational')}</p>
              </CardContent>
            </Card>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="magic-card col-span-1 lg:col-span-2 rounded-3xl border-white/90 bg-white/75">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{t('recentActivity')}</CardTitle>
                    <CardDescription>{t('recentActivityDesc')}</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" className="hover:bg-white/60" onClick={() => navigate('/my-listings')}>
                    {t('viewAll')} <ArrowUpRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-4">
                        <Skeleton className="h-12 w-12 rounded-lg" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-[200px]" />
                          <Skeleton className="h-4 w-[150px]" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : stats.listings.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-muted-foreground text-sm">{t('noRecentActivity')}</p>
                    <Button variant="link" onClick={() => navigate('/listings/create')}>{t('createFirstListing')}</Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {stats.listings.slice(0, 5).map((listing: any) => (
                      <div key={listing.id} className="flex items-center justify-between group rounded-2xl border border-white/60 bg-white/60 p-3">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-10 w-10 rounded-lg border">
                            <AvatarImage src={listing.image_url} alt={listing.title} className="object-cover" />
                            <AvatarFallback className="rounded-lg">L</AvatarFallback>
                          </Avatar>
                          <div className="grid gap-1">
                            <p className="text-sm font-medium leading-none group-hover:text-qal-primary transition-colors cursor-pointer" onClick={() => navigate('/my-listings')}>
                              {listing.title}
                            </p>
                            <div className="flex items-center gap-2">
                              <Badge variant={listing.status === 'approved' ? 'secondary' : 'outline'} className="text-[10px] h-5 px-1.5 font-normal">
                                {listing.status}
                              </Badge>
                              <p className="text-xs text-muted-foreground">{new Date(listing.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="group-hover:opacity-100 opacity-0 transition-opacity">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="magic-card rounded-3xl border-white/90 bg-white/75">
              <CardHeader>
                <CardTitle>{t('quickActions')}</CardTitle>
                <CardDescription>{t('commonTasks')}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => navigate(action.path)}
                    className="group flex items-center gap-4 p-3 rounded-xl border border-white/70 bg-white/70 hover:bg-white transition-colors text-left"
                  >
                    <div className={`flex items-center justify-center h-10 w-10 rounded-lg ${action.bg} ${action.color}`}>
                      <action.icon className="h-5 w-5" />
                    </div>
                    <div className="grid gap-1">
                      <p className="text-sm font-medium leading-none">{action.label}</p>
                      <p className="text-xs text-muted-foreground">{action.desc}</p>
                    </div>
                    <ArrowUpRight className="ml-auto h-4 w-4 text-muted-foreground transition group-hover:text-qal-primary" />
                  </button>
                ))}
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </Layout>
  )
}
