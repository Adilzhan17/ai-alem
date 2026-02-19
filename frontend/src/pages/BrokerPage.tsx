import { useNavigate, useLocation } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import Layout from '../components/Layout'
import { useLanguage } from '../LanguageContext'
import { useAuth } from '../AuthContext'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
    Send,
    Trash2,
    Share2,
    Shield,
    Zap,
    Bot,
    User,
    Loader2,
    Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface Message {
    role: 'user' | 'assistant'
    content: string
}

const API = '/api/v1';

export default function BrokerPage() {
    useLanguage()
    const { token, user } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: `Hello ${user?.full_name?.split(' ')[0] || 'there'}! I am your personal AI Broker. I can help you find properties, calculate mortgage payments, or analyze investment opportunities. How can I assist you today?` }
    ])
    const [input, setInput] = useState((location.state as any)?.query || '')
    const [isLoading, setIsLoading] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        if (scrollRef.current) {
            const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollContainer) {
                scrollContainer.scrollTop = scrollContainer.scrollHeight;
            }
        }
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages, isLoading])

    const handleSend = async (customInput?: string) => {
        const textToSend = customInput || input
        if (!textToSend.trim() || isLoading) return

        const userMsg: Message = { role: 'user', content: textToSend }
        setMessages(prev => [...prev, userMsg])
        setInput('')
        setIsLoading(true)

        try {
            const res = await fetch(`${API}/broker/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content }))
                })
            })

            if (!res.ok) throw new Error('Chat failed')

            const data = await res.json()

            // Add Assistant Message
            setMessages(prev => [...prev, { role: 'assistant', content: data.content }])

            // Handle Action (Navigation/Routing)
            if (data.action === 'navigate' && data.route) {
                toast.loading(`AI Agent is navigating to ${data.route}...`, { duration: 2000 })
                setTimeout(() => {
                    navigate(data.route, { state: { ...data.meta, query: textToSend } })
                }, 1500)
            }

        } catch (error) {
            console.error(error)
            toast.error("Failed to connect to AI service. Please try again later.")
            setMessages(prev => [...prev, { role: 'assistant', content: '**Error:** Connection failed. Please ensure the backend is running.' }])
        } finally {
            setIsLoading(false)
        }
    }

    const handleExport = () => {
        const lines = messages.map((m) => `[${m.role.toUpperCase()}] ${m.content}`);
        const content = lines.join('\n\n');
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai_broker_chat_${new Date().toISOString().slice(0, 10)}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const suggestions = [
        '🏙️ Best apartments in Almaty',
        '📉 Mortgage rates 2026',
        '💎 Invest 50M KZT',
        '🏘️ Medeu district prices',
        '📑 Check developer reputation'
    ]

    return (
        <Layout>
            <div className="flex flex-col h-[calc(100vh-theme(spacing.24))] w-full max-w-5xl mx-auto border rounded-xl shadow-sm bg-background overflow-hidden relative px-2 md:px-0">
                {/* Header */}
                <div className="p-4 border-b bg-card/50 backdrop-blur-sm flex items-center justify-between z-10">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                            <Bot className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="font-bold text-lg leading-none">AI Broker</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-[10px] h-4 px-1 border-emerald-500/30 text-emerald-600 bg-emerald-500/5">
                                    <span className="w-1 h-1 rounded-full bg-emerald-500 mr-1 animate-pulse" />
                                    Online
                                </Badge>
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">GPT-4o Engine</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="icon" title="Export Chat" onClick={handleExport}>
                            <Share2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Clear History" onClick={() => setMessages([messages[0]])}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                </div>

                {/* Chat Area */}
                <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                    <div className="space-y-6 pb-4 max-w-3xl mx-auto">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                <Avatar className={`h-8 w-8 ${msg.role === 'assistant' ? 'bg-primary/10' : 'bg-secondary'}`}>
                                    {msg.role === 'assistant' ? (
                                        <AvatarFallback className="text-primary"><Sparkles className="h-4 w-4" /></AvatarFallback>
                                    ) : (
                                        <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                                    )}
                                </Avatar>

                                <div className={`flex flex-col gap-1 max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                    <div className={`px-4 py-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-muted rounded-tl-sm'}`}>
                                        <div className="prose prose-sm dark:prose-invert max-w-none">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {msg.content}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground opacity-50 px-1">
                                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex gap-4">
                                <Avatar className="h-8 w-8 bg-primary/10">
                                    <AvatarFallback className="text-primary"><Loader2 className="h-4 w-4 animate-spin" /></AvatarFallback>
                                </Avatar>
                                <div className="bg-muted px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-foreground/30 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                    <span className="w-1.5 h-1.5 bg-foreground/30 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                    <span className="w-1.5 h-1.5 bg-foreground/30 rounded-full animate-bounce" />
                                </div>
                            </div>
                        )}
                        <div className="h-4" /> {/* Spacer */}
                    </div>
                </ScrollArea>

                {/* Input Area */}
                <div className="p-4 border-t bg-background z-10">
                    <div className="max-w-3xl mx-auto space-y-4">
                        {/* Suggestions */}
                        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                            {suggestions.map((tag) => (
                                <Button
                                    key={tag}
                                    variant="outline"
                                    size="sm"
                                    className="rounded-full text-xs whitespace-nowrap bg-muted/50 hover:bg-primary/10 hover:text-primary hover:border-primary/20 transition-all"
                                    onClick={() => handleSend(tag)}
                                >
                                    {tag}
                                </Button>
                            ))}
                        </div>

                        <div className="relative flex gap-2">
                            <Input
                                className="flex-1 rounded-full pl-6 pr-12 py-6 shadow-sm border-muted-foreground/20 focus-visible:ring-primary/20"
                                placeholder="Ask your AI broker anything..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                                disabled={isLoading}
                            />
                            <Button
                                size="icon"
                                className="absolute right-1.5 top-1.5 h-9 w-9 rounded-full shadow-sm"
                                onClick={() => handleSend()}
                                disabled={isLoading || !input.trim()}
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="flex items-center justify-center gap-6 text-[10px] text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                                <Shield className="h-3 w-3" />
                                <span>End-to-End Encrypted</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Zap className="h-3 w-3" />
                                <span>Powered by GPT-4o</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    )
}
