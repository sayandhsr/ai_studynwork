"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useState } from "react";
import { Loader2, ArrowRight } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

import { BirdLogo } from "@/components/bird-logo";

export default function LandingPage() {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleGoogleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error("Login failed:", error.message);
      setLoading(false);
    }
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8 }
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden font-sans selection:bg-primary/20">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 md:px-12 py-6 max-w-7xl mx-auto ios-blur sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 md:w-12 md:h-12 relative group">
            <div className="absolute inset-0 bg-primary/10 blur-xl group-hover:bg-primary/20 transition-all rounded-full" />
            <BirdLogo className="w-full h-full text-primary relative transition-transform duration-500 group-hover:scale-110" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-40">AI Productivity</span>
            <span className="text-lg md:text-xl font-bold tracking-tight text-foreground">Sanctuary</span>
          </div>
        </div>
        <div className="flex items-center gap-4 md:gap-8">
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
          <Button 
            variant="ghost" 
            className="rounded-2xl px-6 py-5 text-sm font-semibold text-foreground hover:bg-primary/5 hover:text-primary transition-all"
            onClick={handleGoogleLogin}
          >
            Authenticate
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-6 pt-24 md:pt-32 pb-32 text-center space-y-16">
        <motion.div 
          className="space-y-10"
          initial="initial"
          animate="animate"
          variants={fadeInUp}
        >
          <div className="flex justify-center items-center gap-3 mb-2">
             <div className="h-[1px] w-8 md:w-16 bg-primary/20" />
             <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-primary/60">Crafted for Clarity</span>
             <div className="h-[1px] w-8 md:w-16 bg-primary/20" />
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.95] text-foreground">
            Elevate Your <br />
            <span className="text-primary">Intelligence.</span>
          </h1>
          
          <div className="max-w-2xl mx-auto space-y-10">
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed font-medium">
              A premium space for notes, research, and video intelligence. <br/>
              Where deep focus meets powerful AI.
            </p>
            <div className="flex justify-center pt-4">
              <Button 
                size="lg" 
                className="h-16 px-12 md:px-16 rounded-[24px] text-base font-bold bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 shadow-2xl shadow-primary/20 premium-hover group"
                onClick={handleGoogleLogin}
                disabled={loading}
              >
                {loading ? <Loader2 className="animate-spin" /> : (
                  <span className="flex items-center gap-3">
                    Enter the Sanctuary
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </Button>
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="relative mt-20"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.2 }}
        >
          <div className="absolute -inset-20 bg-primary/5 blur-[100px] rounded-full pointer-events-none" />
          <div className="relative overflow-hidden rounded-[32px] ios-shadow border border-border bg-card p-2">
            <div className="overflow-hidden rounded-[24px]">
              <img 
                src="/images/human_hero.png" 
                alt="Productivity Dashboard" 
                className="w-full h-auto opacity-95 hover:opacity-100 transition-opacity duration-700"
              />
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="bg-secondary/30 py-32 md:py-40 border-y border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-24 md:mb-32 space-y-4">
            <h2 className="text-[10px] font-bold tracking-[0.4em] uppercase text-primary">The Architecture</h2>
            <h3 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground">Optimized for depth.</h3>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 md:gap-20">
            {/* Feature 1 */}
            <motion.div 
              className="group space-y-8"
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 20 }}
              viewport={{ once: true }}
            >
              <div className="relative aspect-video overflow-hidden rounded-[28px] ios-shadow border border-border bg-card p-2 group-hover:border-primary/20 transition-all duration-500">
                <div className="w-full h-full overflow-hidden rounded-[20px]">
                  <img src="/images/human_yt.png" alt="Intelligence" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                </div>
              </div>
              <div className="space-y-4 px-2">
                 <div className="space-y-1">
                    <span className="text-[10px] font-bold tracking-widest uppercase text-primary/60">Video Intelligence</span>
                    <h4 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Visual Scribe</h4>
                 </div>
                 <p className="text-base md:text-lg text-muted-foreground leading-relaxed font-medium">
                   Distill hours of video into structured intelligence. Capture every detail without losing focus on the flow.
                 </p>
                 <div className="h-[2px] w-12 bg-primary/20" />
              </div>
            </motion.div>
 
            {/* Feature 2 */}
            <motion.div 
              className="group space-y-8 lg:mt-32"
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 20 }}
              viewport={{ once: true }}
            >
              <div className="relative aspect-video overflow-hidden rounded-[28px] ios-shadow border border-border bg-card p-2 group-hover:border-primary/20 transition-all duration-500">
                <div className="w-full h-full overflow-hidden rounded-[20px]">
                  <img src="/images/human_hero.png" alt="Knowledge" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                </div>
              </div>
              <div className="space-y-4 px-2">
                <div className="space-y-1">
                   <span className="text-[10px] font-bold tracking-widest uppercase text-primary/60">Strategic Archive</span>
                   <h4 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Observation Vault</h4>
                </div>
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed font-medium">
                  A premium sanctuary for your observations. Organized, searchable, and always accessible for your growth.
                </p>
                <div className="h-[2px] w-12 bg-primary/20" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-24 text-center space-y-16">
        <div className="flex justify-center items-center gap-4 opacity-20">
           <div className="h-[1px] w-12 md:w-24 bg-foreground" />
           <BirdLogo className="w-8 h-8" />
           <div className="h-[1px] w-12 md:w-24 bg-foreground" />
        </div>
        
        <div className="flex flex-wrap justify-center gap-8 md:gap-16 text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground">
          <a href="#" className="hover:text-primary transition-colors">Manifesto</a>
          <a href="#" className="hover:text-primary transition-colors">Architecture</a>
          <a href="#" className="hover:text-primary transition-colors">Origins</a>
          <a href="#" className="hover:text-primary transition-colors">Support</a>
        </div>

        <div className="pt-10 text-[10px] tracking-[0.2em] uppercase text-muted-foreground/40 font-bold max-w-2xl mx-auto leading-relaxed">
          <span>&copy; 2026 SANCTUARY. DESIGNED FOR PERFORMANCE. ALL RIGHTS RESERVED.</span>
        </div>
      </footer>

    </div>
  );
}
