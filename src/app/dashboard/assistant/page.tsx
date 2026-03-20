"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, Loader2, Copy, RefreshCw, Sparkles, Upload, FileText, Trash2, MessageSquare, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", role: "assistant", content: "Hello! I'm your Premium AI Assistant. Ask me anything, upload a document, or let me help you with research, summaries, and more." }
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [docPreview, setDocPreview] = useState("")
  const [docName, setDocName] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages, isLoading])

  const genId = () => Math.random().toString(36).substring(2, 10)

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return
    setError("")
    const userMsg: Message = { id: genId(), role: "user", content: text.trim() }
    setMessages(prev => [...prev, userMsg])
    setInput("")
    setIsLoading(true)

    try {
      const allMessages = [...messages, userMsg].filter(m => m.id !== "welcome").map(m => ({ role: m.role, content: m.content }))
      
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: allMessages })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "AI service temporarily unavailable")
      }

      // V23: Support both old format (choices) and new format (content)
      const aiText = data.content || data.choices?.[0]?.message?.content
      if (!aiText) throw new Error("AI returned an empty response")

      setMessages(prev => [...prev, { id: genId(), role: "assistant", content: aiText }])
    } catch (err: any) {
      setError(err.message || "Something went wrong")
      setMessages(prev => [...prev, { id: genId(), role: "assistant", content: `⚠️ ${err.message || "AI service temporarily unavailable. Please try again."}` }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const regenerate = () => {
    const lastUserMsg = [...messages].reverse().find(m => m.role === "user")
    if (lastUserMsg) {
      setMessages(prev => prev.slice(0, prev.length - 1))
      sendMessage(lastUserMsg.content)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setDocName(file.name)

    if (file.size > 10 * 1024 * 1024) {
      setError("File too large. Max 10MB.")
      return
    }

    try {
      let text = ""
      if (file.type === "text/plain" || file.name.endsWith(".txt") || file.name.endsWith(".md")) {
        text = await file.text()
      } else {
        text = await file.text()
      }

      if (!text || text.length < 10) {
        setError("Could not extract text from file. Try a .txt or .md file.")
        return
      }

      const preview = text.substring(0, 500)
      setDocPreview(preview)

      const prompt = `Summarize this document clearly with headings and bullet points:\n\n---\n${text.substring(0, 4000)}\n---`
      sendMessage(prompt)
    } catch (err) {
      setError("Failed to read file.")
    }
    if (fileRef.current) fileRef.current.value = ""
  }

  const clearChat = () => {
    setMessages([{ id: "welcome", role: "assistant", content: "Chat cleared. How can I help you?" }])
    setError("")
    setDocPreview("")
    setDocName("")
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-h-[900px] relative">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-border/30">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="h-px w-8 bg-primary/40" />
            <span className="text-[10px] font-bold tracking-[0.4em] uppercase opacity-60">AI Engine</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-heading tracking-tight italic">Premium Assistant</h1>
          <p className="text-foreground/50 text-sm font-light italic">Powered by Gemini + DeepSeek • Zero fake responses</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => fileRef.current?.click()} className="gap-2 text-xs uppercase tracking-widest font-bold rounded-xl hover:bg-primary/10 border border-border/30">
            <Upload className="h-3.5 w-3.5" /> Upload
          </Button>
          <Button variant="ghost" size="sm" onClick={clearChat} className="gap-2 text-xs uppercase tracking-widest font-bold rounded-xl hover:bg-destructive/10 text-destructive/70 border border-border/30">
            <Trash2 className="h-3.5 w-3.5" /> Clear
          </Button>
          <input ref={fileRef} type="file" accept=".txt,.md,.csv" onChange={handleFileUpload} className="hidden" />
        </div>
      </div>

      {/* Document Preview */}
      <AnimatePresence>
        {docPreview && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest opacity-60">
                <FileText className="h-3 w-3" /> {docName || "Document Preview"}
              </div>
              <p className="text-xs text-foreground/60 italic line-clamp-3">{docPreview}...</p>
              <Button size="sm" variant="ghost" onClick={() => setDocPreview("")} className="text-[10px] uppercase tracking-widest">Dismiss</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Banner */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-3">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-xs text-destructive font-medium">{error}</span>
              <Button size="sm" variant="ghost" className="ml-auto text-[10px]" onClick={() => setError("")}>Dismiss</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Messages */}
      <ScrollArea className="flex-1 mt-6 pr-2" ref={scrollRef}>
        <div className="space-y-5 pb-4">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`relative group max-w-[80%] rounded-2xl px-5 py-4 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "bg-card border border-border/40 shadow-sm"
              }`}>
                <div className="whitespace-pre-wrap">{msg.content}</div>
                {msg.role === "assistant" && msg.id !== "welcome" && (
                  <div className="absolute -bottom-7 left-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <button onClick={() => copyToClipboard(msg.content)} className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground flex items-center gap-1 bg-background/80 backdrop-blur-sm px-2 py-1 rounded-lg border border-border/30">
                      <Copy className="h-2.5 w-2.5" /> Copy
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="bg-card border border-border/40 rounded-2xl px-5 py-4 flex items-center gap-3 shadow-sm">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground italic">Thinking...</span>
              </div>
            </motion.div>
          )}
        </div>
      </ScrollArea>

      {/* Regenerate Button */}
      {messages.length > 2 && !isLoading && (
        <div className="flex justify-center py-2">
          <Button variant="ghost" size="sm" onClick={regenerate} className="gap-2 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground rounded-xl">
            <RefreshCw className="h-3 w-3" /> Regenerate last response
          </Button>
        </div>
      )}

      {/* Input Bar */}
      <form onSubmit={handleSubmit} className="mt-2 flex gap-3 items-end border-t border-border/20 pt-4">
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything..."
            rows={1}
            className="w-full resize-none bg-card border border-border/40 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all placeholder:text-muted-foreground/50"
            disabled={isLoading}
          />
        </div>
        <Button type="submit" disabled={isLoading || !input.trim()} size="icon" className="h-11 w-11 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 shrink-0">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}
