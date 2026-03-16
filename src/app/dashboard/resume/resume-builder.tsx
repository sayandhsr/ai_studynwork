"use client"

import React, { useRef, useState } from "react"
import { useReactToPrint } from "react-to-print"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Printer, Save, Loader2, LayoutTemplate } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

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
  "Clear", "Modern", "Classic", "Minimal", "Executive", "Creative", 
  "Academic", "Compact", "Elegant", "Professional", "Sharp", "Soft",
  "Blueprint", "Chalk", "Cyber", "Nature", "Sunset", "Gothic",
  "Journal", "Retro", "Futuristic"
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

  const [activeTemplate, setActiveTemplate] = useState("Elegant")
  const [saving, setSaving] = useState(false)
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

  const updatePersonalInfo = (field: keyof ResumeData["personalInfo"], value: string) => {
    setData(prev => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [field]: value }
    }))
  }

  // --- TEMPLATE ENGINE ---
  
  const getTemplateStyles = () => {
    switch(activeTemplate) {
      case 'Classic': return "font-serif text-[12pt] text-gray-900"
      case 'Modern': return "font-sans text-[11pt] text-slate-800"
      case 'Creative': return "font-sans text-[11pt] text-indigo-900 border-l-[8px] border-indigo-500 pl-8"
      case 'Executive': return "font-serif text-[12pt] text-black border-t-[12px] border-black pt-8"
      case 'Minimal': return "font-sans text-[10pt] text-gray-700 tracking-tight"
      case 'Elegant': return "font-serif text-[12pt] text-slate-900 tracking-wide"
      case 'Signature': return "font-heading italic text-[12pt] text-stone-900"
      default: return "font-sans text-[11pt] text-black"
    }
  }

  const Header = () => {
    const isCentered = !['Creative', 'Executive'].includes(activeTemplate)
    return (
      <div className={`mb-10 ${isCentered ? 'text-center' : 'text-left'} ${['Executive', 'Modern'].includes(activeTemplate) ? 'border-b-2 pb-8' : ''}`}>
        <h1 className={`text-5xl font-heading italic mb-3 ${activeTemplate === 'Modern' ? 'text-primary' : activeTemplate === 'Creative' ? 'text-indigo-600' : 'text-black'}`}>
          {data.personalInfo.fullName}
        </h1>
        <div className="flex flex-wrap items-center justify-center gap-6 text-[10px] font-bold uppercase tracking-[0.2em] opacity-40">
          <span>{data.personalInfo.email}</span>
          <div className="h-1 w-1 rounded-full bg-primary/40" />
          <span>{data.personalInfo.phone}</span>
          <div className="h-1 w-1 rounded-full bg-primary/40" />
          <span>{data.personalInfo.location}</span>
        </div>
      </div>
    )
  }

  const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="mb-10">
      <div className="flex items-center gap-4 mb-6">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.4em] opacity-30 whitespace-nowrap">
          {title}
        </h2>
        <div className="h-px w-full bg-border/20" />
      </div>
      <div>{children}</div>
    </div>
  )

  return (
    <div className="flex flex-col lg:flex-row gap-12 items-start font-serif selection:bg-primary/20 pb-20">
      {/* Form Controls */}
      <div className="w-full lg:w-[450px] shrink-0 space-y-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-px w-6 bg-primary/40" />
            <span className="text-[10px] font-bold tracking-[0.3em] uppercase opacity-60">Design selection</span>
          </div>
          <h3 className="text-2xl font-heading italic">Curated Templates</h3>
          <ScrollArea className="h-[140px] w-full border-border/30 border rounded-none bg-card/50 p-4">
            <div className="grid grid-cols-2 gap-3">
               {TEMPLATES.slice(0, 10).map((tmpl) => (
                  <Button 
                    key={tmpl} 
                    variant="ghost"
                    size="sm"
                    className={`text-[10px] font-bold uppercase tracking-widest h-10 rounded-none border transition-all ${activeTemplate === tmpl ? "bg-primary text-primary-foreground border-primary shadow-lg" : "border-border/30 hover:bg-primary/5"}`}
                    onClick={() => setActiveTemplate(tmpl)}
                  >
                    {tmpl}
                  </Button>
               ))}
            </div>
          </ScrollArea>
        </div>

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
            {/* Fine watermark for luxury templates */}
            <div className="absolute top-8 right-8 text-[8px] font-bold uppercase tracking-[0.5em] opacity-10 select-none">
              Sanctuary Curated
            </div>

            <Header />
            
            <Section title="Narrative">
               <p className="leading-relaxed opacity-80 italic font-light text-lg">{data.personalInfo.summary}</p>
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
                       <p className="text-base leading-relaxed font-light italic opacity-70 border-l border-primary/10 pl-6">{exp.description}</p>
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
  )
}
