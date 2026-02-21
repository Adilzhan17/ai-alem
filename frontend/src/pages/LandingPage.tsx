import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'

const featureCards = [
  {
    title: 'Умный поиск по рынку',
    description: 'Фильтры по району, бюджету и комнатности с фокусом на реальный спрос.',
    action: '/search',
    icon: 'search'
  },
  {
    title: 'Оценка ремонта и смет',
    description: 'Быстрый расчет стоимости с разбивкой по видам работ и материалам.',
    action: '/estimate',
    icon: 'calculate'
  },
  {
    title: 'Подрядчики и поставщики',
    description: 'Создание RFQ и сбор предложений в одном интерфейсе.',
    action: '/contractors',
    icon: 'engineering'
  },
  {
    title: 'AI Брокер',
    description: 'Ассистент для выбора локации, планирования бюджета и сравнения вариантов.',
    action: '/broker',
    icon: 'smart_toy'
  }
]

const entryCards = [
  {
    title: 'Гость',
    description: 'Открытый просмотр витрины и модулей без регистрации.',
    icon: 'travel_explore',
    mode: 'guest' as const
  },
  {
    title: 'Подрядчик',
    description: 'Вход в панель подрядчика с заявками и коммерческими предложениями.',
    icon: 'engineering',
    route: '/contractor',
    mode: 'auth' as const
  },
  {
    title: 'Застройщик / Заказчик',
    description: 'Управление проектами, сметами и подрядчиками в одном кабинете.',
    icon: 'apartment',
    route: '/dashboard',
    mode: 'auth' as const
  }
]

