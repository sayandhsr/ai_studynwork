"use client";

import { motion } from "framer-motion";
import { 
  FileText, Youtube, Briefcase, 
  Search, Plus, Sparkles, Clock, ArrowRight
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

// Cinematic Motion Tokens
const containerVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as any,
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as any },
  },
};

const countVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 1 } }
};

function CountUp({ value }: { value: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) { setCount(end); return; }
    
    let totalDuration = 1000;
    let incrementTime = (totalDuration / end);
    
    let timer = setInterval(() => {
      start += 1;
      setCount(start);
      if (start === end) clearInterval(timer);
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value]);

  return <span>{count}</span>;
}

export function DashboardContent({ stats, recentNotes }: { stats: any[], recentNotes: any[] }) {
  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="max-w-6xl mx-auto px-6 py-16 space-y-24"
    >
      {/* Level 1: Editorial Welcome */}
      <motion.div variants={itemVariants} className="space-y-6">
        <div className="flex items-center gap-3 mb-2">
           <motion.div 
             initial={{ width: 0 }}
             animate={{ width: 32 }}
             transition={{ delay: 0.5, duration: 0.8 }}
             className="h-[1px] bg-primary/40" 
           />
           <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-primary/70">Intelligence Protocol: Online</span>
        </div>
        <div className="space-y-2">
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-foreground leading-[0.9]">
            Welcome to the <br/>
            <span className="text-primary italic relative">
              Sanctuary.
              <motion.span 
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ delay: 1, duration: 1, ease: "circOut" }}
                className="absolute bottom-2 left-0 h-1 bg-primary/10 -z-10"
              />
            </span>
          </h1>
        </div>
        <p className="text-lg text-muted-foreground font-medium max-w-xl leading-relaxed opacity-80">
          Your centralized intelligence hub for technical notes, video synthesis, and strategic job discovery.
        </p>
      </motion.div>

      {/* Level 2: Quick Actions - Interactive Tiles */}
      <motion.div 
        variants={itemVariants}
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
      >
        {[
          { label: "Create Note", icon: Plus, href: "/dashboard/notes/new", color: "text-blue-500", bg: "bg-blue-500/5" },
          { label: "Youtube Scribe", icon: Youtube, href: "/dashboard/youtube", color: "text-red-500", bg: "bg-red-500/5" },
          { label: "Deep Research", icon: Search, href: "/dashboard/research", color: "text-purple-500", bg: "bg-purple-500/5" },
          { label: "Career Search", icon: Briefcase, href: "/dashboard/jobs", color: "text-emerald-500", bg: "bg-emerald-500/5" },
        ].map((action, idx) => (
          <motion.div key={action.label} variants={itemVariants}>
            <Button variant="outline" asChild className="group w-full h-32 rounded-[32px] ios-card ios-shadow border-border/40 bg-card/40 hover:bg-secondary/40 premium-hover">
              <Link href={action.href} className="flex flex-col items-center justify-center gap-4 px-4 overflow-hidden relative">
                <div className={`p-4 rounded-2xl ${action.bg} ${action.color} group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-inner`}>
                  <action.icon className="h-6 w-6" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-60 group-hover:opacity-100 group-hover:tracking-[0.4em] transition-all">{action.label}</span>
                {/* Subtle Glow Effect */}
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </Link>
            </Button>
          </motion.div>
        ))}
      </motion.div>

      {/* Level 3: Stats Cards - Data Count-up */}
      <motion.div 
        variants={itemVariants}
        whileInView="visible"
        viewport={{ once: true }}
        className="grid grid-cols-1 md:grid-cols-3 gap-10"
      >
        {stats.map((stat) => (
          <motion.div 
            key={stat.label} 
            variants={itemVariants}
            className="ios-card ios-shadow p-10 flex items-center justify-between group cursor-default relative overflow-hidden"
          >
            <div className="space-y-3 relative z-10">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] opacity-40">{stat.label}</p>
              <div className="flex items-baseline gap-1">
                <p className="text-6xl font-black tracking-tighter text-foreground group-hover:text-primary transition-colors duration-500">
                  <CountUp value={stat.value} />
                </p>
                <span className="text-primary opacity-0 group-hover:opacity-100 transition-opacity">+</span>
              </div>
            </div>
            <div className={`h-16 w-16 rounded-[24px] ${stat.bg} ${stat.color} flex items-center justify-center ios-shadow group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500 relative z-10`}>
              <stat.icon className="h-8 w-8" />
            </div>
            {/* Background Parallax Icon */}
            <stat.icon className="absolute -right-4 -bottom-4 h-32 w-32 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-700 -rotate-12" />
          </motion.div>
        ))}
      </motion.div>

      {/* Level 4: Recent Notes - Activity Flow */}
      <motion.div 
        variants={itemVariants}
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        className="space-y-10"
      >
        <div className="flex items-center justify-between border-b border-border/60 pb-8">
          <div className="flex items-center gap-6">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
              <Clock className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-bold uppercase tracking-[0.4em] text-foreground">Recent Intel</h3>
              <p className="text-[10px] font-medium text-muted-foreground opacity-60">Synchronized with Sanctuary Neural Link</p>
            </div>
          </div>
          <Link href="/dashboard/notes" className="group flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-primary hover:opacity-70 transition-all">
            Expand All
            <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {recentNotes.length ? (
            recentNotes.map((note) => (
              <motion.div key={note.id} variants={itemVariants}>
                <Link href={`/dashboard/notes/${note.id}`} className="group p-10 ios-card ios-shadow hover:border-primary/30 transition-all premium-hover flex justify-between items-center bg-card/20 overflow-hidden relative">
                  <div className="space-y-4 relative z-10">
                    <h4 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors duration-500 tracking-tight">{note.title || "Observation Update"}</h4>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/50 border border-border/50">
                        <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-[0.1em]">Captured</span>
                        <span className="text-[9px] text-foreground font-bold">{new Date(note.created_at).toLocaleDateString()}</span>
                      </div>
                      <Sparkles className="h-3 w-3 text-primary opacity-30 group-hover:opacity-100 group-hover:scale-125 transition-all" />
                    </div>
                  </div>
                  <div className="h-12 w-12 rounded-full border border-border/60 flex items-center justify-center group-hover:border-primary/40 group-hover:bg-primary/5 transition-all duration-500 relative z-10">
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-1" />
                  </div>
                  {/* Subtle Card Glow */}
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/[0.02] to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                </Link>
              </motion.div>
            ))
          ) : (
            <motion.div variants={itemVariants} className="col-span-full py-32 text-center ios-shadow border border-dashed border-border/60 rounded-[48px] bg-secondary/5 backdrop-blur-sm">
              <div className="h-14 w-14 rounded-full bg-primary/5 flex items-center justify-center mx-auto mb-8 shadow-inner">
                <Sparkles className="h-7 w-7 text-primary opacity-20" />
              </div>
              <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-[0.4em]">Initialize intelligence capture</p>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
