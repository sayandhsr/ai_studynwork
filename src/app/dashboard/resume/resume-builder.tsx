"use client"

import React, { useRef, useState } from "react"
import { useReactToPrint } from "react-to-print"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Printer, Save, Loader2, LayoutTemplate, Type, Sliders, Type as FontIcon, AlignLeft, Sparkles, Trash, Plus, Minus, CheckCircle2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

// Types for Resume Data
interface Experience {
  id: string
  company: string
  role: string
  period: string
  description: string
}

interface Education {
  id: string
  school: string
  degree: string
  year: string
}

interface ResumeData {
  personalInfo: {
    fullName: string
    email: string
    phone: string
    location: string
    summary: string
  }
  experience: Experience[]
  education: Education[]
  skills: string
}

const TEMPLATES = [
  "Modern", "Classic", "Minimal", "Executive", "Creative", 
  "Academic", "Compact", "Elegant", "Professional", "Sharp", "Soft",
  "Blueprint", "Chalk", "Cyber", "Nature", "Sunset", "Gothic",
  "Journal", "Retro", "Futuristic", "Signature", "Vantage", "Slate", "Seraph", "Oracle"
]

export function ResumeBuilder() {
  const supabase = createClient()
  const resumeRef = useRef<HTMLDivElement>(null)
  
  const [data, setData] = useState<ResumeData>({
    personalInfo: {
      fullName: "Jane Doe",
      email: "jane@example.com",
      phone: "(555) 123-4567",
      location: "San Francisco, CA",
      summary: "Experienced software engineer passionate about building scalable, user-friendly applications."
    },
    experience: [
      { id: "1", company: "TechNova", role: "Senior Developer", period: "2020 - Present", description: "Led frontend team. Improved performance by 40%. Collaborated with stakeholders to define product roadmap." },
      { id: "2", company: "StartUp Inc", role: "Software Engineer", period: "2018 - 2020", description: "Developed main product features using React and Node.js. Optimized database queries." }
    ],
    education: [
      { id: "1", school: "University of Tech", degree: "BS Computer Science", year: "2018" }
    ],
    skills: "JavaScript, TypeScript, React, Next.js, Node.js, SQL, TailwindCSS, AWS, Docker"
  })

  const [activeTemplate, setActiveTemplate] = useState("Modern")
  const [fontFamily, setFontFamily] = useState("font-inter")
  const [fontSize, setFontSize] = useState(11)
  const [lineHeight, setLineHeight] = useState(1.6)
  const [saving, setSaving] = useState(false)
  const [optimizing, setOptimizing] = useState(false)
  const [targetRole, setTargetRole] = useState("")
  const [savedSuccess, setSavedSuccess] = useState(false)

  const handlePrint = useReactToPrint({
    contentRef: resumeRef,
    documentTitle: `${data.personalInfo.fullName.replace(" ", "_")}_Resume`,
  })

  const handleSave = async () => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase.from("resumes").insert([{
        user_id: user.id,
        resume_data: data,
        template_used: activeTemplate
      }])
      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 3000)
    } catch (err) {
      console.error("Failed to save resume", err)
    } finally {
      setSaving(false)
    }
  }

  const optimizeWithAI = async () => {
    if (optimizing) return
    setOptimizing(true)
    try {
      const response = await fetch("/api/optimize-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data, targetRole })
      })
      const result = await response.json()
      if (result.optimizedData) {
        setData(result.optimizedData)
      }
    } catch (err) {
      console.error("AI Optimization failed", err)
    } finally {
      setOptimizing(false)
    }
  }

  const updatePersonalInfo = (field: keyof ResumeData["personalInfo"], value: string) => {
    setData(prev => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [field]: value }
    }))
  }

  const updateExperience = (id: string, field: keyof Experience, value: string) => {
    setData(prev => ({
      ...prev,
      experience: prev.experience.map(exp => exp.id === id ? { ...exp, [field]: value } : exp)
    }))
  }

  const addExperience = () => {
    const newExp: Experience = { id: Date.now().toString(), company: "", role: "", period: "", description: "" }
    setData(prev => ({ ...prev, experience: [...prev.experience, newExp] }))
  }

  const removeExperience = (id: string) => {
    setData(prev => ({ ...prev, experience: prev.experience.filter(exp => exp.id !== id) }))
  }

  const updateEducation = (id: string, field: keyof Education, value: string) => {
    setData(prev => ({
      ...prev,
      education: prev.education.map(edu => edu.id === id ? { ...edu, [field]: value } : edu)
    }))
  }

  const addEducation = () => {
    const newEdu: Education = { id: Date.now().toString(), school: "", degree: "", year: "" }
    setData(prev => ({ ...prev, education: [...prev.education, newEdu] }))
  }

  const removeEducation = (id: string) => {
    setData(prev => ({ ...prev, education: prev.education.filter(edu => edu.id !== id) }))
  }

  // --- TEMPLATE ENGINE ---
  
  const getTemplateStyles = () => {
    let baseStyles = ""
    switch(activeTemplate) {
      case 'Classic': baseStyles = "font-serif text-gray-900"; break
      case 'Modern': baseStyles = "font-sans text-slate-800 bg-white"; break
      case 'Creative': baseStyles = "font-sans text-indigo-900 border-l-[16px] border-indigo-500 pl-20"; break
      case 'Executive': baseStyles = "font-serif text-black border-t-[20px] border-slate-900 pt-20"; break
      case 'Minimal': baseStyles = "font-sans text-gray-700 tracking-tight leading-snug max-w-[85%]"; break
      case 'Elegant': baseStyles = "font-serif text-slate-800 tracking-widest italic"; break
      case 'Professional': baseStyles = "font-sans text-slate-900 border-t-[6px] border-blue-600 pt-12"; break
      case 'Sharp': baseStyles = "font-sans text-black border-l-[8px] border-black pl-12"; break
      case 'Soft': baseStyles = "font-sans text-slate-700 rounded-3xl p-10"; break
      case 'Blueprint': baseStyles = "font-mono text-blue-900 bg-blue-50/20 p-10 border-2 border-dashed border-blue-200"; break
      case 'Chalk': baseStyles = "font-serif text-slate-800 border-4 border-slate-300 p-12 shadow-inner"; break
      case 'Cyber': baseStyles = "font-mono text-green-400 bg-slate-950 p-10"; break
      case 'Nature': baseStyles = "font-serif text-emerald-950 bg-emerald-50/30 p-10"; break
      case 'Sunset': baseStyles = "font-sans text-orange-950 bg-orange-50/30 p-10"; break
      case 'Gothic': baseStyles = "font-serif uppercase text-black font-black tracking-tighter"; break
      case 'Journal': baseStyles = "font-serif italic text-stone-900 border-b border-stone-200 pb-20"; break
      case 'Retro': baseStyles = "font-mono text-fuchsia-600 border-double border-4 border-fuchsia-200 p-8"; break
      case 'Futuristic': baseStyles = "font-sans text-slate-950 bg-white/40 backdrop-blur-xl border border-white/20 p-10 rounded-none shadow-2xl"; break
      case 'Signature': baseStyles = "font-heading text-slate-900 border-l border-t border-slate-100 p-12"; break
      case 'Vantage': baseStyles = "font-sans text-blue-950 border-r-[24px] border-blue-900 pr-16"; break
      case 'Slate': baseStyles = "font-sans text-slate-900 bg-slate-50 p-12"; break
      case 'Seraph': baseStyles = "font-serif text-indigo-950 italic tracking-wide"; break
      case 'Oracle': baseStyles = "font-sans uppercase text-slate-900 font-light tracking-[0.3em]"; break
      case 'Academic': baseStyles = "font-serif text-gray-950 leading-loose text-sm"; break
      case 'Compact': baseStyles = "font-sans text-gray-900 text-[10px] leading-tight"; break
      default: baseStyles = "font-sans text-black"; break
    }
    return `${baseStyles} ${fontFamily}`
  }

  const Header = () => {
    const isCentered = !['Creative', 'Sharp', 'Executive', 'Professional', 'Cyber', 'Blueprint'].includes(activeTemplate)
    const showBorder = ['Executive', 'Modern', 'Professional', 'Academic'].includes(activeTemplate)
    
    return (
      <div className={cn(
        "mb-12 transition-all duration-500",
        isCentered ? 'text-center' : 'text-left',
        showBorder && 'border-b-2 border-slate-200 pb-10',
        activeTemplate === 'Signature' && 'font-heading italic'
      )}>
        <h1 className={cn(
          "text-5xl tracking-tight mb-4 transition-colors duration-500",
          ['Modern', 'Professional', 'Blueprint'].includes(activeTemplate) ? 'text-primary' : 
          activeTemplate === 'Creative' ? 'text-indigo-600' : 
          activeTemplate === 'Cyber' ? 'text-green-500' : 
          'text-black'
        )}>
          {data.personalInfo.fullName}
        </h1>
        <div className={cn(
          "flex flex-wrap items-center gap-6 text-[10px] font-bold uppercase tracking-[0.2em] opacity-50",
          isCentered ? 'justify-center' : 'justify-start'
        )}>
          <span>{data.personalInfo.email}</span>
          <div className="h-1 w-1 rounded-full bg-primary/40" />
          <span>{data.personalInfo.phone}</span>
          {data.personalInfo.location && (
            <>
              <div className="h-1 w-1 rounded-full bg-primary/40" />
              <span>{data.personalInfo.location}</span>
            </>
          )}
        </div>
      </div>
    )
  }

  const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="mb-12 group">
      <div className="flex items-center gap-6 mb-8 group-hover:translate-x-1 transition-transform duration-300">
        <h2 className={cn(
          "text-[10px] font-black uppercase tracking-[0.5em] opacity-25 whitespace-nowrap",
          ['Professional', 'Executive', 'Modern'].includes(activeTemplate) && 'opacity-60 text-primary'
        )}>
          {title}
        </h2>
        <div className="h-px w-full bg-border/20 group-hover:bg-primary/20 transition-colors" />
      </div>
      <div className="relative">
        {children}
      </div>
    </div>
  )

  return (
    <div className="flex flex-col lg:flex-row gap-16 items-start font-serif selection:bg-primary/20 pb-20">
      {/* Form Controls */}
      <div className="w-full lg:w-[480px] shrink-0 space-y-10">
          <Tabs defaultValue="identity" className="w-full">
            <TabsList className="w-full h-14 bg-[#0B0F14] border border-border/10 p-1 rounded-none mb-10 overflow-x-auto overflow-y-hidden flex-nowrap justify-start">
              <TabsTrigger value="identity" className="flex-1 min-w-[100px] h-full rounded-none text-[9px] font-bold uppercase tracking-[0.2em] data-[state=active]:bg-primary/10 data-[state=active]:text-primary transition-all">Identity</TabsTrigger>
              <TabsTrigger value="chronicle" className="flex-1 min-w-[100px] h-full rounded-none text-[9px] font-bold uppercase tracking-[0.2em] data-[state=active]:bg-primary/10 data-[state=active]:text-primary transition-all">Chronicle</TabsTrigger>
              <TabsTrigger value="meta" className="flex-1 min-w-[100px] h-full rounded-none text-[9px] font-bold uppercase tracking-[0.2em] data-[state=active]:bg-primary/10 data-[state=active]:text-primary transition-all">Metadata</TabsTrigger>
              <TabsTrigger value="ats" className="flex-1 min-w-[100px] h-full rounded-none text-[9px] font-bold uppercase tracking-[0.2em] data-[state=active]:bg-primary/10 data-[state=active]:text-primary transition-all flex items-center gap-2">
                <Sparkles className="w-3 h-3" />
                ATS AI
              </TabsTrigger>
            </TabsList>

            <TabsContent value="identity" className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
               <div className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted">Full Name</Label>
                    <Input 
                      value={data.personalInfo.fullName} 
                      onChange={(e) => updatePersonalInfo("fullName", e.target.value)} 
                      className="h-14 rounded-none border-border/10 bg-[#0B0F14]/40 italic font-light text-lg px-6 selection:bg-primary/20"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted">Email Address</Label>
                      <Input 
                        value={data.personalInfo.email} 
                        onChange={(e) => updatePersonalInfo("email", e.target.value)} 
                        className="h-14 rounded-none border-border/10 bg-[#0B0F14]/40 italic font-light text-base px-6 selection:bg-primary/20"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted">Contact Number</Label>
                      <Input 
                        value={data.personalInfo.phone} 
                        onChange={(e) => updatePersonalInfo("phone", e.target.value)} 
                        className="h-14 rounded-none border-border/10 bg-[#0B0F14]/40 italic font-light text-base px-6"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted">Geographical Location</Label>
                    <Input 
                      value={data.personalInfo.location} 
                      onChange={(e) => updatePersonalInfo("location", e.target.value)} 
                      className="h-14 rounded-none border-border/10 bg-[#0B0F14]/40 italic font-light text-base px-6"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted">Professional Narrative</Label>
                    <Textarea 
                      value={data.personalInfo.summary} 
                      onChange={(e) => updatePersonalInfo("summary", e.target.value)} 
                      rows={5}
                      className="rounded-none border-border/10 bg-[#0B0F14]/40 italic font-light text-base p-6 resize-none selection:bg-primary/20 leading-relaxed"
                    />
                  </div>
               </div>
            </TabsContent>

            <TabsContent value="chronicle" className="space-y-10 animate-in fade-in slide-in-from-left-4 duration-500">
               <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-[0.3em] text-primary/60">Professional Chronicle</h3>
                    <Button onClick={addExperience} variant="ghost" size="sm" className="h-8 rounded-none text-[10px] font-bold uppercase tracking-widest border border-primary/10 hover:bg-primary/5 px-4">
                      Add Instance
                    </Button>
                  </div>
                  <ScrollArea className="h-[500px] pr-6">
                    <div className="space-y-10">
                      <AnimatePresence initial={false}>
                        {data.experience.map((exp, i) => (
                          <motion.div 
                            key={exp.id} 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="p-8 border border-border/10 bg-[#0B0F14]/20 relative group overflow-hidden"
                          >
                             <Button 
                                variant="ghost" size="icon" 
                                onClick={() => removeExperience(exp.id)}
                                className="absolute top-4 right-4 h-8 w-8 text-muted opacity-0 group-hover:opacity-60 hover:text-destructive flex items-center justify-center transition-all bg-background/50"
                             >
                               <Trash className="w-3.5 h-3.5" />
                             </Button>
                             <span className="text-[9px] font-bold uppercase tracking-widest opacity-20 block mb-6">Entry Sequence #{i + 1}</span>
                             <div className="grid gap-8">
                                <Input 
                                  placeholder="Corporate Entity"
                                  value={exp.company}
                                  onChange={(e) => updateExperience(exp.id, "company", e.target.value)}
                                  className="h-12 border-0 border-b border-border/10 rounded-none bg-transparent italic font-light text-base px-0 focus-visible:ring-0 focus-visible:border-primary/40 transition-colors"
                                />
                                <Input 
                                  placeholder="Designatory Role"
                                  value={exp.role}
                                  onChange={(e) => updateExperience(exp.id, "role", e.target.value)}
                                  className="h-12 border-0 border-b border-border/10 rounded-none bg-transparent italic font-light text-base px-0 font-bold focus-visible:ring-0 focus-visible:border-primary/40"
                                />
                                <Input 
                                  placeholder="Temporal Range (e.g. 2022 - Present)"
                                  value={exp.period}
                                  onChange={(e) => updateExperience(exp.id, "period", e.target.value)}
                                  className="h-12 border-0 border-b border-border/10 rounded-none bg-transparent italic font-light text-sm px-0 opacity-60 focus-visible:ring-0 focus-visible:border-primary/40"
                                />
                                <Textarea 
                                  placeholder="Articulate your impact using the STAR method..."
                                  value={exp.description}
                                  onChange={(e) => updateExperience(exp.id, "description", e.target.value)}
                                  rows={4}
                                  className="border-0 border-b border-border/10 rounded-none bg-transparent italic font-light text-base px-0 resize-none leading-relaxed focus-visible:ring-0 focus-visible:border-primary/40"
                                />
                             </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </ScrollArea>
               </div>

               <div className="space-y-8 pt-10 border-t border-border/5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-[0.3em] text-primary/60">Foundational Knowledge</h3>
                    <Button onClick={addEducation} variant="ghost" size="sm" className="h-8 rounded-none text-[10px] font-bold uppercase tracking-widest border border-primary/10 hover:bg-primary/5 px-4">
                      Add Degree
                    </Button>
                  </div>
                  <div className="space-y-8">
                     <AnimatePresence initial={false}>
                        {data.education.map((edu, i) => (
                          <motion.div 
                            key={edu.id}
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="relative group p-8 border border-border/10 bg-[#0B0F14]/10"
                          >
                             <Button 
                                variant="ghost" size="icon" 
                                onClick={() => removeEducation(edu.id)}
                                className="absolute top-2 right-2 h-8 w-8 text-muted opacity-0 group-hover:opacity-60 hover:text-destructive transition-all"
                             >
                               <Trash className="w-3.5 h-3.5" />
                             </Button>
                             <div className="grid gap-6">
                                <Input 
                                  placeholder="Academic Institution"
                                  value={edu.school}
                                  onChange={(e) => updateEducation(edu.id, "school", e.target.value)}
                                  className="h-10 border-0 border-b border-border/10 rounded-none bg-transparent italic font-light text-base px-0 focus-visible:ring-0 focus-visible:border-primary/40"
                                />
                                <div className="flex justify-between gap-10">
                                  <Input 
                                    placeholder="Degree Conferred"
                                    value={edu.degree}
                                    onChange={(e) => updateEducation(edu.id, "degree", e.target.value)}
                                    className="flex-1 h-10 border-0 border-b border-border/10 rounded-none bg-transparent italic font-light text-base px-0 font-bold focus-visible:ring-0 focus-visible:border-primary/40"
                                  />
                                  <Input 
                                    placeholder="Year"
                                    value={edu.year}
                                    onChange={(e) => updateEducation(edu.id, "year", e.target.value)}
                                    className="w-24 h-10 border-0 border-b border-border/10 rounded-none bg-transparent italic font-light text-sm px-0 opacity-60 focus-visible:ring-0 focus-visible:border-primary/40"
                                  />
                                </div>
                             </div>
                          </motion.div>
                        ))}
                     </AnimatePresence>
                  </div>
               </div>
            </TabsContent>

            <TabsContent value="meta" className="space-y-12 animate-in fade-in slide-in-from-left-4 duration-500">
               <div className="space-y-8">
                  <div className="space-y-6">
                    <Label className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted">Architectural Template</Label>
                    <ScrollArea className="h-[200px] border border-border/10 bg-[#0B0F14]/40 p-4">
                       <div className="grid grid-cols-2 gap-3">
                          {TEMPLATES.map((tmpl) => (
                            <Button 
                              key={tmpl} 
                              variant="ghost"
                              onClick={() => setActiveTemplate(tmpl)}
                              className={cn(
                                "h-11 rounded-none text-[9px] font-bold uppercase tracking-widest border transition-all",
                                activeTemplate === tmpl ? "bg-primary text-primary-foreground border-primary" : "border-border/5 hover:bg-primary/5 text-muted/60"
                              )}
                            >
                              {tmpl}
                            </Button>
                          ))}
                       </div>
                    </ScrollArea>
                  </div>

                  <div className="space-y-6">
                    <Label className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted">Typography Selection</Label>
                    <div className="grid gap-3">
                       {[
                         { name: 'Inter (Sanctuary Sans)', class: 'font-inter' },
                         { name: 'Baskerville (Elite Serif)', class: 'font-baskerville' },
                         { name: 'Lora (Sophisticated Serif)', class: 'font-lora' },
                         { name: 'Roboto (Functional Sans)', class: 'font-roboto' },
                         { name: 'JetBrains (Structural Mono)', class: 'font-jetbrains' }
                       ].map((f) => (
                         <Button 
                           key={f.class} 
                           variant="ghost"
                           onClick={() => setFontFamily(f.class)}
                           className={cn(
                             "h-14 justify-start px-8 rounded-none text-xs border transition-all",
                             f.class,
                             fontFamily === f.class ? "bg-primary/10 border-primary/20 text-primary" : "border-border/5 hover:bg-primary/5 text-muted/60"
                           )}
                         >
                           {f.name}
                         </Button>
                       ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-10 pt-6">
                     <div className="space-y-6">
                        <div className="flex justify-between items-center">
                          <Label className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-40">Optical Size</Label>
                          <span className="text-[10px] font-mono text-primary/60">{fontSize}pt</span>
                        </div>
                        <input type="range" min="8" max="14" step="0.5" value={fontSize} onChange={(e) => setFontSize(parseFloat(e.target.value))} className="w-full accent-primary h-1 bg-border/20 appearance-none cursor-pointer" />
                     </div>
                     <div className="space-y-6">
                        <div className="flex justify-between items-center">
                          <Label className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-40">Line rhythm</Label>
                          <span className="text-[10px] font-mono text-primary/60">{lineHeight}x</span>
                        </div>
                        <input type="range" min="1.0" max="2.0" step="0.1" value={lineHeight} onChange={(e) => setLineHeight(parseFloat(e.target.value))} className="w-full accent-primary h-1 bg-border/20 appearance-none cursor-pointer" />
                     </div>
                  </div>

                  <div className="space-y-6 pt-10 border-t border-border/5">
                    <Label className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted">Ammunition Arsenal (Skills)</Label>
                    <Textarea 
                      value={data.skills} 
                      onChange={(e) => setData(prev => ({...prev, skills: e.target.value}))} 
                      rows={4}
                      placeholder="e.g. Artificial Intelligence, Neural Architectures, Strategic Synthesis..."
                      className="rounded-none border-border/10 bg-[#0B0F14]/40 italic font-light text-base p-6 resize-none leading-relaxed selection:bg-primary/20"
                    />
                  </div>
               </div>
            </TabsContent>

            <TabsContent value="ats" className="space-y-10 animate-in fade-in slide-in-from-left-4 duration-500">
               <div className="space-y-12">
                  <div className="p-12 border border-primary/20 bg-primary/5 space-y-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-5 rotate-12 group-hover:rotate-0 transition-transform duration-1000">
                       <Sparkles className="w-32 h-32" />
                    </div>
                    <h3 className="text-4xl font-heading italic">Sanctuary ATS Synthesis</h3>
                    <p className="text-[12px] font-bold uppercase tracking-widest opacity-40 leading-loose">
                      Our analytical engine will restructure your professional sequence using the STAR mandate. 
                      High-density keyword injection is applied to ensure executive-level visibility in any tracking system.
                    </p>
                  </div>
                  <div className="space-y-8 pt-4">
                    <Label className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted">Target Objective (Role Title)</Label>
                    <div className="relative group">
                      <Input 
                        value={targetRole}
                        onChange={(e) => setTargetRole(e.target.value)}
                        placeholder="e.g. Senior Principal Architect"
                        className="h-20 rounded-none border-border/10 bg-[#0B0F14]/40 italic font-light text-xl px-8 focus-visible:ring-primary/20 transition-all"
                      />
                      <div className="absolute inset-y-0 right-8 flex items-center">
                         <Sparkles className="w-5 h-5 text-primary/20" />
                      </div>
                    </div>
                    <Button 
                      onClick={optimizeWithAI}
                      disabled={optimizing || !targetRole}
                      className="w-full h-28 gap-8 bg-primary hover:bg-primary/90 text-primary-foreground rounded-none uppercase font-black tracking-[0.6em] text-xs shadow-[0_0_50px_rgba(212,175,55,0.15)] transition-all relative overflow-hidden group"
                    >
                      {optimizing ? <Loader2 className="h-8 w-8 animate-spin" /> : <Sparkles className="h-8 w-8 group-hover:rotate-12 transition-transform" />}
                      {optimizing ? "Synthesizing Chronicle..." : "Execute AI Transformation"}
                      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity skew-x-12 translate-x-full group-hover:translate-x-0 duration-1000" />
                    </Button>
                  </div>
               </div>
            </TabsContent>
          </Tabs>

        <div className="flex flex-col gap-6 pt-12 border-t border-border/5">
           <Button onClick={() => handlePrint()} className="h-24 rounded-none bg-primary hover:bg-primary/90 transition-all font-bold uppercase tracking-[0.5em] text-xs shadow-2xl relative overflow-hidden group text-primary-foreground">
              <Printer className="w-6 h-6 mr-6 group-hover:scale-110 transition-transform" />
              Manifest High-Res Document
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity skew-x-12 translate-x-full group-hover:translate-x-0 duration-1000" />
           </Button>
           <Button 
              variant="ghost" 
              onClick={handleSave} 
              disabled={saving} 
              className="h-16 rounded-none border border-primary/10 hover:bg-primary/5 transition-all font-bold uppercase tracking-[0.3em] text-[10px] text-muted-foreground hover:text-primary relative"
           >
              {saving ? <Loader2 className="w-4 h-4 mr-4 animate-spin" /> : (savedSuccess ? <CheckCircle2 className="w-4 h-4 mr-4 text-primary" /> : <Save className="w-4 h-4 mr-4" />)}
              {savedSuccess ? "Synchronized Successfully" : "Commit to Personal Vault"}
           </Button>
        </div>
      </div>

      {/* Resume Preview */}
      <div className="flex-1 bg-[#0B0F14]/30 p-12 sm:p-24 rounded-none border border-border/10 min-h-[1200px] flex justify-center sticky top-24 shadow-inner overflow-auto selection:bg-primary/10">
         <div 
           ref={resumeRef}
           className={`bg-white w-[210mm] min-h-[297mm] p-[30mm] shadow-2xl text-black print:shadow-none print:p-0 ring-1 ring-black/5 ${getTemplateStyles()} relative transition-all duration-1000`}
         >
            <div 
              className="w-full h-full animate-in fade-in duration-1000" 
              style={{ fontSize: `${fontSize}pt`, lineHeight: lineHeight }}
            >
              {/* Fine watermark for luxury templates */}
              <div className="absolute top-10 right-10 text-[8px] font-bold uppercase tracking-[0.8em] opacity-5 select-none pointer-events-none">
                Sanctuary Curated Document
              </div>

              <Header />
              
              <Section title="The Narrative">
                 <p className="leading-relaxed opacity-80 italic font-light whitespace-pre-wrap">{data.personalInfo.summary}</p>
              </Section>

              <Section title="The Chronicle">
                 <div className="space-y-12">
                   {data.experience.map((exp) => (
                      <div key={exp.id} className="group relative">
                         <div className="flex justify-between items-baseline mb-4">
                            <h3 className="font-heading text-3xl italic tracking-tight group-hover:text-primary transition-colors duration-500">{exp.role || "Untitled Role"}</h3>
                            <span className="text-[11px] font-bold uppercase tracking-widest opacity-40 italic">{exp.period}</span>
                         </div>
                         <div className="text-[12px] font-bold uppercase tracking-[0.3em] mb-6 text-primary/60">
                           {exp.company || "Anonymous Entity"}
                         </div>
                         <p className="leading-relaxed font-light italic opacity-70 border-l-2 border-primary/10 pl-10 whitespace-pre-wrap">{exp.description || "In transition..."}</p>
                      </div>
                   ))}
                 </div>
              </Section>

             <Section title="The Foundation">
               <div className="space-y-10">
                 {data.education.map((edu) => (
                    <div key={edu.id} className="flex justify-between items-start group">
                       <div className="space-y-2">
                          <h3 className="font-heading text-2xl italic group-hover:text-primary transition-colors">{edu.degree || "Candidate"}</h3>
                           <div className="text-[12px] font-bold uppercase tracking-widest opacity-50">{edu.school || "Institution"}</div>
                       </div>
                       <span className="text-[11px] font-bold opacity-30 italic">{edu.year}</span>
                    </div>
                 ))}
               </div>
             </Section>

             <Section title="The Arsenal">
                <div className="flex flex-wrap gap-x-12 gap-y-6">
                  {data.skills.split(',').map((skill, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary/40" />
                      <span className="text-[12px] font-bold uppercase tracking-[0.2em] opacity-60">
                        {skill.trim()}
                      </span>
                    </div>
                  ))}
                </div>
             </Section>
            </div>
         </div>
      </div>
    </div>
  )
}
