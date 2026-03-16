"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useState } from "react";
import { Loader2, Youtube, StickyNote, Sparkles, ArrowRight } from "lucide-react";
import Image from "next/image";

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
    transition: { duration: 0.6 }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#2D2A26] overflow-x-hidden font-serif">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto border-b border-[#E8E2D9]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 relative">
            <img src="/images/human_logo.png" alt="Hub Logo" className="w-full h-full object-contain" />
          </div>
          <span className="text-xl font-semibold tracking-tight uppercase">AI Productivity Hub</span>
        </div>
        <Button 
          variant="outline" 
          className="rounded-xl px-6 border-[#D6CFC7] hover:bg-[#F5F1EB] transition-all text-[#2D2A26]"
          onClick={handleGoogleLogin}
        >
          Sign In
        </Button>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-8 py-12 md:py-24 flex flex-col lg:flex-row items-center gap-16">
        <motion.div 
          className="flex-1 space-y-10"
          initial="initial"
          animate="animate"
          variants={fadeInUp}
        >
          <div className="inline-flex items-center gap-2 bg-[#F5F1EB] px-5 py-2 rounded-xl text-xs font-bold tracking-widest uppercase border border-[#E8E2D9]">
            <span className="flex h-2 w-2 rounded-full bg-[#8B7E6F]" />
            Human-Crafted Experience
          </div>
          <h1 className="text-6xl md:text-8xl font-black leading-[0.9] tracking-tighter text-[#2D2A26]">
            Elegant <span className="italic font-light">Wisdom</span>.
          </h1>
          <p className="text-2xl text-[#5E5851] max-w-xl leading-relaxed font-light">
            Capture your thoughts with the precision of AI and the warmth of a classic journal. Transform tutorials into your personal library.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 pt-6">
            <Button 
              size="lg" 
              className="h-16 px-12 rounded-xl text-lg font-bold bg-[#2D2A26] hover:bg-[#403C37] text-white shadow-2xl transition-all"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              {loading ? <Loader2 className="animate-spin" /> : <>Enter the Hub</>}
            </Button>
            <Button size="lg" variant="ghost" className="h-16 px-8 text-lg font-medium hover:bg-[#F5F1EB] group border border-transparent hover:border-[#E8E2D9]">
              The Philosophy <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </motion.div>

        <motion.div 
          className="flex-1 relative"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
        >
          <div className="relative overflow-hidden rounded-2xl border-[12px] border-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)]">
            <img 
              src="/images/human_hero.png" 
              alt="Classic Workspace" 
              className="w-full h-auto grayscale-[0.2] hover:grayscale-0 transition-all duration-1000"
            />
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="bg-[#F5F1EB] py-32 border-y border-[#E8E2D9]">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-24 space-y-6">
            <h2 className="text-5xl font-black tracking-tighter">Crafted for the Deep Learner.</h2>
            <p className="text-[#5E5851] text-xl max-w-2xl mx-auto font-light">Minimalist tools designed to disappear so you can focus on what truly matters.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Feature 1 */}
            <motion.div 
              className="group p-10 rounded-2xl bg-[#FDFBF7] border border-[#E8E2D9] shadow-sm hover:shadow-2xl transition-all duration-700"
              whileHover={{ y: -10 }}
            >
              <div className="w-full aspect-[4/3] rounded-xl overflow-hidden mb-10 border border-[#E8E2D9]">
                <img src="/images/human_yt.png" alt="YouTube Insights" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2000ms]" />
              </div>
              <div className="space-y-4">
                <h3 className="text-3xl font-black tracking-tighter uppercase">Visual Scribe</h3>
                <p className="text-[#5E5851] text-xl leading-relaxed font-light">
                  Convert complex lectures into structured chapters. DeepSeek extracts the essence while you focus on the flow.
                </p>
                <div className="pt-6">
                  <Button variant="link" className="p-0 text-xl font-bold text-[#2D2A26] decoration-2 underline-offset-8">
                    Open Reader <ArrowRight className="ml-2 w-5 h-5 inline" />
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Feature 2 */}
            <motion.div 
              className="group p-10 rounded-2xl bg-[#FDFBF7] border border-[#E8E2D9] shadow-sm hover:shadow-2xl transition-all duration-700"
              whileHover={{ y: -10 }}
            >
              <div className="w-full aspect-[4/3] rounded-xl overflow-hidden mb-10 border border-[#E8E2D9] bg-[#2D2A26] flex items-center justify-center">
                 <img src="/images/human_hero.png" alt="Notes" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="space-y-4">
                <h3 className="text-3xl font-black tracking-tighter uppercase">Knowledge Vault</h3>
                <p className="text-[#5E5851] text-xl leading-relaxed font-light">
                  A sanctuary for your observations. Organized, searchable, and infinitely expandable with AI-assisted refinement.
                </p>
                <div className="pt-6">
                  <Button variant="link" className="p-0 text-xl font-bold text-[#2D2A26] decoration-2 underline-offset-8">
                    Access Library <ArrowRight className="ml-2 w-5 h-5 inline" />
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-8 py-20 text-[#5E5851]">
        <div className="flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-3">
             <img src="/images/human_logo.png" alt="Logo" className="w-8 h-8 opacity-60" />
             <span className="font-bold tracking-widest uppercase text-sm">AI Productivity Hub</span>
          </div>
          <div className="flex gap-12 text-sm uppercase font-bold tracking-widest">
            <a href="#" className="hover:text-[#2D2A26] transition-colors">Journal</a>
            <a href="#" className="hover:text-[#2D2A26] transition-colors">Manifesto</a>
            <a href="#" className="hover:text-[#2D2A26] transition-colors">Account</a>
          </div>
        </div>
        <div className="mt-16 pt-10 border-t border-[#E8E2D9] flex flex-col sm:flex-row justify-between items-center gap-6 text-xs uppercase tracking-widest font-bold opacity-60">
          <span>&copy; 2026 Crafted in Silence. All rights reserved.</span>
          <div className="flex gap-8">
            <a href="#" className="hover:text-[#2D2A26]">Data Policy</a>
            <a href="#" className="hover:text-[#2D2A26]">Ethical Code</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
