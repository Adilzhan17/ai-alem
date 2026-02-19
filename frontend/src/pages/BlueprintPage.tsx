import { useNavigate } from 'react-router-dom'
import { useState, useRef } from 'react'
import Layout from '../components/Layout'
import { useLanguage } from '../LanguageContext'
import { useAuth } from '../AuthContext'

export default function BlueprintPage() {
    const navigate = useNavigate()
    const { t } = useLanguage()
    const { token } = useAuth()
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [analysisProgress, setAnalysisProgress] = useState(0)
    const [currentFile, setCurrentFile] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setCurrentFile(file.name)
        setIsAnalyzing(true)
        setAnalysisProgress(10)

        const formData = new FormData()
        formData.append('file', file)

        try {
            const progressInterval = setInterval(() => {
                setAnalysisProgress(prev => (prev < 90 ? prev + 3 : prev))
            }, 400)

            const res = await fetch('/api/v1/cv/analyze-plan', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            })

            clearInterval(progressInterval)
            setAnalysisProgress(100)

            if (!res.ok) throw new Error('Upload failed')

            const data = await res.json()

            // Artificial delay for "Finalizing" feel
            setTimeout(() => {
                navigate('/estimate', { state: { result: data } })
            }, 800)
        } catch (error) {
            console.error(error)
            setIsAnalyzing(false)
        }
    }

    return (
        <Layout activePage="blueprints">
            <div className="flex flex-col h-full overflow-hidden relative bg-qal-bg">
                {/* Visual Decoration */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-qal-primary/5 blur-[150px] pointer-events-none rounded-full" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-qal-primary/5 blur-[120px] pointer-events-none rounded-full" />

                <div className="flex-1 flex overflow-hidden">
                    {/* Left: Upload Zone */}
                    <div className="w-full lg:w-7/12 p-12 flex flex-col justify-center items-center relative z-10">
                        <div className="w-full max-w-2xl flex flex-col items-center">
                            <div className="text-center mb-10">
                                <h3 className="text-4xl font-black text-qal-text-primary mb-4 tracking-tight">{t('dragDropBlueprints')}</h3>
                                <p className="text-qal-text-secondary text-lg max-w-lg mx-auto leading-relaxed">{t('uploadDesc')}</p>
                            </div>

                            <div
                                className="group relative w-full aspect-[16/9] border-2 border-dashed border-qal-border hover:border-qal-primary/50 bg-qal-surface/30 hover:bg-qal-primary/5 rounded-[2.5rem] transition-all duration-500 flex flex-col items-center justify-center p-12 cursor-pointer shadow-sm backdrop-blur-sm"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input className="hidden" type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,.pdf" />

                                <div className="relative">
                                    <div className="size-24 bg-gradient-to-br from-qal-primary to-qal-primary-light rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg shadow-qal-primary/20">
                                        <span className="material-symbols-outlined text-4xl text-white">cloud_upload</span>
                                    </div>
                                    <div className="absolute -top-2 -right-2 size-6 bg-emerald-500 rounded-full border-2 border-qal-surface animate-pulse" />
                                </div>

                                <div className="space-y-4 flex flex-col items-center">
                                    <button className="px-8 py-3.5 bg-qal-primary hover:bg-qal-primary-dark text-white font-bold rounded-2xl transition-all shadow-lg shadow-qal-primary/25 hover:scale-105 active:scale-95">
                                        {t('browseFiles')}
                                    </button>
                                    <p className="text-[10px] text-qal-text-secondary font-black tracking-widest uppercase opacity-60">Макс. размер файла 25 MB</p>
                                </div>

                                <div className="absolute bottom-8 flex gap-4 opacity-40 group-hover:opacity-100 transition-opacity duration-500">
                                    {['.PNG', '.JPG', '.PDF', '.DWG'].map(ext => (
                                        <span key={ext} className="px-3 py-1 rounded-lg bg-qal-bg border border-qal-border text-[10px] font-black text-qal-text-secondary">{ext}</span>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-12 grid grid-cols-3 gap-8 w-full">
                                {[
                                    { icon: 'auto_awesome', title: t('aiAnalysis'), desc: 'Детекция комнат и зон.' },
                                    { icon: 'square_foot', title: t('measurements'), desc: 'Точный расчет площади.' },
                                    { icon: 'bolt', title: t('fastProcessing'), desc: 'Результат за 60 секунд.' },
                                ].map((f, i) => (
                                    <div key={i} className="flex flex-col items-center text-center gap-3 group">
                                        <div className="size-12 rounded-2xl bg-qal-surface border border-qal-border flex items-center justify-center text-qal-primary transition-all group-hover:bg-qal-primary group-hover:text-white group-hover:shadow-lg group-hover:shadow-qal-primary/20">
                                            <span className="material-symbols-outlined">{f.icon}</span>
                                        </div>
                                        <div>
                                            <h4 className="text-qal-text-primary text-sm font-bold mb-1">{f.title}</h4>
                                            <p className="text-qal-text-secondary text-[10px] uppercase font-black tracking-wider leading-relaxed opacity-60">{f.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right: Queue Panel */}
                    <div className="w-full lg:w-5/12 bg-qal-surface border-l border-qal-border flex flex-col h-full shadow-lg z-20">
                        <div className="p-6 border-b border-qal-border flex justify-between items-center bg-qal-bg/30">
                            <div>
                                <h3 className="text-qal-text-primary font-black text-lg tracking-tight">{t('analysisQueue')}</h3>
                                <p className="text-[10px] text-qal-text-secondary font-black uppercase tracking-widest opacity-60">Обработка в реальном времени</p>
                            </div>
                            <span className="size-8 rounded-xl bg-qal-primary/10 text-qal-primary border border-qal-primary/20 flex items-center justify-center text-xs font-bold">{isAnalyzing ? 1 : 0}</span>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 no-scrollbar">
                            {isAnalyzing ? (
                                <div className="bg-qal-bg border border-qal-primary/30 rounded-[2rem] p-8 shadow-inner animate-in zoom-in-95 duration-300">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="size-14 rounded-2xl bg-qal-primary/10 border border-qal-primary/20 flex items-center justify-center text-qal-primary shadow-sm">
                                                <span className="material-symbols-outlined text-3xl">architecture</span>
                                            </div>
                                            <div>
                                                <p className="text-qal-text-primary text-lg font-black truncate max-w-[180px]">{currentFile}</p>
                                                <p className="text-qal-primary text-xs font-bold uppercase tracking-widest">{t('analysing')}...</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="text-3xl font-black text-qal-text-primary">{analysisProgress}%</span>
                                            <div className="flex gap-1">
                                                <div className="size-1.5 bg-qal-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                                                <div className="size-1.5 bg-qal-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                                                <div className="size-1.5 bg-qal-primary rounded-full animate-bounce" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="w-full bg-qal-primary/5 h-3 rounded-full overflow-hidden border border-qal-primary/10 shadow-inner p-0.5">
                                        <div
                                            className="h-full bg-gradient-to-r from-qal-primary to-qal-primary-light rounded-full transition-all duration-500 ease-out shadow-[0_0_15px_rgba(115,23,207,0.2)]"
                                            style={{ width: `${analysisProgress}%` }}
                                        />
                                    </div>
                                    <div className="mt-6 flex flex-col gap-2 p-4 bg-qal-primary/5 rounded-2xl border border-qal-primary/10">
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                            <span className="text-qal-text-secondary opacity-60">Нейронная сеть:</span>
                                            <span className="text-emerald-600">АКТИВНА</span>
                                        </div>
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                            <span className="text-qal-text-secondary opacity-60">Детекция:</span>
                                            <span className="text-qal-text-primary">ПОИСК ГЕОМЕТРИИ...</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center py-12 text-center gap-6 opacity-40">
                                    <div className="size-32 rounded-full border-4 border-dashed border-qal-border flex items-center justify-center">
                                        <span className="material-symbols-outlined text-6xl text-qal-border">analytics</span>
                                    </div>
                                    <div>
                                        <p className="text-qal-text-secondary font-black uppercase tracking-[0.3em] text-[11px] mb-2">{t('noActiveAnalyses')}</p>
                                        <p className="text-qal-text-secondary text-xs max-w-[200px] font-bold leading-relaxed italic opacity-60">Ваши активные задачи появятся здесь после загрузки чертежей</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer Activity Mock */}
                        <div className="mt-auto p-6 border-t border-qal-border bg-qal-bg/30 space-y-4">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-qal-text-secondary opacity-60 px-1">
                                <span>История сессии</span>
                                <span>Всего 0м²</span>
                            </div>
                            <button className="w-full py-4 bg-qal-bg border border-qal-border text-qal-text-secondary text-xs font-black uppercase tracking-[0.2em] rounded-2xl cursor-default opacity-40">
                                Ожидание анализа...
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    )
}
