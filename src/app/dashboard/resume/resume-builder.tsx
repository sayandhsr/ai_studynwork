"use client"

import React, { useRef, useState } from "react"
import { useReactToPrint } from "react-to-print"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Printer, Save, Loader2, LayoutTemplate } from "lucide-react"

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

const TEMPLATES = ["Clear", "Modern", "Classic", "Minimal"]

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
      { id: "1", company: "TechNova", role: "Senior Developer", period: "2020 - Present", description: "Led frontend team. Improved performance by 40%." },
      { id: "2", company: "StartUp Inc", role: "Software Engineer", period: "2018 - 2020", description: "Developed main product features using React and Node.js." }
    ],
    education: [
      { id: "1", school: "University of Tech", degree: "BS Computer Science", year: "2018" }
    ],
    skills: "JavaScript, TypeScript, React, Next.js, Node.js, SQL, TailwindCSS"
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

  // Basic ATS-friendly layout components
  const Header = () => (
    <div className={`text-center border-b pb-4 mb-4 ${activeTemplate === 'Classic' ? 'border-b-2 border-black' : ''}`}>
      <h1 className={`text-3xl font-bold uppercase tracking-wider ${activeTemplate === 'Modern' ? 'text-primary' : 'text-black'}`}>
        {data.personalInfo.fullName}
      </h1>
      <div className="text-sm mt-2 flex flex-wrap justify-center gap-3 text-gray-600">
        <span>{data.personalInfo.email}</span>
        <span>•</span>
        <span>{data.personalInfo.phone}</span>
        <span>•</span>
        <span>{data.personalInfo.location}</span>
      </div>
    </div>
  )

  const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="mb-6">
      <h2 className={`text-lg font-bold uppercase tracking-widest mb-3 ${activeTemplate === 'Clear' ? 'border-b border-gray-300 pb-1' : ''}`}>
        {title}
      </h2>
      <div>{children}</div>
    </div>
  )

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Form Controls */}
      <div className="w-full lg:w-1/3 space-y-6">
        <div className="flex flex-wrap gap-2">
           {TEMPLATES.map((tmpl) => (
              <Button 
                key={tmpl} 
                variant={activeTemplate === tmpl ? "default" : "outline"} 
                size="sm"
                onClick={() => setActiveTemplate(tmpl)}
              >
                <LayoutTemplate className="w-4 h-4 mr-2" />
                {tmpl}
              </Button>
           ))}
        </div>

        <Card>
          <CardContent className="p-4 space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Personal Info</h3>
            <Input 
              placeholder="Full Name" 
              value={data.personalInfo.fullName} 
              onChange={(e) => updatePersonalInfo("fullName", e.target.value)} 
            />
             <Input 
              placeholder="Email" 
              value={data.personalInfo.email} 
              onChange={(e) => updatePersonalInfo("email", e.target.value)} 
            />
             <Input 
              placeholder="Phone" 
              value={data.personalInfo.phone} 
              onChange={(e) => updatePersonalInfo("phone", e.target.value)} 
            />
            <Input 
              placeholder="Location" 
              value={data.personalInfo.location} 
              onChange={(e) => updatePersonalInfo("location", e.target.value)} 
            />
            <Textarea 
              placeholder="Professional Summary" 
              value={data.personalInfo.summary} 
              onChange={(e) => updatePersonalInfo("summary", e.target.value)} 
              rows={3}
            />

            <h3 className="font-semibold text-lg border-b pb-2 pt-4">Skills</h3>
            <Textarea 
              placeholder="Comma separated skills" 
              value={data.skills} 
              onChange={(e) => setData(prev => ({...prev, skills: e.target.value}))} 
              rows={2}
            />
          </CardContent>
        </Card>

        <div className="flex gap-2">
           <Button onClick={() => handlePrint()} className="flex-1" variant="secondary">
              <Printer className="w-4 h-4 mr-2" />
              Download PDF
           </Button>
           <Button onClick={handleSave} disabled={saving} className="flex-1">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Resume
           </Button>
        </div>
      </div>

      {/* Resume Preview */}
      <div className="w-full lg:w-2/3 bg-gray-100 p-4 sm:p-8 rounded-xl overflow-auto flex justify-center border shadow-inner">
         {/* A4 Size Ratio wrapper for rendering preview and print */}
         <div 
           ref={resumeRef}
           className="bg-white w-[210mm] min-h-[297mm] p-[20mm] shadow-md text-black print:shadow-none print:p-0"
           style={{ fontFamily: activeTemplate === 'Classic' ? 'serif' : 'sans-serif' }}
         >
            <Header />
            
            <Section title="Summary">
               <p className="text-sm leading-relaxed">{data.personalInfo.summary}</p>
            </Section>

            <Section title="Experience">
               <div className="space-y-4">
                 {data.experience.map((exp) => (
                    <div key={exp.id}>
                       <div className="flex justify-between items-baseline mb-1">
                          <h3 className="font-bold">{exp.role}</h3>
                          <span className="text-sm text-gray-600">{exp.period}</span>
                       </div>
                       <div className="text-sm italic text-gray-700 mb-1">{exp.company}</div>
                       <p className="text-sm leading-relaxed">{exp.description}</p>
                    </div>
                 ))}
               </div>
            </Section>

             <Section title="Education">
               <div className="space-y-3">
                 {data.education.map((edu) => (
                    <div key={edu.id} className="flex justify-between items-baseline">
                       <div>
                          <h3 className="font-bold">{edu.degree}</h3>
                          <div className="text-sm text-gray-700">{edu.school}</div>
                       </div>
                       <span className="text-sm text-gray-600">{edu.year}</span>
                    </div>
                 ))}
               </div>
             </Section>

             <Section title="Skills">
                <p className="text-sm leading-relaxed">{data.skills}</p>
             </Section>
         </div>
      </div>
    </div>
  )
}
