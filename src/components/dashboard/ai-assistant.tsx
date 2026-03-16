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
    
    // 1. Check for Local Help Desk Response first (Zero Latency, No API Key needed)
    const localResp = getLocalResponse(userMsg)
    if (localResp) {
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
        throw new Error(data.error || "Failed to reach AI knowledge base")
      }

      const aiContent = data.choices?.[0]?.message?.content || "I'm available for basic help. Try asking about 'YouTube' or 'Resume'!"
      setMessages(prev => [...prev, { role: "assistant", content: aiContent }])
    } catch (error: any) {
      console.error("Chat Error:", error)
      const isKeyError = error.message?.includes("401") || error.message?.includes("User not found")
      
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: isKeyError 
          ? `I'm currently in 'Help Desk Mode' because the Advanced AI is offline (API Key error). \n\nI can still help you with basics! Try asking about **YouTube summaries**, **Resume templates**, or type **'help'**.`
          : `⚠️ Sync issue: ${error.message}. I'm still here for basic help!` 
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
              <div className="p-4 bg-primary text-primary-foreground flex justify-between items-center bg-gradient-to-r from-primary to-primary/80">
                <div className="flex items-center gap-2">
                  <div className="bg-white/20 p-1.5 rounded-lg border border-white/30 backdrop-blur-sm">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Productivity Assistant</h3>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-[10px] opacity-80">AI Powered & ready</span>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-white hover:bg-white/20 rounded-full h-8 w-8">
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Chat Area */}
              <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-4">
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                        msg.role === "user" 
                        ? "bg-primary text-primary-foreground rounded-tr-none" 
                        : "bg-muted text-muted-foreground rounded-tl-none border border-muted-foreground/10"
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-muted p-3 rounded-2xl rounded-tl-none border border-muted-foreground/10 flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-xs italic">Thinking...</span>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Input Area */}
              <div className="p-4 border-t bg-muted/30">
                <form 
                  onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                  className="flex gap-2"
                >
                  <Input 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask me anything..."
                    className="bg-background border-primary/10 rounded-xl"
                  />
                  <Button type="submit" size="icon" disabled={isLoading} className="rounded-xl shrink-0">
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
        className="w-14 h-14 rounded-full shadow-xl bg-primary hover:bg-primary/90 p-0 border-4 border-white/10 group transition-all duration-300 active:scale-95"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <div className="relative">
            <Sparkles className="w-6 h-6 absolute -top-1 -right-1 text-white animate-bounce" />
            <Bot className="w-7 h-7" />
          </div>
        )}
      </Button>
    </div>
  )
}
