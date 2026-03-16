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
    <div className="min-h-screen bg-[#FFF5E1] text-[#1c1917] overflow-x-hidden font-sans">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="bg-primary text-white p-2 rounded-xl">
            <Sparkles className="w-6 h-6" />
          </div>
          <span className="text-xl font-bold tracking-tight">AI Productivity Hub</span>
        </div>
        <Button 
          variant="outline" 
          className="rounded-full px-6 border-stone-300 hover:bg-stone-100 transition-all"
          onClick={handleGoogleLogin}
        >
          Sign In
        </Button>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-8 py-12 md:py-24 flex flex-col md:flex-row items-center gap-12">
        <motion.div 
          className="flex-1 space-y-8"
          initial="initial"
          animate="animate"
          variants={fadeInUp}
        >
          <div className="inline-flex items-center gap-2 bg-stone-100 px-4 py-2 rounded-full text-sm font-medium border border-stone-200">
            <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            Next Gen AI Workspace
          </div>
          <h1 className="text-6xl md:text-7xl font-extrabold leading-[1.1] tracking-tight">
            Supercharge Your <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Learning</span> Flow.
          </h1>
          <p className="text-xl text-stone-600 max-w-xl leading-relaxed">
            Turn hours of video into minutes of insight. Save, organize, and transform your notes with the power of Grok and DeepSeek AI.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button 
              size="lg" 
              className="h-14 px-10 rounded-2xl text-lg font-semibold gap-2 shadow-xl shadow-stone-200"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              {loading ? <Loader2 className="animate-spin" /> : <><Sparkles className="w-5 h-5" /> Get Started Free</>}
            </Button>
            <Button size="lg" variant="ghost" className="h-14 px-8 text-lg font-medium group">
              Learn more <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </motion.div>

        <motion.div 
          className="flex-1 relative"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="absolute -inset-4 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 blur-3xl opacity-50 rounded-full" />
          <div className="relative glass-card overflow-hidden rounded-[2.5rem] border border-stone-200 shadow-2xl">
            <img 
              src="/images/hero.png" 
              alt="AI Workspace" 
              className="w-full h-auto object-cover"
            />
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="bg-stone-50/50 py-24 border-y border-stone-200">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-4xl font-bold">Tools built for the modern student.</h2>
            <p className="text-stone-500 text-lg">Everything you need to master your subjects with less effort.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Feature 1 */}
            <motion.div 
              className="group p-8 rounded-[2rem] bg-white border border-stone-200 shadow-sm hover:shadow-xl transition-all duration-500"
              whileHover={{ y: -5 }}
            >
              <div className="w-full aspect-video rounded-2xl overflow-hidden mb-8 bg-stone-100">
                <img src="/images/yt-feature.png" alt="YouTube Summarizer" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-2xl bg-red-50 text-red-600">
                  <Youtube className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold">YouTube AI Summarizer</h3>
              </div>
              <p className="text-stone-600 text-lg leading-relaxed mb-6">
                Paste any link and let DeepSeek extract the core wisdom. Perfect for lectures, tutorials, and long webinars.
              </p>
              <Button variant="link" className="p-0 text-lg font-bold group-hover:gap-2 transition-all">
                Try it now <ArrowRight className="w-5 h-5" />
              </Button>
            </motion.div>

            {/* Feature 2 */}
            <motion.div 
              className="group p-8 rounded-[2rem] bg-white border border-stone-200 shadow-sm hover:shadow-xl transition-all duration-500"
              whileHover={{ y: -5 }}
            >
              <div className="w-full aspect-video rounded-2xl overflow-hidden mb-8 bg-stone-100">
                <img src="/images/notes-feature.png" alt="Smart Note Saver" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-2xl bg-blue-50 text-blue-600">
                  <StickyNote className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold">Smart Note Saver</h3>
              </div>
              <p className="text-stone-600 text-lg leading-relaxed mb-6">
                Organize your knowledge in one place. Export to PDF, format professionally, and access from anywhere.
              </p>
              <Button variant="link" className="p-0 text-lg font-bold group-hover:gap-2 transition-all">
                Start writing <ArrowRight className="w-5 h-5" />
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Social Proof / Footer */}
      <footer className="max-w-7xl mx-auto px-8 py-16 text-center text-stone-400">
        <p className="mb-8">Powering 10,000+ notes globally. Built for speed.</p>
        <div className="flex justify-center gap-8 mb-12 opacity-50 grayscale">
          {/* Placeholders for logos if needed */}
        </div>
        <div className="pt-8 border-t border-stone-200 flex justify-between items-center text-sm">
          <span>&copy; 2026 AI Productivity Hub. All rights reserved.</span>
          <div className="flex gap-6">
            <a href="#" className="hover:text-stone-900 transition-colors">Privacy</a>
            <a href="#" className="hover:text-stone-900 transition-colors">Terms</a>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        .glass-card {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
      `}</style>
    </div>
  );
}
