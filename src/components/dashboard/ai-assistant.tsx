"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageSquare, X, Send, Loader2, Sparkles, Bot } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Message {
  role: "user" | "assistant"
  content: string
}

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi! I'm your AI Workspace Assistant. How can I help you today?" }
  ])
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const getLocalResponse = (text: string): string | null => {
    const low = text.toLowerCase().trim()
    
    // Greetings
    if (["hi", "hello", "hey", "hola", "hi there"].includes(low)) {
      return "Hello! I'm your Productivity Help Desk. How can I assist you with your workspace today?"
    }
    
    // Help / Features
    if (low.includes("help") || low.includes("what can you do") || low.includes("features")) {
      return "I can help you with:\n1. 📺 **YouTube Summaries**: Just paste a link to get AI notes.\n2. 📄 **Resume Building**: Create ATS-friendly resumes.\n3. 📝 **Note Saving**: Keep track of your thoughts.\n\nWhat would you like to know more about?"
    }

    if (low.includes("youtube") || low.includes("summary")) {
      return "To summarize a video, go to the 'YouTube Summarizer' tab, paste any link (even Shorts!), and click 'Generate'. It works even without transcripts now!"
    }

    if (low.includes("resume") || low.includes("cv")) {
      return "Go to the 'Resume Builder' to choose from 21+ premium templates. You can export them as high-quality PDFs for your job search."
    }

    if (low.includes("note")) {
      return "You can save and organize your study notes in the 'Notes Saver'. It's synced to your account so you never lose your ideas."
    }

    if (low.includes("thanks") || low.includes("thank you")) {
      return "You're very welcome! Let me know if you need anything else to stay productive. 🚀"
    }

    return null
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMsg = input.trim()
    setInput("")
    setMessages(prev => [...prev, { role: "user", content: userMsg }])
    
    // 1. Check for Local Help Desk Response first (CRITICAL: Prioritize for basics)
    const localResp = getLocalResponse(userMsg)
    if (localResp) {
      console.log(`[Assistant] Local match found for: ${userMsg}`)
      setMessages(prev => [...prev, { role: "assistant", content: localResp }])
      return
    }

    // 2. Fallback to AI if it's a complex query
    setIsLoading(true)
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: "user", content: userMsg }
          ]
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Sync error")
      }

      const aiContent = data.choices?.[0]?.message?.content || "I'm available for basic help. Try asking about 'YouTube' or 'Resume'!"
      setMessages(prev => [...prev, { role: "assistant", content: aiContent }])
    } catch (error: any) {
      console.error("Chat Error:", error)
      const isKeyError = error.message?.includes("401") || error.message?.includes("User not found")
      
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: isKeyError 
          ? `I'm in 'Help Desk Mode' because your OpenRouter API Key is invalid (Error 401). \n\nI can still help you! Ask about **YouTube summaries**, **Resume templates**, or type **'help'**.`
          : `I'm currently having a sync issue, but I'm still here for basic help! Try asking about features.` 
      }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 w-[350px] sm:w-[400px]"
          >
            <Card className="flex flex-col h-[500px] border-primary/20 bg-background/80 backdrop-blur-xl shadow-2xl overflow-hidden rounded-2xl">
              {/* Header */}
              <div className="p-6 bg-card border-b border-border/40 flex justify-between items-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/10 via-primary to-primary/10" />
                <div className="flex items-center gap-4 relative z-10">
                  <div className="bg-primary/10 p-2 border border-primary/20 backdrop-blur-sm shadow-inner group">
                    <Sparkles className="w-5 h-5 text-primary group-hover:rotate-12 transition-transform" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold tracking-[0.3em] uppercase opacity-50">Sanctuary Guide</span>
                    <h3 className="font-heading italic text-base tracking-tight leading-none">Workspace Oracle</h3>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="hover:bg-primary/10 rounded-none h-10 w-10 border border-transparent hover:border-border/30">
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Chat Area */}
              <ScrollArea className="flex-1 p-6 font-serif" ref={scrollRef}>
                <div className="space-y-6 pb-4">
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] p-4 text-base leading-relaxed italic font-light transition-all duration-500 rounded-none ${
                        msg.role === "user" 
                        ? "bg-primary/10 text-foreground border-r-2 border-primary shadow-sm" 
                        : "bg-muted/30 text-foreground/80 border-l-2 border-border/50"
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-muted/30 p-4 border-l-2 border-primary/30 flex items-center gap-3">
                        <Loader2 className="w-3 h-3 animate-spin opacity-40 text-primary" />
                        <span className="text-xs italic font-light tracking-[0.1em] opacity-40 uppercase">Channeling Wisdom...</span>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Input Area */}
              <div className="p-6 border-t border-border/20 bg-muted/10">
                <form 
                  onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                  className="flex gap-4"
                >
                  <Input 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Speak your mind..."
                    className="bg-background/50 border-border/30 rounded-none h-12 italic font-light tracking-wide focus-visible:ring-primary/20"
                  />
                  <Button type="submit" size="icon" disabled={isLoading} className="rounded-none shrink-0 h-12 w-12 bg-primary hover:bg-primary/90">
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 rounded-none shadow-2xl bg-card hover:bg-primary/5 transition-all duration-500 border border-border/40 p-0 relative group overflow-hidden"
      >
        <div className="absolute inset-0 bg-primary/20 transition-all duration-700 opacity-0 group-hover:opacity-10 scale-150 rotate-45 group-hover:rotate-0" />
        {isOpen ? (
          <X className="w-6 h-6 text-primary relative z-10" />
        ) : (
          <div className="relative z-10">
            <Sparkles className="w-5 h-5 absolute -top-4 -right-4 text-primary animate-pulse opacity-0 group-hover:opacity-100 transition-opacity" />
            <Bot className="w-8 h-8 text-primary/80 group-hover:text-primary transition-colors" />
          </div>
        )}
      </Button>
      <style jsx global>{`
        .font-heading { font-family: var(--font-heading), serif; }
      `}</style>
    </div>
  )
}
