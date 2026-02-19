import { useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { useLanguage } from '../LanguageContext'
import MapComponent from '../components/MapComponent'

export default function ResultsPage() {
    const location = useLocation()
    const navigate = useNavigate()
    const { t } = useLanguage()
    const state = location.state as { query?: string; results?: any } | null
    const [selectedId, setSelectedId] = useState<number | null>(null)
    const [viewMode, setViewMode] = useState<'map' | 'details'>('map')

    const [fetchedResults, setFetchedResults] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    const urlQuery = new URLSearchParams(location.search).get('q') || ''
    const queryText = state?.query || urlQuery || 'Все объекты'

    const getCityCenter = (query: string): [number, number] | undefined => {
        const q = query.toLowerCase()
        if (q.includes('алмат') || q.includes('almaty')) return [76.945, 43.238]
        if (q.includes('астан') || q.includes('astana') || q.includes('нур-султан') || q.includes('nursultan')) return [71.449, 51.169]
        if (q.includes('шымкент') || q.includes('shymkent')) return [69.589, 42.317]
        return undefined
    }

    useEffect(() => {
        const prompt = state?.query || urlQuery || ''

        // If no results passed from navigation, fetch by query (or all listings if empty)
        if (!state?.results?.results) {
            setLoading(true)
            const token = localStorage.getItem('auth_token')
            fetch('/api/v1/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ prompt })
            })
                .then(res => res.json())
                .then(data => {
                    const results = data.results || [];
                    setFetchedResults(results)
                    if (results.length > 0) {
                        setSelectedId(results[0].id)
                    }
                })
                .catch(err => {
                    console.error(err);
                    setFetchedResults([]);
                    setSelectedId(null);
                })
                .finally(() => setLoading(false))
        } else if (state.results.results.length > 0 && !selectedId) {
            setSelectedId(state.results.results[0].id)
        }
    }, [location.search, state?.query, state?.results])

    const filteredResults = fetchedResults.length > 0
        ? fetchedResults.filter((item: any) => {
            if (queryText === 'Все объекты' || !queryText) return true;
            const lowerQuery = queryText.toLowerCase();
            const lowerDistrict = (item.district || '').toLowerCase();

            if (lowerQuery.includes('астана') && !lowerDistrict.includes('astana')) return false;
            if (lowerQuery.includes('алматы') && !lowerDistrict.includes('almaty')) return false;
            if (lowerQuery.includes('шымкент') && !lowerDistrict.includes('shymkent')) return false;
            if (lowerQuery.includes('атырау') && !lowerDistrict.includes('atyrau')) return false;
            if (lowerQuery.includes('актобе') && !lowerDistrict.includes('aktobe')) return false;
            if (lowerQuery.includes('сделать') || lowerQuery.includes('инвест')) return true;

            const lowerTitle = item.title.toLowerCase();
            return lowerTitle.includes(lowerQuery) || lowerDistrict.includes(lowerQuery);
        })
        : [];

    const displayResults = state?.results?.results || (filteredResults.length > 0 ? filteredResults : fetchedResults);
    const selectedProperty = displayResults.find((p: any) => p.id === selectedId) || (displayResults.length > 0 ? displayResults[0] : null)
    const [show3D, setShow3D] = useState(false)

    const cityCenter = getCityCenter(queryText)
    const mapCenter = selectedProperty?.latitude && selectedProperty?.longitude
        ? [selectedProperty.longitude, selectedProperty.latitude] as [number, number]
        : cityCenter

    return (
        <Layout activePage="results">
            {show3D && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-8 animate-in fade-in duration-300">
                    <div className="bg-surface-dark border border-border-dark rounded-3xl w-full max-w-6xl h-[80vh] flex flex-col relative overflow-hidden shadow-2xl">
                        <div className="flex justify-between items-center p-6 border-b border-border-dark bg-sidebar-dark">
                            <h3 className="text-xl font-bold text-white flex items-center gap-3">
                                <span className="material-symbols-outlined text-primary">view_in_ar</span>
                                3D Тур: {selectedProperty?.title}
                            </h3>
                            <button onClick={() => setShow3D(false)} className="size-10 rounded-full flex items-center justify-center hover:bg-white/10 text-slate-400 hover:text-white transition-all">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="flex-1 bg-black relative">
                            <iframe
                                title="3D Viewer"
                                src="https://sketchfab.com/models/50c8e0300401449080277344933a3915/embed?autostart=1&ui_controls=1&ui_infos=0&ui_inspector=0&ui_stop=0&ui_watermark=0&ui_watermark_link=0"
                                className="size-full border-0"
                                allow="autoplay; fullscreen; vr"
                            />
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col h-full overflow-hidden bg-qal-bg">
                <div className="bg-qal-surface/80 backdrop-blur-md border-b border-qal-border px-4 md:px-8 py-4 shrink-0 flex items-center justify-between gap-3 md:gap-6 z-20 shadow-sm">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="size-10 rounded-xl bg-qal-primary/10 flex items-center justify-center text-qal-primary border border-qal-primary/20">
                            <span className="material-symbols-outlined text-2xl">auto_awesome</span>
                        </div>
                        <div className="flex flex-col truncate">
                            <span className="text-[10px] text-qal-text-secondary font-bold uppercase tracking-[0.2em]">{t('currentQuery')}</span>
                            <p className="text-sm font-semibold text-qal-text-primary truncate italic">"{queryText}"</p>
                        </div>
                    </div>
                    <button className="flex items-center gap-2 px-4 md:px-5 py-2.5 bg-qal-surface hover:bg-qal-bg border border-qal-border rounded-xl text-qal-text-primary text-[10px] md:text-xs font-bold transition-all shadow-sm active:scale-95" onClick={() => navigate('/broker', { state: { query: queryText } })}>
                        <span className="material-symbols-outlined text-[18px]">edit_note</span>
                        {t('refinePrompt')}
                    </button>
                </div>

                <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                    <section className="w-full lg:w-[450px] shrink-0 flex flex-col border-r border-qal-border bg-qal-bg/30 z-10 overflow-hidden max-lg:border-r-0 max-lg:border-b">
                        <div className="px-4 md:px-6 py-4 border-b border-qal-border flex items-center justify-between bg-qal-surface/40">
                            <div>
                                <h3 className="text-qal-text-primary font-bold text-sm tracking-tight">{displayResults.length} объектов найдено</h3>
                                <p className="text-[10px] text-qal-text-secondary font-bold tracking-widest uppercase">Системное соответствие {selectedProperty?.match_score || 0}%</p>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar scroll-smooth max-lg:max-h-[45vh]">
                            {loading ? (
                                <div className="flex items-center justify-center p-12">
                                    <div className="size-8 border-2 border-qal-primary border-t-white/20 rounded-full animate-spin"></div>
                                </div>
                            ) : displayResults.map((p: any) => (
                                <div
                                    key={p.id}
                                    onClick={() => setSelectedId(p.id)}
                                    className={`group relative p-4 rounded-2xl border transition-all cursor-pointer ${selectedId === p.id ? 'bg-qal-primary/5 border-qal-primary/30 shadow-sm' : 'bg-qal-surface border-qal-border hover:border-qal-text-secondary/30 hover:bg-qal-bg/50'}`}
                                >
                                    <div className="flex gap-4">
                                        <div className="size-20 shrink-0 rounded-xl overflow-hidden border border-qal-border shadow-inner">
                                            <img src={p.image_url} alt="" className="size-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                        </div>
                                        <div className="flex-1 min-w-0 flex flex-col">
                                            <div className="flex justify-between items-start gap-2 mb-1">
                                                <h4 className={`text-sm font-bold truncate ${selectedId === p.id ? 'text-qal-primary' : 'text-qal-text-primary'}`}>{p.title}</h4>
                                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${p.match_score > 90 ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-qal-primary/10 text-qal-primary border-qal-primary/20'}`}>
                                                    {p.match_score}%
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-qal-text-secondary mb-2">
                                                <span className="material-symbols-outlined text-xs">location_on</span>
                                                <span className="text-[11px] font-medium truncate italic">{p.district}</span>
                                            </div>
                                            <div className="mt-auto flex items-end justify-between">
                                                <span className="text-base font-black text-qal-text-primary leading-tight">₸{(p.price / 1000000).toFixed(1)}M</span>
                                                <div className="flex gap-2">
                                                    <span className="text-[10px] font-bold text-qal-text-secondary bg-qal-bg/50 px-2 py-0.5 rounded border border-qal-border">{p.rooms} спальни</span>
                                                    <span className="text-[10px] font-bold text-qal-text-secondary bg-qal-bg/50 px-2 py-0.5 rounded border border-qal-border">{p.area}м²</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <div className="flex-1 relative flex flex-col bg-qal-bg min-h-[45vh] lg:min-h-0">
                        <div className="absolute top-4 md:top-6 left-1/2 -translate-x-1/2 z-20 bg-qal-surface/90 backdrop-blur-md p-1.5 rounded-2xl border border-qal-border shadow-xl flex gap-1 items-center">
                            <button onClick={() => setViewMode('map')} className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all ${viewMode === 'map' ? 'bg-qal-primary text-white shadow-sm' : 'text-qal-text-secondary hover:text-qal-text-primary'}`}>
                                <span className="material-symbols-outlined text-lg">map</span>
                                Карта
                            </button>
                            <button onClick={() => setViewMode('details')} className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all ${viewMode === 'details' ? 'bg-qal-primary text-white shadow-sm' : 'text-qal-text-secondary hover:text-qal-text-primary'}`}>
                                <span className="material-symbols-outlined text-lg">info</span>
                                Детали
                            </button>
                        </div>

                        {viewMode === 'map' ? (
                            <div className="size-full">
                                <MapComponent
                                    items={displayResults.map((r: any) => ({
                                        id: r.id,
                                        title: r.title,
                                        latitude: r.latitude,
                                        longitude: r.longitude,
                                        price: r.price
                                    }))}
                                    center={mapCenter}
                                    onItemClick={(id) => setSelectedId(id)}
                                />
                            </div>
                        ) : (
                            <div className="size-full overflow-y-auto p-12 custom-scrollbar animate-in fade-in duration-500">
                                {selectedProperty ? (
                                    <div className="max-w-4xl mx-auto space-y-12 pb-24">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-full w-fit text-[10px] font-bold uppercase tracking-widest">
                                                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                Доступен для сделки
                                            </div>
                                            <h2 className="text-5xl font-black text-qal-text-primary leading-tight">{selectedProperty.title}</h2>
                                            <div className="flex items-center gap-4 text-qal-text-secondary font-medium">
                                                <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-qal-primary">location_on</span> {selectedProperty.district}</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-8">
                                            <div className="aspect-[4/3] col-span-2 rounded-3xl overflow-hidden shadow-xl border border-qal-border relative group">
                                                <img src={selectedProperty.image_url} alt="" className="size-full object-cover" />
                                                <div className="absolute inset-0 bg-qal-text-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <button onClick={() => setShow3D(true)} className="px-8 py-3 bg-white text-qal-text-primary hover:bg-qal-bg rounded-full text-sm font-bold shadow-2xl transition-all active:scale-95 flex items-center gap-2">
                                                        <span className="material-symbols-outlined">view_in_ar</span>
                                                        Смотреть 3D Тур
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-6">
                                                <div className="bg-qal-surface p-8 rounded-3xl border border-qal-border flex flex-col gap-8 shadow-sm">
                                                    <div>
                                                        <span className="text-qal-text-secondary text-xs font-bold uppercase tracking-widest block mb-1">Оценочная стоимость</span>
                                                        <span className="text-4xl font-black text-qal-text-primary">₸{(selectedProperty.price / 1000000).toFixed(1)} млн</span>
                                                    </div>
                                                    <button className="w-full py-4 bg-qal-primary hover:bg-qal-primary-dark text-white font-bold rounded-2xl shadow-lg shadow-qal-primary/20 transition-all active:scale-95 flex items-center justify-center gap-3" onClick={() => navigate('/estimate', { state: { geometry: { total_area: selectedProperty.area } } })}>
                                                        <span className="material-symbols-outlined">rocket_launch</span>
                                                        Рассчитать смету
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-qal-text-secondary italic">Выберите объект для просмотра деталей</div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    )
}
