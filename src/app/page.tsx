"use client";

import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Cloud, Sparkles, Shield, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as any },
    },
  };

  return (
    <div className="relative min-h-screen w-full bg-[#FDFCFB] dark:bg-black overflow-hidden flex flex-col md:flex-row font-sans">
      {/* Cinematic Depth Layers */}
      <div className="fixed inset-0 grain-overlay z-[50]" />
      <div className="fixed inset-0 vignette-effect z-[40]" />
      
      {/* Animated Background Depth */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] animate-pulse [animation-delay:2s]" />

      {/* Theme Toggle Floating */}
      <div className="absolute top-8 right-8 z-[100]">
        <ThemeToggle />
      </div>

      {/* LEFT SIDE: Cinematic Branding */}
      <div className="flex-1 flex flex-col justify-center p-12 md:p-24 lg:p-32 relative z-10">
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="space-y-10 max-w-2xl"
        >
          <motion.div variants={itemVariants} className="flex items-center gap-4">
            <div className="h-14 w-14 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground shadow-2xl shadow-primary/20 scale-110">
              <Cloud className="w-7 h-7" />
            </div>
            <div className="h-[1px] w-12 bg-primary/30" />
            <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-primary/60">Node Sanctuary 1.0</span>
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-6">
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-foreground leading-[0.85]">
              Unified <br/>
              <span className="text-primary italic relative">
                Intelligence.
                <motion.span 
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ delay: 1.5, duration: 1.2, ease: "circOut" }}
                  className="absolute bottom-4 left-0 h-2 bg-primary/10 -z-10"
                />
              </span>
            </h1>
            <p className="text-xl text-muted-foreground font-medium max-w-lg leading-relaxed opacity-80">
              The premium command center for technical synthesis, persistent research, and career trajectory management.
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="flex flex-wrap gap-8 items-center pt-8">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 w-10 rounded-full border-2 border-background bg-secondary flex items-center justify-center overflow-hidden ios-shadow">
                  <div className="h-full w-full bg-gradient-to-br from-primary/20 to-primary/5 capitalize font-black text-[10px] flex items-center justify-center">S</div>
                </div>
              ))}
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Trusted by <span className="text-foreground">2,400+</span> Engineers
            </p>
          </motion.div>
        </motion.div>
      </div>

      {/* RIGHT SIDE: Glassmorphism Login */}
      <div className="flex-1 flex items-center justify-center p-8 md:p-24 relative z-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] as any, delay: 0.4 }}
          className="w-full max-w-md"
        >
          <div className="glass p-12 rounded-[48px] space-y-10 relative overflow-hidden backdrop-blur-3xl shadow-2xl border border-white/20">
            <div className="space-y-3 relative z-10 text-center">
              <h2 className="text-3xl font-black tracking-tight text-foreground">Access Protocol</h2>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] opacity-60">Authorize Terminal Identity</p>
            </div>

            <div className="space-y-6 relative z-10">
              <Button 
                onClick={handleGoogleLogin} 
                disabled={loading}
                className="w-full h-16 bg-primary hover:bg-primary/90 text-primary-foreground rounded-[24px] font-bold text-sm tracking-tight transition-all premium-hover flex items-center justify-center gap-4 group"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                  <>
                    <Cloud className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span>Initialize with Google Cloud</span>
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </>
                )}
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-foreground/5"></div></div>
                <div className="relative flex justify-center text-[8px] uppercase tracking-[0.5em] font-bold text-muted-foreground/40 bg-transparent px-4">
                  Secured Access Only
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button variant="ghost" className="h-14 rounded-2xl border border-border/40 hover:bg-secondary/40 text-[10px] font-bold uppercase tracking-widest text-muted-foreground transition-all premium-hover">
                   Legacy Auth
                </Button>
                <Button variant="ghost" className="h-14 rounded-2xl border border-border/40 hover:bg-secondary/40 text-[10px] font-bold uppercase tracking-widest text-muted-foreground transition-all premium-hover">
                   Key Inquiry
                </Button>
              </div>
            </div>

            <div className="pt-6 text-center relative z-10">
               <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10">
                 <Shield className="w-3 h-3 text-primary" />
                 <span className="text-[8px] font-bold uppercase tracking-widest text-primary/80">AES-256 Encryption Active</span>
               </div>
            </div>

            {/* Subtle Gradient Background inside card */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl opacity-50" />
          </div>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ delay: 2, duration: 1 }}
            className="text-center mt-12 text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground"
          >
            © 2026 Sanctuary Neural Systems. All Rights Reserved.
          </motion.p>
        </motion.div>
      </div>

      {/* Subtle Foreground Grain */}
      <div className="fixed inset-0 pointer-events-none z-[200] opacity-[0.02] grain-overlay" />
    </div>
  );
}
