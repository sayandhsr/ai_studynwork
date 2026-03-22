"use client"

import React, { useRef, useState } from "react"
import { useReactToPrint } from "react-to-print"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Printer, Save, Loader2, LayoutTemplate, Type, Sliders, Type as FontIcon, AlignLeft, Sparkles } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

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
  const resumeRef = useRef<HTMLDivElement>(null)

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
    <div className="flex flex-col lg:flex-row gap-12 items-start font-serif selection:bg-primary/20 pb-20">
      {/* Form Controls */}
      <div className="w-full lg:w-[450px] shrink-0 space-y-8">
          <Tabs defaultValue="template" className="w-full">
            <TabsList className="w-full h-12 rounded-none bg-card/80 border-b border-border/30 mb-6">
              <TabsTrigger value="template" className="flex-1 rounded-none data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                <LayoutTemplate className="w-3 h-3 mr-2" />
                Theme
              </TabsTrigger>
              <TabsTrigger value="typography" className="flex-1 rounded-none data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                <FontIcon className="w-3 h-3 mr-2" />
                Type
              </TabsTrigger>
              <TabsTrigger value="ats" className="flex-1 rounded-none data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                <Sparkles className="w-3 h-3 mr-2" />
                ATS AI
              </TabsTrigger>
            </TabsList>

            <TabsContent value="template" className="space-y-4 m-0">
              <h3 className="text-2xl font-heading italic">Curated Designs</h3>
              <ScrollArea className="h-[140px] w-full border-border/30 border rounded-none bg-card/50 p-4">
                <div className="grid grid-cols-2 gap-3">
               {TEMPLATES.map((tmpl) => (
                  <Button 
                    key={tmpl} 
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "text-[10px] font-bold uppercase tracking-widest h-10 rounded-none border transition-all",
                      activeTemplate === tmpl ? "bg-primary text-primary-foreground border-primary shadow-lg" : "border-border/30 hover:bg-primary/5"
                    )}
                    onClick={() => setActiveTemplate(tmpl)}
                  >
                    {tmpl}
                  </Button>
               ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="typography" className="space-y-6 m-0 pt-2">
              <div className="space-y-4">
                <Label className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-60">Font Family</Label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { name: 'Modern Sans (Inter)', class: 'font-inter' },
                    { name: 'Friendly Sans (Roboto)', class: 'font-roboto' },
                    { name: 'Elegant Serif (Lora)', class: 'font-lora' },
                    { name: 'Classic Serif (Baskerville)', class: 'font-baskerville' },
                    { name: 'Modern Mono (JetBrains)', class: 'font-jetbrains' }
                  ].map((f) => (
                    <Button
                      key={f.class}
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "justify-start text-xs h-10 rounded-none border transition-all px-4",
                        f.class,
                        fontFamily === f.class ? "bg-primary/10 text-primary border-primary/40" : "border-border/30 hover:bg-primary/5"
                      )}
                      onClick={() => setFontFamily(f.class)}
                    >
                      {f.name}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-4">
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-60">Text Size ({fontSize}pt)</Label>
                  <input 
                    type="range" min="8" max="14" step="0.5" 
                    value={fontSize} 
                    onChange={(e) => setFontSize(parseFloat(e.target.value))}
                    className="w-full accent-primary h-1.5 bg-primary/20 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-60">Spacing ({lineHeight})</Label>
                  <input 
                    type="range" min="1.0" max="2.0" step="0.1" 
                    value={lineHeight} 
                    onChange={(e) => setLineHeight(parseFloat(e.target.value))}
                    className="w-full accent-primary h-1.5 bg-primary/20 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="ats" className="space-y-6 m-0 pt-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
               <div className="space-y-6">
                  <div className="p-6 border border-primary/20 bg-primary/5 rounded-none space-y-3">
                    <h3 className="text-xl font-heading italic">AI ATS Power-Up</h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 leading-relaxed">
                      Optimize your resume for specific job roles. Our AI will inject industry keywords and refine your experience using the STAR method.
                    </p>
                  </div>
                  <div className="space-y-4">
                    <Label className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-60">Target Profession</Label>
                    <Input 
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      placeholder="e.g. Senior Backend Architect"
                      className="h-12 rounded-none border-border/30 bg-background/50 italic font-light tracking-wide"
                    />
                    <Button 
                      onClick={optimizeWithAI}
                      disabled={optimizing || !targetRole}
                      className="w-full h-16 gap-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-none uppercase font-black tracking-[0.4em] text-[11px] shadow-2xl transition-all active:scale-95"
                    >
                      {optimizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      {optimizing ? "Optimizing..." : "ATS AI Enhance"}
                    </Button>
                  </div>
               </div>
            </TabsContent>
          </Tabs>

        <Card className="rounded-none border-border/40 border bg-card/50 shadow-2xl relative overflow-hidden">
          <ScrollArea className="h-[600px]">
            <CardContent className="p-10 space-y-10">
              <div className="space-y-6">
                <h3 className="text-[10px] font-bold text-primary uppercase tracking-[0.4em] opacity-60">Identity</h3>
                <div className="space-y-4">
                  <Input 
                    placeholder="Full Name" 
                    value={data.personalInfo.fullName} 
                    onChange={(e) => updatePersonalInfo("fullName", e.target.value)} 
                    className="h-14 rounded-none border-border/30 focus-visible:ring-primary/20 bg-background/50 italic font-light text-lg px-4"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input 
                      placeholder="Email" 
                      value={data.personalInfo.email} 
                      onChange={(e) => updatePersonalInfo("email", e.target.value)} 
                      className="h-14 rounded-none border-border/30 focus-visible:ring-primary/20 bg-background/50 italic font-light text-base px-4"
                    />
                    <Input 
                      placeholder="Phone" 
                      value={data.personalInfo.phone} 
                      onChange={(e) => updatePersonalInfo("phone", e.target.value)} 
                      className="h-14 rounded-none border-border/30 focus-visible:ring-primary/20 bg-background/50 italic font-light text-base px-4"
                    />
                  </div>
                  <Input 
                    placeholder="Location" 
                    value={data.personalInfo.location} 
                    onChange={(e) => updatePersonalInfo("location", e.target.value)} 
                    className="h-14 rounded-none border-border/30 focus-visible:ring-primary/20 bg-background/50 italic font-light text-base px-4"
                  />
                  <Textarea 
                    placeholder="Brief Professional Narrative" 
                    value={data.personalInfo.summary} 
                    onChange={(e) => updatePersonalInfo("summary", e.target.value)} 
                    rows={4}
                    className="rounded-none border-border/30 focus-visible:ring-primary/20 bg-background/50 italic font-light text-base p-4 resize-none leading-relaxed"
                  />
                </div>
              </div>

              <div className="space-y-6 pt-6 border-t border-border/20">
                <h3 className="text-[10px] font-bold text-primary uppercase tracking-[0.4em] opacity-60">Expertise</h3>
                <Textarea 
                  placeholder="e.g. ArtificiaI Intelligence, Strategic Leadership..." 
                  value={data.skills} 
                  onChange={(e) => setData(prev => ({...prev, skills: e.target.value}))} 
                  rows={3}
                  className="rounded-none border-border/30 focus-visible:ring-primary/20 bg-background/50 italic font-light text-base p-4 resize-none leading-relaxed"
                />
              </div>
            </CardContent>
          </ScrollArea>
        </Card>

        <div className="flex flex-col gap-4">
           <Button onClick={() => handlePrint()} className="h-16 rounded-none bg-primary hover:bg-primary/90 transition-all font-bold uppercase tracking-[0.3em] text-xs shadow-xl group">
              <Printer className="w-5 h-5 mr-4 group-hover:scale-110 transition-transform" />
              Obtain High-Res Document
           </Button>
           <Button variant="ghost" onClick={handleSave} disabled={saving} className="h-14 rounded-none border border-primary/20 hover:bg-primary/10 transition-all font-bold uppercase tracking-[0.3em] text-[10px]">
              {saving ? <Loader2 className="w-4 h-4 mr-3 animate-spin" /> : <Save className="w-4 h-4 mr-3" />}
              Commit to Vault
           </Button>
        </div>
      </div>

      {/* Resume Preview */}
      <div className="flex-1 bg-muted/30 p-8 sm:p-16 rounded-none border border-border/30 min-h-[1100px] flex justify-center sticky top-12 shadow-inner overflow-auto">
         <div 
           ref={resumeRef}
           className={`bg-white w-[210mm] min-h-[297mm] p-[30mm] shadow-2xl text-black print:shadow-none print:p-0 ring-1 ring-black/5 ${getTemplateStyles()} relative`}
         >
            <div 
              className="w-full h-full" 
              style={{ fontSize: `${fontSize}pt`, lineHeight: lineHeight }}
            >
              {/* Fine watermark for luxury templates */}
              <div className="absolute top-8 right-8 text-[8px] font-bold uppercase tracking-[0.5em] opacity-10 select-none">
                Sanctuary Curated
              </div>

              <Header />
              
              <Section title="Narrative">
                 <p className="leading-relaxed opacity-80 italic font-light">{data.personalInfo.summary}</p>
              </Section>

              <Section title="Chronicle">
                 <div className="space-y-10">
                   {data.experience.map((exp) => (
                      <div key={exp.id} className="group relative">
                         <div className="flex justify-between items-baseline mb-3">
                            <h3 className="font-heading text-2xl italic tracking-tight group-hover:text-primary transition-colors">{exp.role}</h3>
                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-40 italic">{exp.period}</span>
                         </div>
                         <div className="text-sm font-bold uppercase tracking-[0.2em] mb-4 text-primary/60">
                           {exp.company}
                         </div>
                         <p className="leading-relaxed font-light italic opacity-70 border-l border-primary/10 pl-6">{exp.description}</p>
                      </div>
                   ))}
                 </div>
              </Section>

             <Section title="Foundation">
               <div className="space-y-8">
                 {data.education.map((edu) => (
                    <div key={edu.id} className="flex justify-between items-start">
                       <div className="space-y-1">
                          <h3 className="font-heading text-xl italic">{edu.degree}</h3>
                           <div className="text-[11px] font-bold uppercase tracking-widest opacity-50">{edu.school}</div>
                       </div>
                       <span className="text-[10px] font-bold opacity-30 italic">{edu.year}</span>
                    </div>
                 ))}
               </div>
             </Section>

             <Section title="Arsenal">
                <div className="flex flex-wrap gap-x-8 gap-y-4">
                  {data.skills.split(',').map((skill, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="h-1 w-1 rounded-full bg-primary/40" />
                      <span className="text-xs font-bold uppercase tracking-widest opacity-60">
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
