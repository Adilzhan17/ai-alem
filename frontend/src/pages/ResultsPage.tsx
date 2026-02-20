import { useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { useLanguage } from '../LanguageContext'
import MapComponent from '../components/MapComponent'
import PanoramaViewer, { type PanoramaScene } from '../components/PanoramaViewer'

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
            fetch('/api/v1/search/', {
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
                            {(() => {
                                const panoramas = selectedProperty?.metadata_json?.panoramas as { url: string, title: string }[] | undefined;
                                
                                if (panoramas && panoramas.length > 0) {
                                  const scenes: PanoramaScene[] = panoramas.map((p, i) => ({
                                      id: `scene-${i}`,
                                      title: p.title,
                                      image_url: p.url
                                  }));
                                  return <PanoramaViewer scenes={scenes} height="100%" />;
                                }

                                if (selectedProperty?.image_url) {
                                    return <PanoramaViewer scenes={[{
                                        id: 'main',
                                        title: 'Main View',
                                        image_url: selectedProperty.image_url
                                    }]} height="100%" />;
                                }

                                return <div className="flex items-center justify-center text-white h-full">No panorama available</div>;
                            })()}
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
                                    className={`group relative p-3 rounded-2xl border transition-all cursor-pointer ${selectedId === p.id ? 'bg-white border-qal-primary ring-1 ring-qal-primary shadow-md' : 'bg-white border-gray-100 hover:border-gray-300 hover:shadow-lg'}`}
                                >
                                    <div className="flex gap-4">
                                        <div className="w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-gray-100 relative">
                                            <img src={p.image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                            <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/50 backdrop-blur-md rounded text-[9px] font-bold text-white">
                                                {p.match_score}% match
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                                            <div>
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4 className={`text-sm font-semibold truncate pr-2 ${selectedId === p.id ? 'text-gray-900' : 'text-gray-700'}`}>{p.title}</h4>
                                                    <span className="text-[10px] text-gray-400 shrink-0">{p.rooms} bd</span>
                                                </div>
                                                <div className="flex items-center gap-1 text-gray-500 mb-2">
                                                    <span className="material-symbols-outlined text-[14px]">location_on</span>
                                                    <span className="text-xs truncate">{p.district}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-baseline justify-between">
                                                <span className="text-lg font-bold text-gray-900">₸{(p.price / 1000000).toFixed(1)}M</span>
                                                <div className="text-xs text-gray-500 font-medium bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                                                    {p.area} m²
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
                                    <div className="max-w-5xl mx-auto pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <div className="relative h-[400px] w-full rounded-b-3xl overflow-hidden shadow-2xl mb-8 group">
                                            <img src={selectedProperty.image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                            <div className="absolute bottom-6 left-6 right-6 text-white flex justify-between items-end">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-full">Available</span>
                                                        <span className="px-2 py-0.5 bg-white/20 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest rounded-full border border-white/30">{selectedProperty.match_score}% Match</span>
                                                    </div>
                                                    <h2 className="text-3xl md:text-4xl font-bold leading-tight mb-1 shadow-black/50 drop-shadow-lg">{selectedProperty.title}</h2>
                                                    <p className="text-white/80 font-medium flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-sm">location_on</span>
                                                        {selectedProperty.district}
                                                    </p>
                                                </div>
                                                <button onClick={() => setShow3D(true)} className="px-6 py-2.5 bg-white/10 backdrop-blur-md hover:bg-white text-white hover:text-black rounded-full text-sm font-bold transition-all border border-white/30 flex items-center gap-2">
                                                    <span className="material-symbols-outlined">view_in_ar</span>
                                                    3D Tour
                                                </button>
                                            </div>
                                        </div>

                                        <div className="px-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                                            <div className="lg:col-span-2 space-y-8">
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center hover:border-qal-primary/30 transition-colors">
                                                        <span className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Price</span>
                                                        <span className="text-xl font-bold text-gray-900">₸{(selectedProperty.price / 1000000).toFixed(1)}M</span>
                                                    </div>
                                                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center hover:border-qal-primary/30 transition-colors">
                                                        <span className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Area</span>
                                                        <span className="text-xl font-bold text-gray-900">{selectedProperty.area} m²</span>
                                                    </div>
                                                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center hover:border-qal-primary/30 transition-colors">
                                                        <span className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Rooms</span>
                                                        <span className="text-xl font-bold text-gray-900">{selectedProperty.rooms}</span>
                                                    </div>
                                                </div>

                                                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                                                    <h3 className="text-lg font-bold text-gray-900 mb-4">Description</h3>
                                                    <p className="text-gray-600 leading-relaxed">
                                                        {selectedProperty.description || "No description available for this property."}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-4">
                                                <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
                                                    <div className="absolute top-0 right-0 p-8 opacity-10">
                                                        <span className="material-symbols-outlined text-9xl">rocket_launch</span>
                                                    </div>
                                                    <h3 className="text-lg font-bold mb-1 relative z-10">AI Estimate</h3>
                                                    <p className="text-white/60 text-sm mb-6 relative z-10">Get a detailed renovation estimate for this property instantly.</p>
                                                    <div className="mb-6 relative z-10">
                                                        <span className="text-3xl font-bold">₸42.0 M</span>
                                                        <span className="text-white/40 text-xs block">Estimated cost</span>
                                                    </div>
                                                    <button 
                                                        onClick={() => navigate('/estimate', { state: { geometry: { total_area: selectedProperty.area } } })}
                                                        className="w-full py-3 bg-white text-gray-900 font-bold rounded-xl hover:bg-gray-100 transition-colors relative z-10 flex items-center justify-center gap-2"
                                                    >
                                                        <span className="material-symbols-outlined text-lg">calculate</span>
                                                        Calculate Now
                                                    </button>
                                                </div>

                                                <button className="w-full py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                                                    <span className="material-symbols-outlined">call</span>
                                                    Contact Agent
                                                </button>
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
