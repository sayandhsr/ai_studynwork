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

  const [activeTemplate, setActiveTemplate] = useState("Clear")
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
      case 'Blueprint': return "font-mono text-[11pt] text-blue-900 bg-blue-50/20"
      case 'Sunset': return "font-sans text-[11pt] text-orange-950 border-orange-200"
      case 'Cyber': return "font-mono text-[11pt] text-emerald-900 border-emerald-200"
      case 'Nature': return "font-sans text-[11pt] text-green-950 border-green-200"
      case 'Futuristic': return "font-sans text-[11pt] text-zinc-900 uppercase tracking-widest"
      default: return "font-sans text-[11pt] text-black"
    }
  }

  const Header = () => {
    const isCentered = !['Creative', 'Executive', 'Futuristic'].includes(activeTemplate)
    return (
      <div className={`mb-8 ${isCentered ? 'text-center' : 'text-left'} ${['Executive', 'Modern'].includes(activeTemplate) ? 'border-b-2 pb-6' : ''}`}>
        <h1 className={`text-4xl font-black mb-2 ${activeTemplate === 'Modern' ? 'text-primary' : activeTemplate === 'Creative' ? 'text-indigo-600' : 'text-black'}`}>
          {data.personalInfo.fullName}
        </h1>
        <div className="flex flex-wrap gap-4 text-sm font-medium opacity-70">
          <span>{data.personalInfo.email}</span>
          <span>{data.personalInfo.phone}</span>
          <span>{data.personalInfo.location}</span>
        </div>
      </div>
    )
  }

  const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className={`mb-8 ${activeTemplate === 'Futuristic' ? 'border-l-4 border-black pl-4' : ''}`}>
      <h2 className={`text-xs font-black uppercase tracking-[0.2em] mb-4 
        ${['Modern', 'Clear', 'Compact'].includes(activeTemplate) ? 'text-primary border-b border-primary/20 pb-1' : 'text-gray-500'}`}>
        {title}
      </h2>
      <div>{children}</div>
    </div>
  )

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start">
      {/* Form Controls */}
      <div className="w-full lg:w-[400px] shrink-0 space-y-6">
        <div className="space-y-3">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <LayoutTemplate className="w-4 h-4 text-primary" />
            21 Premium Templates
          </h3>
          <ScrollArea className="h-[120px] w-full border rounded-xl bg-card p-2">
            <div className="grid grid-cols-3 gap-2">
               {TEMPLATES.map((tmpl) => (
                  <Button 
                    key={tmpl} 
                    variant={activeTemplate === tmpl ? "default" : "outline"} 
                    size="sm"
                    className="text-[10px] h-8 truncate px-1"
                    onClick={() => setActiveTemplate(tmpl)}
                  >
                    {tmpl}
                  </Button>
               ))}
            </div>
          </ScrollArea>
        </div>

        <Card className="border-primary/10 shadow-sm overflow-hidden rounded-2xl">
          <ScrollArea className="h-[500px]">
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <h3 className="font-bold text-sm text-primary uppercase tracking-widest">Personal Info</h3>
                <Input 
                  placeholder="Full Name" 
                  value={data.personalInfo.fullName} 
                  onChange={(e) => updatePersonalInfo("fullName", e.target.value)} 
                  className="rounded-xl border-primary/5"
                />
                <Input 
                  placeholder="Email" 
                  value={data.personalInfo.email} 
                  onChange={(e) => updatePersonalInfo("email", e.target.value)} 
                  className="rounded-xl border-primary/5"
                />
                <Input 
                  placeholder="Phone" 
                  value={data.personalInfo.phone} 
                  onChange={(e) => updatePersonalInfo("phone", e.target.value)} 
                  className="rounded-xl border-primary/5"
                />
                <Input 
                  placeholder="Location" 
                  value={data.personalInfo.location} 
                  onChange={(e) => updatePersonalInfo("location", e.target.value)} 
                  className="rounded-xl border-primary/5"
                />
                <Textarea 
                  placeholder="Professional Summary" 
                  value={data.personalInfo.summary} 
                  onChange={(e) => updatePersonalInfo("summary", e.target.value)} 
                  rows={4}
                  className="rounded-xl border-primary/5 resize-none"
                />
              </div>

              <div className="space-y-4 pt-4 border-t border-primary/5">
                <h3 className="font-bold text-sm text-primary uppercase tracking-widest">Skills</h3>
                <Textarea 
                  placeholder="e.g. React, Node.js, SQL..." 
                  value={data.skills} 
                  onChange={(e) => setData(prev => ({...prev, skills: e.target.value}))} 
                  rows={3}
                  className="rounded-xl border-primary/5 resize-none"
                />
              </div>
            </CardContent>
          </ScrollArea>
        </Card>

        <div className="flex flex-col gap-3">
           <Button onClick={() => handlePrint()} className="w-full rounded-xl py-6 bg-secondary text-secondary-foreground hover:bg-secondary/80 font-bold tracking-tight shadow-lg shadow-secondary/20">
              <Printer className="w-5 h-5 mr-3" />
              Download High-Res PDF
           </Button>
           <Button onClick={handleSave} disabled={saving} className="w-full rounded-xl py-6 font-bold tracking-tight shadow-lg shadow-primary/20">
              {saving ? <Loader2 className="w-5 h-5 mr-3 animate-spin" /> : <Save className="w-5 h-5 mr-3" />}
              Save Progress
           </Button>
        </div>
      </div>

      {/* Resume Preview */}
      <div className="flex-1 bg-secondary/10 p-4 sm:p-12 rounded-[2rem] border-2 border-dashed border-primary/10 min-h-[1000px] flex justify-center sticky top-8">
         <div 
           ref={resumeRef}
           className={`bg-white w-[210mm] min-h-[297mm] p-[25mm] shadow-2xl text-black print:shadow-none print:p-0 ring-1 ring-black/5 ${getTemplateStyles()}`}
         >
            <Header />
            
            <Section title="Professional Summary">
               <p className="leading-relaxed opacity-80">{data.personalInfo.summary}</p>
            </Section>

            <Section title="Experience">
               <div className="space-y-6">
                 {data.experience.map((exp) => (
                    <div key={exp.id} className="group">
                       <div className="flex justify-between items-baseline mb-2">
                          <h3 className="font-black text-lg group-hover:text-primary transition-colors">{exp.role}</h3>
                          <span className="text-sm font-bold opacity-60 bg-secondary/30 px-2 py-0.5 rounded leading-none">{exp.period}</span>
                       </div>
                       <div className={`text-sm font-bold mb-3 ${activeTemplate === 'Creative' ? 'text-indigo-600' : 'text-gray-500'}`}>
                         {exp.company}
                       </div>
                       <p className="text-sm leading-relaxed opacity-70">{exp.description}</p>
                    </div>
                 ))}
               </div>
            </Section>

             <Section title="Education">
               <div className="space-y-4">
                 {data.education.map((edu) => (
                    <div key={edu.id} className="flex justify-between items-start">
                       <div>
                          <h3 className="font-black">{edu.degree}</h3>
                           <div className="text-sm opacity-60 font-medium">{edu.school}</div>
                       </div>
                       <span className="text-sm font-bold opacity-40">{edu.year}</span>
                    </div>
                 ))}
               </div>
             </Section>

             <Section title="Technical Expertise">
                <div className="flex flex-wrap gap-2">
                  {data.skills.split(',').map((skill, i) => (
                    <span key={i} className="text-xs font-bold px-3 py-1 bg-secondary/20 rounded-full">
                      {skill.trim()}
                    </span>
                  ))}
                </div>
             </Section>
         </div>
      </div>
    </div>
  )
}