export default function LandingPage() {
  const navigate = useNavigate()
  const { isAuthenticated, user, logout } = useAuth()

  const handleProtectedAction = (route: string) => {
    if (isAuthenticated) {
      navigate(route)
      return
    }
    navigate('/login', { state: { from: route } })
  }

  const handleEntryCardClick = (card: typeof entryCards[number]) => {
    if (card.mode === 'guest') {
      document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
      return
    }
    if (card.route) handleProtectedAction(card.route)
  }

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f7fafc] text-slate-900">
      <div className="magic-grid absolute inset-0 opacity-70" />
      <div className="magic-orb absolute -left-24 top-0 h-80 w-80 rounded-full bg-cyan-300/50" />
      <div className="magic-orb absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-blue-300/40" />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col px-4 pb-[calc(7.5rem+env(safe-area-inset-bottom))] pt-4 sm:px-6 md:pb-16 md:pt-6 lg:px-10">
        <header className="magic-card sticky top-4 z-20 mb-14 flex items-center justify-between gap-4 rounded-2xl px-4 py-3">
          <Link to="/" className="font-['Sora'] text-lg font-semibold tracking-tight">
            Qal<span className="text-cyan-600">.ai</span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
            <a href="#features" className="transition hover:text-slate-900">Возможности</a>
            <a href="#flow" className="transition hover:text-slate-900">Как работает</a>
            <a href="#cta" className="transition hover:text-slate-900">Старт</a>
          </nav>

          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => handleProtectedAction('/dashboard')}
                  className="rounded-xl border border-slate-300/70 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-400 hover:text-cyan-700"
                >
                  {user?.full_name?.split(' ')[0] || 'Кабинет'}
                </button>
                <button
                  onClick={logout}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                >
                  Выйти
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-xl border border-slate-300/70 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-400 hover:text-cyan-700 sm:px-4"
                >
                  Войти
                </Link>
                <Link
                  to="/register"
                  className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 sm:px-4"
                >
                  Регистрация
                </Link>
              </>
            )}
          </div>
        </header>

        <section className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/60 bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-800">
              <span className="inline-block h-2 w-2 rounded-full bg-cyan-500" />
              AI Marketplace для недвижимости
            </p>

            <h1 className="mb-5 font-['Sora'] text-4xl font-semibold leading-tight md:text-6xl">
              Выбор жилья, ремонт и подрядчики
              <span className="magic-gradient-text block bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 bg-clip-text text-transparent">
                в одном потоке решений
              </span>
            </h1>

            <p className="max-w-xl text-base leading-relaxed text-slate-600 md:text-lg">
              Гостевой режим показывает платформу сразу. Как только начинаешь действие
              с данными и расчетами, мы переводим в авторизацию и продолжаем с нужного шага.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                onClick={() => handleProtectedAction('/search')}
                className="rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:-translate-y-0.5 hover:bg-slate-700"
              >
                Начать подбор квартиры
              </button>
              <button
                onClick={() => handleProtectedAction('/estimate')}
                className="rounded-2xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-cyan-400 hover:text-cyan-700"
              >
                Рассчитать ремонт
              </button>
            </div>
          </div>

          <div className="magic-card relative overflow-hidden rounded-3xl p-6 md:p-8">
            <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-cyan-300/40 blur-2xl" />
            <div className="absolute -bottom-20 -left-14 h-40 w-40 rounded-full bg-blue-300/40 blur-2xl" />

            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Live Journey</p>
            <div className="space-y-3">
              {[
                '1. Гость открывает платформу и изучает сценарии',
                '2. Нажимает “Подобрать” или “Оценить”',
                '3. Быстрый вход / регистрация',
                '4. Возврат в нужный модуль без потери шага'
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-white/80 bg-white/70 px-4 py-3 text-sm text-slate-700 shadow-sm">
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-white p-3 text-center shadow-sm">
                <p className="font-['Sora'] text-xl font-semibold text-slate-900">360°</p>
                <p className="text-xs text-slate-500">туры</p>
              </div>
              <div className="rounded-2xl bg-white p-3 text-center shadow-sm">
                <p className="font-['Sora'] text-xl font-semibold text-slate-900">AI</p>
                <p className="text-xs text-slate-500">брокер</p>
              </div>
              <div className="rounded-2xl bg-white p-3 text-center shadow-sm">
                <p className="font-['Sora'] text-xl font-semibold text-slate-900">RFQ</p>
                <p className="text-xs text-slate-500">тендеры</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-4 md:grid-cols-3">
          {entryCards.map((card) => (
            <button
              key={card.title}
              onClick={() => handleEntryCardClick(card)}
              className="magic-card group rounded-3xl p-5 text-left transition hover:-translate-y-1 hover:border-cyan-300/80"
            >
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
                <span className="material-symbols-outlined text-[20px]">{card.icon}</span>
              </div>
              <h3 className="font-['Sora'] text-lg font-semibold text-slate-900">{card.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{card.description}</p>
              <p className="mt-4 inline-flex items-center text-xs font-semibold uppercase tracking-[0.12em] text-cyan-700">
                {card.mode === 'guest' ? 'Открыть витрину' : 'Войти в кабинет'}
                <span className="material-symbols-outlined ml-1 text-[16px] transition group-hover:translate-x-1">arrow_forward</span>
              </p>
            </button>
          ))}
        </section>

        <section id="features" className="mt-20">
          <div className="mb-6">
            <h2 className="font-['Sora'] text-3xl font-semibold tracking-tight">Ключевые модули платформы</h2>
            <p className="mt-2 text-slate-600">Интерактивные действия доступны после входа, гостевая витрина остается открытой.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {featureCards.map((card) => (
              <button
                key={card.title}
                onClick={() => handleProtectedAction(card.action)}
                className="magic-card group rounded-3xl p-6 text-left transition hover:-translate-y-1 hover:border-cyan-300/80"
              >
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white">
                  <span className="material-symbols-outlined text-[20px]">{card.icon}</span>
                </div>
                <h3 className="font-['Sora'] text-xl font-semibold text-slate-900">{card.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{card.description}</p>
                <p className="mt-4 inline-flex items-center text-sm font-semibold text-cyan-700">
                  Открыть модуль
                  <span className="material-symbols-outlined ml-1 text-[18px] transition group-hover:translate-x-1">arrow_forward</span>
                </p>
              </button>
            ))}
          </div>
        </section>

        <section id="flow" className="mt-20 grid gap-4 md:grid-cols-3">
          {[
            { title: 'Гостевая витрина', text: 'Пользователь видит value платформы до регистрации.' },
            { title: 'Авторизация по действию', text: 'Логин вызывается в момент, когда нужно сохранять прогресс.' },
            { title: 'Возврат в контекст', text: 'После входа система возвращает туда, откуда началось действие.' }
          ].map((item) => (
            <div key={item.title} className="magic-card rounded-2xl p-5">
              <h3 className="font-['Sora'] text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{item.text}</p>
            </div>
          ))}
        </section>

        <section id="cta" className="mt-16">
          <div className="magic-card rounded-3xl bg-gradient-to-r from-slate-900 to-slate-700 p-8 text-white">
            <h2 className="font-['Sora'] text-3xl font-semibold">Начнем с первого сценария?</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-200">
              Выбери модуль, и мы переведем в авторизацию только в точке, где это действительно нужно.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => handleProtectedAction('/projects')}
                className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                Перейти к проектам
              </button>
              <Link
                to="/register"
                className="rounded-xl border border-white/40 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Создать аккаунт
              </Link>
            </div>
          </div>
        </section>
      </div>

      {!isAuthenticated && (
        <nav className="fixed inset-x-2 bottom-2 z-40 rounded-3xl border border-slate-700/60 bg-black/92 px-2 pb-[calc(0.55rem+env(safe-area-inset-bottom))] pt-2 shadow-2xl shadow-black/40 backdrop-blur md:hidden">
          <div className="grid grid-cols-5 items-end gap-1 text-white">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex flex-col items-center gap-1 rounded-2xl px-1 py-1 text-[11px] font-semibold text-white/95 transition hover:bg-white/10"
            >
              <span className="material-symbols-outlined text-[22px]">home</span>
              <span>Главная</span>
            </button>

            <button
              onClick={() => scrollToSection('features')}
              className="flex flex-col items-center gap-1 rounded-2xl px-1 py-1 text-[11px] font-semibold text-white/85 transition hover:bg-white/10"
            >
              <span className="material-symbols-outlined text-[22px]">groups</span>
              <span>Роли</span>
            </button>

            <button
              onClick={() => navigate('/register')}
              className="-mt-4 flex flex-col items-center gap-1"
            >
              <span className="rounded-2xl border border-cyan-300/70 bg-white px-4 py-2.5 text-black shadow-[4px_0_0_0_rgba(34,211,238,0.85),-4px_0_0_0_rgba(244,63,94,0.85)] transition hover:scale-105">
                <span className="material-symbols-outlined text-[24px] font-bold">add</span>
              </span>
              <span className="text-[10px] font-semibold text-white/80">Старт</span>
            </button>

            <button
              onClick={() => handleProtectedAction('/requests')}
              className="flex flex-col items-center gap-1 rounded-2xl px-1 py-1 text-[11px] font-semibold text-white/85 transition hover:bg-white/10"
            >
              <span className="material-symbols-outlined text-[22px]">chat_bubble</span>
              <span>Входящие</span>
            </button>

            <button
              onClick={() => handleProtectedAction('/profile')}
              className="flex flex-col items-center gap-1 rounded-2xl px-1 py-1 text-[11px] font-semibold text-white/85 transition hover:bg-white/10"
            >
              <span className="material-symbols-outlined text-[22px]">person</span>
              <span>Профиль</span>
            </button>
          </div>
        </nav>
      )}
    </div>
  )
}
