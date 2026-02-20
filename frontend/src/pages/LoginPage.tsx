import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'

type UserRole = 'client' | 'contractor' | 'supplier-materials'

const roleOptions: Array<{ id: UserRole; label: string; icon: string }> = [
  { id: 'client', label: 'Клиент', icon: 'person' },
  { id: 'contractor', label: 'Подрядчик', icon: 'engineering' },
  { id: 'supplier-materials', label: 'Поставщик', icon: 'inventory_2' }
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
    <div className="relative min-h-screen overflow-hidden bg-[#f7fafc] px-6 py-8 text-slate-900">
      <div className="magic-grid absolute inset-0 opacity-70" />
      <div className="magic-orb absolute -left-20 top-0 h-80 w-80 rounded-full bg-cyan-300/40" />
      <div className="magic-orb absolute -right-16 bottom-0 h-96 w-96 rounded-full bg-blue-300/35" />

      <div className="relative z-10 mx-auto w-full max-w-6xl">
        <header className="mx-auto mb-10 flex max-w-5xl items-center justify-between gap-4">
          <Link to="/" className="font-['Sora'] text-xl font-semibold tracking-tight">
            Qal<span className="text-cyan-600">.ai</span>
          </Link>
          <Link
            to="/register"
            className="rounded-xl border border-slate-300/70 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-400 hover:text-cyan-700"
          >
            Создать аккаунт
          </Link>
        </header>

        <main className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="magic-card rounded-3xl p-7 md:p-10">
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-300/70 bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-800">
              <span className="inline-block h-2 w-2 rounded-full bg-cyan-500" />
              Secure access
            </p>

            <h1 className="mt-5 font-['Sora'] text-3xl font-semibold leading-tight md:text-5xl">
              Вход в экосистему
              <span className="magic-gradient-text block bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 bg-clip-text text-transparent">
                Qal.ai
              </span>
            </h1>

            <p className="mt-4 max-w-lg text-sm leading-relaxed text-slate-600 md:text-base">
              После входа мы вернем вас к сценарию, который вы выбрали на гостевой странице.
            </p>

            {from && (
              <div className="mt-6 rounded-2xl border border-cyan-300/80 bg-cyan-50 px-4 py-3 text-sm text-cyan-900">
                Продолжим с маршрута: <span className="font-semibold">{from}</span>
              </div>
            )}

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {roleOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setRole(option.id)}
                  className={`rounded-2xl border px-3 py-3 text-center transition ${
                    role === option.id
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-cyan-400 hover:text-cyan-700'
                  }`}
                >
                  <span className="material-symbols-outlined mb-1 block text-[20px]">{option.icon}</span>
                  <span className="text-xs font-semibold">{option.label}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="magic-card rounded-3xl p-7 md:p-9">
            <h2 className="font-['Sora'] text-2xl font-semibold tracking-tight">Авторизация</h2>
            <p className="mt-2 text-sm text-slate-600">Введите данные аккаунта для продолжения.</p>

            {error && (
              <div className="mt-5 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Пароль</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? 'Входим...' : 'Войти'}
              </button>
            </form>

            <p className="mt-6 text-sm text-slate-600">
              Нет аккаунта?{' '}
              <Link to="/register" className="font-semibold text-cyan-700 hover:text-cyan-800">
                Зарегистрироваться
              </Link>
            </p>
          </section>
        </main>
      </div>
    </div>
  )
}
