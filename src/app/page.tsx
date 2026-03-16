"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useState } from "react";
import { Loader2, ArrowRight } from "lucide-react";
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

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8 }
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden font-serif selection:bg-primary/20">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-8 max-w-7xl mx-auto border-b border-border/50">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 relative group">
            <div className="absolute inset-0 bg-primary/20 blur-xl group-hover:bg-primary/40 transition-all rounded-full" />
            <img src="/images/human_logo.png" alt="Hub Logo" className="w-full h-full object-contain relative transition-transform duration-700 group-hover:rotate-12" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-[0.3em] uppercase opacity-80">AI Productivity</span>
            <span className="text-xl font-heading tracking-tight italic">Hub & Sanctuary</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <ThemeToggle />
          <Button 
            variant="ghost" 
            className="rounded-none px-8 py-6 border-b border-transparent hover:border-primary hover:bg-transparent transition-all uppercase tracking-widest text-xs font-bold"
            onClick={handleGoogleLogin}
          >
            My Account
          </Button>
        </div>
      </nav>

      {/* Hero Section - Centered & Symmetrical */}
      <section className="max-w-5xl mx-auto px-8 pt-24 pb-32 text-center space-y-12">
        <motion.div 
          className="space-y-12"
          initial="initial"
          animate="animate"
          variants={fadeInUp}
        >
          <div className="flex justify-center mb-4">
             <div className="h-px w-24 bg-primary/30 my-auto" />
             <span className="mx-6 text-[10px] font-bold tracking-[0.4em] uppercase opacity-60">The Latest Collection</span>
             <div className="h-px w-24 bg-primary/30 my-auto" />
          </div>
          
          <h1 className="text-7xl md:text-9xl font-heading tracking-tighter leading-[0.8] text-balance">
            Capture <br />
            <span className="italic font-light opacity-80">Silent Wisdom.</span>
          </h1>
          
          <div className="max-w-2xl mx-auto space-y-8">
            <p className="text-2xl text-foreground/70 leading-relaxed font-light italic">
              "Technology should serve the human soul, not replace it."
            </p>
            <div className="flex justify-center gap-8 pt-4">
              <Button 
                size="lg" 
                className="h-16 px-16 rounded-none text-xs font-bold uppercase tracking-[0.2em] bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-500 border border-primary"
                onClick={handleGoogleLogin}
                disabled={loading}
              >
                {loading ? <Loader2 className="animate-spin" /> : "Enter the Sanctuary"}
              </Button>
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="relative mt-24"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, delay: 0.4 }}
        >
          <div className="absolute -inset-20 bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
          <div className="relative overflow-hidden border border-border/40 shadow-[0_48px_100px_-24px_rgba(0,0,0,0.3)]">
            <img 
              src="/images/human_hero.png" 
              alt="Luxury Workspace" 
              className="w-full h-auto grayscale-[0.4] hover:grayscale-0 transition-all duration-[3000ms] ease-out scale-105 hover:scale-100"
            />
          </div>
        </motion.div>
      </section>

      {/* Features Grid - Centered Harmony */}
      <section className="bg-secondary/30 py-40 border-y border-border/20">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-32 space-y-8">
            <h2 className="text-sm font-bold tracking-[0.5em] uppercase opacity-50">Our Capabilities</h2>
            <h3 className="text-5xl md:text-6xl font-heading tracking-tight">Crafted for the human mind.</h3>
          </div>

          <div className="grid lg:grid-cols-2 gap-24">
            {/* Feature 1 */}
            <motion.div 
              className="space-y-12 text-center lg:text-left group"
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 40 }}
              viewport={{ once: true }}
            >
              <div className="relative aspect-[4/5] overflow-hidden border border-border/40 hover:shadow-2xl transition-all duration-1000">
                <img src="/images/human_yt.png" alt="Visual Scribe" className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-[2000ms]" />
                <div className="absolute inset-0 bg-background/20 group-hover:bg-transparent transition-colors duration-1000" />
              </div>
              <div className="space-y-6 px-4">
                <h4 className="text-4xl font-heading tracking-tight italic">Visual Scribe</h4>
                <div className="h-px w-12 bg-primary/40 mx-auto lg:mx-0" />
                <p className="text-xl text-foreground/70 leading-relaxed font-light">
                  Convert complex lectures into structured chapters. DeepSeek extracts the essence while you focus on the flow.
                </p>
                <Button variant="link" className="p-0 text-xs font-bold uppercase tracking-widest text-primary border-b border-primary/20 hover:border-primary transition-all">
                  See all features
                </Button>
              </div>
            </motion.div>

            {/* Feature 2 */}
            <motion.div 
              className="space-y-12 text-center lg:text-left group pt-24 lg:pt-48"
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 40 }}
              viewport={{ once: true }}
            >
              <div className="relative aspect-[4/5] overflow-hidden border border-border/40 hover:shadow-2xl transition-all duration-1000">
                 <img src="/images/human_hero.png" alt="Knowledge Vault" className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-[2000ms] rotate-1" />
                 <div className="absolute inset-0 bg-background/20 group-hover:bg-transparent transition-colors duration-1000" />
              </div>
              <div className="space-y-6 px-4">
                <h4 className="text-4xl font-heading tracking-tight italic">Knowledge Vault</h4>
                <div className="h-px w-12 bg-primary/40 mx-auto lg:mx-0" />
                <p className="text-xl text-foreground/70 leading-relaxed font-light">
                  A sanctuary for your observations. Organized, searchable, and infinitely expandable with AI-assisted refinement.
                </p>
                <Button variant="link" className="p-0 text-xs font-bold uppercase tracking-widest text-primary border-b border-primary/20 hover:border-primary transition-all">
                  Access Sanctuary
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer - Symmetrical Balance */}
      <footer className="max-w-7xl mx-auto px-8 py-32 text-center space-y-20">
        <div className="flex justify-center items-center gap-3 mb-10">
           <div className="h-px w-32 bg-border/40" />
           <img src="/images/human_logo.png" alt="Logo" className="w-12 h-12 grayscale opacity-40 hover:opacity-100 transition-all duration-700" />
           <div className="h-px w-32 bg-border/40" />
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-xs font-bold tracking-[0.3em] uppercase opacity-60">
          <a href="#" className="hover:text-primary transition-colors">About Us</a>
          <a href="#" className="hover:text-primary transition-colors">Our Offers</a>
          <a href="#" className="hover:text-primary transition-colors">My Account</a>
          <a href="#" className="hover:text-primary transition-colors">Philosophy</a>
        </div>

        <div className="pt-20 border-t border-border/20 text-[10px] tracking-[0.2em] uppercase opacity-40 font-bold">
          <span>&copy; 2026 Crafted with Intent. No AI placeholders were used in this design.</span>
        </div>
      </footer>

      <style jsx global>{`
        .font-heading {
          font-family: var(--font-heading), serif;
        }
        .font-serif {
          font-family: var(--font-serif), serif;
        }
      `}</style>
    </div>
  );
}
