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
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden font-serif selection:bg-primary/20">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 md:px-12 py-8 max-w-7xl mx-auto border-b border-border/10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 md:w-12 md:h-12 relative group">
            <div className="absolute inset-0 bg-primary/20 blur-xl group-hover:bg-primary/40 transition-all rounded-full" />
            <BirdLogo className="w-full h-full text-primary relative transition-transform duration-700 group-hover:-rotate-12" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[10px] font-bold tracking-[0.3em] uppercase opacity-40">AI Productivity</span>
            <span className="text-lg md:text-xl font-heading tracking-tight italic text-primary">Hub & Sanctuary</span>
          </div>
        </div>
        <div className="flex items-center gap-4 md:gap-8">
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
          <Button 
            variant="ghost" 
            className="rounded-none px-4 md:px-8 py-6 border-b border-transparent hover:border-primary hover:bg-transparent transition-all uppercase tracking-widest text-[10px] font-bold opacity-60 hover:opacity-100 text-foreground hover:text-primary"
            onClick={handleGoogleLogin}
          >
            Authenticate
          </Button>
        </div>
      </nav>

      {/* Hero Section - Centered & Symmetrical */}
      <section className="max-w-5xl mx-auto px-6 pt-20 md:pt-32 pb-32 text-center space-y-16">
        <motion.div 
          className="space-y-12"
          initial="initial"
          animate="animate"
          variants={fadeInUp}
        >
          <div className="flex justify-center items-center gap-4 mb-4">
             <div className="h-px w-12 md:w-24 bg-primary/30" />
             <span className="text-[10px] font-bold tracking-[0.4em] uppercase opacity-60">Curated for Excellence</span>
             <div className="h-px w-12 md:w-24 bg-primary/30" />
          </div>
          
          <h1 className="text-6xl md:text-9xl font-heading tracking-tighter leading-[0.9] text-balance">
            Elevate <br />
            <span className="italic font-light opacity-80 decoration-primary/20 underline-offset-8">Your Vantage.</span>
          </h1>
          
          <div className="max-w-2xl mx-auto space-y-10">
            <p className="text-xl md:text-2xl text-foreground/70 leading-relaxed font-light italic">
              "In the quiet of the sanctuary, true productivity takes flight."
            </p>
            <div className="flex justify-center pt-4">
              <Button 
                size="lg" 
                className="h-16 px-12 md:px-20 rounded-none text-[10px] font-bold uppercase tracking-[0.3em] bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-700 border border-primary shadow-2xl shadow-primary/20 group"
                onClick={handleGoogleLogin}
                disabled={loading}
              >
                {loading ? <Loader2 className="animate-spin" /> : (
                  <span className="flex items-center gap-3">
                    Enter the Sanctuary
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                  </span>
                )}
              </Button>
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="relative mt-24"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, delay: 0.4 }}
        >
          <div className="absolute -inset-20 bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
          <div className="relative overflow-hidden border border-border/20 shadow-2xl bg-card">
            <img 
              src="/images/human_hero.png" 
              alt="Luxury Sanctuary" 
              className="w-full h-auto grayscale-[0.6] hover:grayscale-0 transition-all duration-[3000ms] ease-out scale-105 hover:scale-100 opacity-90"
            />
            {/* Elegant overlay for mobile/desktop transition */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-60" />
          </div>
        </motion.div>
      </section>

      {/* Features Grid - Centered Harmony */}
      <section className="bg-secondary/10 py-32 md:py-48 border-y border-primary/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-24 md:mb-40 space-y-8">
            <h2 className="text-[10px] font-bold tracking-[0.5em] uppercase opacity-40">The Architecture</h2>
            <h3 className="text-5xl md:text-7xl font-heading tracking-tight italic">Precision meets poetry.</h3>
          </div>

          <div className="grid lg:grid-cols-2 gap-20 md:gap-32">
            {/* Feature 1 */}
            <motion.div 
              className="space-y-12 text-center lg:text-left group"
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 40 }}
              viewport={{ once: true }}
            >
              <div className="relative aspect-[4/5] overflow-hidden border border-border/20 hover:shadow-2xl transition-all duration-1000 shadow-xl">
                <img src="/images/human_yt.png" alt="Visual Scribe" className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all duration-[2000ms] scale-110 group-hover:scale-100" />
                <div className="absolute inset-0 bg-foreground/10 group-hover:bg-transparent transition-colors duration-1000" />
              </div>
              <div className="space-y-8 px-4">
                <div className="space-y-2">
                   <h4 className="text-3xl md:text-4xl font-heading tracking-tight italic text-primary/80 group-hover:text-primary transition-colors">Visual Scribe</h4>
                   <span className="text-[10px] font-bold tracking-widest uppercase opacity-30">Knowledge Extraction</span>
                </div>
                <p className="text-lg md:text-xl text-foreground/60 leading-relaxed font-light italic">
                  Convert complex visual lectures into structured narratives. Let AI distill the essence while you master the flow.
                </p>
                <div className="h-px w-24 bg-primary/20 lg:mx-0 mx-auto" />
              </div>
            </motion.div>
 
            {/* Feature 2 */}
            <motion.div 
              className="space-y-12 text-center lg:text-left group pt-20 lg:pt-48"
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 40 }}
              viewport={{ once: true }}
            >
              <div className="relative aspect-[4/5] overflow-hidden border border-border/20 hover:shadow-2xl transition-all duration-1000 shadow-xl">
                 <img src="/images/human_hero.png" alt="Observation Vault" className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all duration-[2000ms] rotate-1 group-hover:rotate-0 scale-110 group-hover:scale-100" />
                 <div className="absolute inset-0 bg-foreground/10 group-hover:bg-transparent transition-colors duration-1000" />
              </div>
              <div className="space-y-8 px-4">
                <div className="space-y-2">
                   <h4 className="text-3xl md:text-4xl font-heading tracking-tight italic text-primary/80 group-hover:text-primary transition-colors">Thought Archive</h4>
                   <span className="text-[10px] font-bold tracking-widest uppercase opacity-30">Strategic Storage</span>
                </div>
                <p className="text-lg md:text-xl text-foreground/60 leading-relaxed font-light italic">
                  A sanctuary for your observations. Organized, searchable, and infinitely expandable with AI-assisted refinement.
                </p>
                <div className="h-px w-24 bg-primary/20 lg:mx-0 mx-auto" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer - Symmetrical Balance */}
      <footer className="max-w-7xl mx-auto px-6 py-32 text-center space-y-24">
        <div className="flex justify-center items-center gap-6 opacity-30">
           <div className="h-px w-16 md:w-32 bg-primary/40" />
           <BirdLogo className="w-10 h-10 grayscale" />
           <div className="h-px w-16 md:w-32 bg-primary/40" />
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-[10px] font-bold tracking-[0.4em] uppercase opacity-40">
          <a href="#" className="hover:text-primary transition-colors">The Manifesto</a>
          <a href="#" className="hover:text-primary transition-colors">Collection</a>
          <a href="#" className="hover:text-primary transition-colors">Sanctuary Access</a>
          <a href="#" className="hover:text-primary transition-colors">Origins</a>
        </div>

        <div className="pt-20 border-t border-border/20 text-[10px] tracking-[0.3em] uppercase opacity-30 font-bold max-w-2xl mx-auto leading-relaxed">
          <span>&copy; 2026 SANCTUARY HUB. CRAFTED FOR THE INTENTIONAL MIND. ALL RIGHTS RESERVED.</span>
        </div>
      </footer>

    </div>
  );
}
