import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../LanguageContext'
import { useAuth } from '../AuthContext'
import Layout from '../components/Layout'
import { toast } from 'sonner'

export default function SearchPage() {
    const [query, setQuery] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()
    const { t } = useLanguage()
    const { token } = useAuth()

    const handleAnalyze = async (customQuery?: string) => {
        const textToAnalyze = customQuery || query
        if (!textToAnalyze.trim()) return

        setLoading(true)
        try {
            const res = await fetch('/api/v1/search/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ prompt: textToAnalyze }),
            })

            if (!res.ok) throw new Error('Search failed')

            const data = await res.json()
            navigate('/results', { state: { query: textToAnalyze, results: data } })
        } catch (error) {
            console.error(error)
            navigate('/results', { state: { query: textToAnalyze, results: null } })
        } finally {
            setLoading(false)
        }
    }

    const suggestions = [
        { icon: 'location_city', title: 'Найди землю под коммерцию в Астане', sub: 'С ROI выше 5%' },
        { icon: 'calculate', title: 'Рассчитай стоимость ремонта', sub: 'Для офиса 200м²' },
        { icon: 'trending_up', title: 'Анализ трендов рынка Q1 2024', sub: 'Цены на новостройки Алматы' },
        { icon: 'compare_arrows', title: 'Сравни ЖК в Есильском районе', sub: 'BI Village vs. Nura City' },
    ]

    return (
        <Layout activePage="dashboard">
            <div className="h-full flex flex-col items-center justify-center p-6 w-full max-w-5xl mx-auto">
                <div className="w-full flex flex-col items-center gap-6 md:gap-8 -mt-10 md:-mt-20">
                    {/* Hero */}
                    <div className="text-center space-y-4 animate-in fade-in slide-in-from-top-4 duration-700">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-qal-primary/10 border border-qal-primary/20 rounded-full text-[10px] font-bold text-qal-primary uppercase tracking-[0.2em] mb-2">
                            System Architecture · Real Estate AI
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-qal-text-primary tracking-tight leading-tight">
                            Управляйте недвижимостью <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-qal-primary to-qal-primary-light">силой интеллекта</span>
                        </h2>
                        <p className="text-qal-text-secondary text-base md:text-lg max-w-2xl mx-auto">{t('heroSub')}</p>
                    </div>

                    {/* Input */}
                    <div className="w-full max-w-3xl relative group animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                        <div className="absolute -inset-0.5 bg-qal-primary/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition duration-1000"></div>
                        <div className="relative bg-qal-surface border border-qal-border rounded-3xl shadow-sm overflow-hidden focus-within:border-qal-primary/50 transition-all">
                            <textarea
                                className="w-full bg-transparent text-qal-text-primary placeholder:text-qal-text-secondary/30 border-none focus:ring-0 p-4 md:p-8 min-h-[160px] md:min-h-[180px] text-base md:text-xl resize-none leading-relaxed font-bold"
                                placeholder={t('placeholder')}
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAnalyze() }}
                            />
                            <div className="flex items-center justify-between px-6 pb-6 pt-2 border-t border-qal-border bg-qal-bg/30">
                                <div className="flex items-center gap-2">
                                    <button className="size-10 rounded-xl text-qal-text-secondary hover:text-qal-text-primary hover:bg-qal-primary/5 transition-all flex items-center justify-center" onClick={() => navigate('/blueprint')}>
                                        <span className="material-symbols-outlined text-2xl">upload_file</span>
                                    </button>
                                    <button
                                        className="size-10 rounded-xl text-qal-text-secondary hover:text-qal-text-primary hover:bg-qal-primary/5 transition-all flex items-center justify-center"
                                        onClick={() => toast.info('Голосовой ввод пока не доступен')}
                                    >
                                        <span className="material-symbols-outlined text-2xl">mic</span>
                                    </button>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-[10px] text-qal-text-secondary font-bold uppercase tracking-widest hidden sm:inline-block">Ctrl + Enter для отправки</span>
                                    <button
                                        className="flex items-center gap-3 bg-qal-primary hover:bg-qal-primary-dark text-white px-8 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-qal-primary/20 disabled:opacity-50 hover:scale-105 active:scale-95"
                                        onClick={() => handleAnalyze()}
                                        disabled={loading || !query.trim()}
                                    >
                                        <span className="material-symbols-outlined text-xl rotate-[-45deg]">send</span>
                                        <span>{loading ? t('analysing') : t('analyze')}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Suggestions */}
                    <div className="w-full max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                        <p className="text-[10px] font-bold text-qal-text-secondary uppercase tracking-[0.2em] mb-6 ml-2 italic">Рекомендуемые сценарии</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {suggestions.map((s, i) => (
                                <button key={i} className="flex items-start gap-4 p-5 rounded-2xl border border-qal-border bg-qal-surface hover:bg-qal-primary/5 hover:border-qal-primary/40 transition-all group text-left shadow-sm overflow-hidden relative"
                                    onClick={() => handleAnalyze(s.title)}>
                                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
                                        <span className="material-symbols-outlined text-4xl text-qal-primary">{s.icon}</span>
                                    </div>
                                    <div className="size-10 rounded-xl bg-qal-primary/10 border border-qal-primary/20 flex items-center justify-center text-qal-primary shrink-0 transition-transform group-hover:scale-110">
                                        <span className="material-symbols-outlined text-2xl">{s.icon}</span>
                                    </div>
                                    <div>
                                        <span className="block text-sm text-qal-text-primary font-bold group-hover:text-qal-primary transition-colors mb-0.5">{s.title}</span>
                                        <span className="block text-[11px] text-qal-text-secondary font-bold uppercase tracking-widest opacity-60 tabular-nums">{s.sub}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    )
}
