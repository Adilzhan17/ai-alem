import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'

type UserRole = 'client' | 'contractor' | 'supplier-materials'

const roleOptions: Array<{ id: UserRole; label: string; icon: string; hint: string }> = [
  { id: 'client', label: 'Застройщик / Заказчик', icon: 'apartment', hint: 'Проекты, сметы и контроль подрядчиков' },
  { id: 'contractor', label: 'Подрядчик', icon: 'engineering', hint: 'Заявки, сроки и коммерческие предложения' },
  { id: 'supplier-materials', label: 'Поставщик', icon: 'inventory_2', hint: 'Каталог материалов и ответы на запросы' }
]

const getHomeRouteByRole = (role?: UserRole) => {
  if (role === 'contractor') return '/contractor'
  if (role === 'supplier-materials') return '/supplier'
  return '/dashboard'
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('client')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const { login, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = useMemo(() => {
    const state = location.state as { from?: string } | undefined
    if (!state?.from || state.from === '/login' || state.from === '/register') return ''
    return state.from
  }, [location.state])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('username', email)
      formData.append('password', password)

      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        body: formData
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || 'Неверные данные для входа')
      }

      const data = await res.json()
      login(data.access_token, data.user)

      if (data.user?.role && data.user.role !== role) {
        logout()
        throw new Error(`Ваша роль: ${data.user.role}. Вы выбрали: ${role}.`)
      }

      navigate(from || getHomeRouteByRole(data.user?.role), { replace: true })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-qal-bg px-4 py-6 text-qal-text-primary md:px-8 md:py-8">
      <div className="magic-grid absolute inset-0 opacity-45" />
      <div className="magic-orb absolute -left-20 top-0 h-72 w-72 rounded-full bg-cyan-300/35" />
      <div className="magic-orb absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-indigo-300/30" />

      <div className="relative z-10 mx-auto w-full max-w-6xl">
        <header className="mx-auto mb-8 flex max-w-6xl items-center justify-between gap-3 rounded-2xl border border-qal-border bg-qal-surface px-4 py-3">
          <Link to="/" className="font-['Sora'] text-lg font-semibold tracking-tight">
            Qal<span className="text-qal-primary">.ai</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="rounded-xl border border-qal-border bg-qal-bg px-4 py-2 text-sm font-semibold text-qal-text-secondary transition hover:border-qal-primary/50 hover:text-qal-primary"
            >
              Гостевой режим
            </Link>
            <Link
              to="/register"
              className="rounded-xl bg-qal-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-qal-primary-dark"
            >
              Создать аккаунт
            </Link>
          </div>
        </header>

        <main className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="magic-card rounded-3xl p-6 md:p-8">
            <p className="inline-flex items-center gap-2 rounded-full border border-qal-primary/30 bg-qal-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-qal-primary">
              <span className="inline-block h-2 w-2 rounded-full bg-qal-primary" />
              Secure Access
            </p>

            <h1 className="mt-4 font-['Sora'] text-3xl font-semibold leading-tight md:text-5xl">
              Вход в платформу
              <span className="magic-gradient-text block bg-gradient-to-r from-qal-primary via-indigo-500 to-cyan-500 bg-clip-text text-transparent">
                Qal.ai Enterprise
              </span>
            </h1>

            <p className="mt-4 max-w-lg text-sm leading-relaxed text-qal-text-secondary md:text-base">
              Выберите рабочую роль и продолжите сценарий без потери шага.
            </p>

            {from && (
              <div className="mt-5 rounded-2xl border border-qal-primary/30 bg-qal-primary/10 px-4 py-3 text-sm text-qal-text-primary">
                Продолжим маршрут: <span className="font-semibold">{from}</span>
              </div>
            )}

            <div className="mt-6 grid gap-3">
              {roleOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setRole(option.id)}
                  className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                    role === option.id
                      ? 'border-qal-primary bg-qal-primary text-white shadow-lg shadow-qal-primary/25'
                      : 'border-qal-border bg-white/80 text-qal-text-primary hover:border-qal-primary/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-[20px]">{option.icon}</span>
                    <div>
                      <p className="text-sm font-semibold">{option.label}</p>
                      <p className={`mt-1 text-xs ${role === option.id ? 'text-white/80' : 'text-qal-text-secondary'}`}>{option.hint}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="magic-card rounded-3xl p-6 md:p-8">
            <h2 className="font-['Sora'] text-2xl font-semibold tracking-tight">Авторизация</h2>
            <p className="mt-2 text-sm text-qal-text-secondary">Введите данные аккаунта для продолжения.</p>

            {error && (
              <div className="mt-5 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-qal-text-secondary">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-qal-border bg-white px-4 py-3 text-sm text-qal-text-primary outline-none transition focus:border-qal-primary"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-qal-text-secondary">Пароль</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-qal-border bg-white px-4 py-3 text-sm text-qal-text-primary outline-none transition focus:border-qal-primary"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-qal-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-qal-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? 'Входим...' : 'Войти в кабинет'}
              </button>
            </form>

            <p className="mt-6 text-sm text-qal-text-secondary">
              Нет аккаунта?{' '}
              <Link to="/register" className="font-semibold text-qal-primary hover:text-qal-primary-dark">
                Зарегистрироваться
              </Link>
            </p>
          </section>
        </main>
      </div>
    </div>
  )
}
