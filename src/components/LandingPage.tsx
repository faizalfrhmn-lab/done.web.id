import React, { useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, Sparkles, Target, ArrowUpRight } from "lucide-react";

const LOGO_URL = "https://twuzynjcjourdhgscopt.supabase.co/storage/v1/object/public/asset/logo%20done.png";

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setMessage(data.message);
      setEmail("");
    } catch (err) {
      setMessage("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#121212] selection:bg-[#3267E3] selection:text-white font-sans antialiased overflow-x-hidden">
      {/* Elegant Grid Overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.08] h-[120vh]" 
           style={{ backgroundImage: `linear-gradient(#000 1.5px, transparent 1.5px), linear-gradient(90deg, #000 1.5px, transparent 1.5px)`, backgroundSize: '64px 64px' }}>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/40 to-white"></div>
      </div>

      {/* Navigation - Glassmorphism */}
      <nav className="fixed top-8 w-[calc(100%-48px)] z-50 px-8 md:px-12 py-5 flex justify-between items-center max-w-[1400px] mx-auto left-1/2 -translate-x-1/2 bg-white/60 backdrop-blur-2xl border border-white/50 rounded-[32px] shadow-[0_12px_40px_rgba(30,64,175,0.08)]">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <img src={LOGO_URL} alt="Logo" className="h-[38px] w-auto" />
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="flex items-center gap-8 md:gap-12"
        >
          <a href="/login" className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#888] hover:text-[#1E40AF] transition-colors">Console</a>
          <a href="/register" className="px-7 py-3 bg-gradient-to-r from-[#1E40AF] to-[#2DD4BF] text-white text-[11px] font-bold rounded-full hover:opacity-90 transition-all uppercase tracking-[0.2em] shadow-lg shadow-blue-500/20">
            Get Access
          </a>
        </motion.div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 pt-[30vh] pb-[10vh] px-8 max-w-[1400px] mx-auto min-h-screen flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-5xl"
        >
          <div className="inline-flex items-center gap-3 mb-12 mx-auto">
            <span className="w-8 h-[1.5px] bg-[#1E40AF]"></span>
            <span className="text-[11px] font-black uppercase tracking-[0.4em] text-transparent bg-clip-text bg-gradient-to-r from-[#1E40AF] to-[#2DD4BF]">Infrastructure V2.0</span>
            <span className="w-8 h-[1.5px] bg-[#2DD4BF]"></span>
          </div>
          
          <h1 className="text-5xl md:text-8xl lg:text-[140px] font-black uppercase leading-[0.85] tracking-[-0.05em] mb-14 text-[#0F172A]">
            Unseen <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1E40AF] via-[#3267E3] to-[#2DD4BF] block translate-y-2">Progression.</span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-xl md:text-2xl font-medium leading-relaxed text-[#555] mb-20 tracking-tight">
            Tracking complexity, simplified for modern <span className="text-[#1E40AF] font-bold">H</span>igh-velocity teams.
          </p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 1 }}
            className="flex flex-col items-center gap-8"
          >
            {message ? (
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="p-10 bg-gray-50 rounded-[40px] border border-gray-100 max-w-lg shadow-sm"
              >
                <p className="text-sm font-bold uppercase tracking-widest leading-relaxed text-gray-900">{message}</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 w-full max-w-xl">
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="project@domain.com" 
                  className="flex-1 px-10 py-7 bg-white border border-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-[#1E40AF]/10 focus:border-[#1E40AF] shadow-xl shadow-gray-200/20 transition-all font-bold text-sm"
                />
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="px-12 py-7 bg-gradient-to-r from-[#1E40AF] to-[#2DD4BF] text-white font-bold uppercase tracking-widest text-[11px] rounded-full hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 shadow-2xl shadow-blue-500/30"
                >
                  {isSubmitting ? "Processing..." : "Reserve Slot"}
                  <ArrowRight size={16} />
                </button>
              </form>
            )}
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#CCC]">Registration via priority invitation only</p>
          </motion.div>
        </motion.div>

        {/* Abstract Preview - Updated Colors */}
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          className="mt-32 w-full max-w-5xl mx-auto mb-20"
        >
          <div className="relative aspect-video bg-gray-50 rounded-[40px] md:rounded-[60px] border border-gray-100 p-4 md:p-8 overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.06)] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px]">
            <div className="w-full h-full bg-white/90 backdrop-blur-sm rounded-[32px] md:rounded-[48px] border border-white p-8 md:p-12 flex flex-col gap-12 text-left">
              <div className="flex justify-between items-center">
                <div className="flex gap-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#1E40AF] to-[#2DD4BF] rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <Target className="text-white" size={28} />
                  </div>
                  <div className="space-y-2 py-2 text-left">
                    <div className="h-4 w-48 bg-gradient-to-r from-[#1E40AF] to-[#2DD4BF] rounded-full" />
                    <div className="h-3 w-32 bg-[#1E40AF]/20 rounded-full" />
                  </div>
                </div>
                <div className="hidden sm:flex gap-3">
                  {[1, 2, 3].map(i => <div key={i} className="w-10 h-10 rounded-full bg-[#2DD4BF]/5 border border-[#2DD4BF]/10" />)}
                </div>
              </div>
              
              <div className="space-y-12">
                {[1, 2].map(i => (
                  <div key={i} className="flex gap-10 text-left">
                    <div className="w-0.5 h-32 bg-gradient-to-b from-[#3267E3] to-transparent relative">
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-[3px] border-[#3267E3] rounded-full shadow-md" />
                    </div>
                    <div className="flex-1 pt-1 space-y-4">
                      <div className="h-4 w-2/3 bg-gray-900/80 rounded-full" />
                      <div className="h-3.5 w-1/3 bg-[#3267E3]/5 rounded-full" />
                      <div className="h-3.5 w-1/4 bg-[#2DD4BF]/5 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Trust Bar */}
      <section className="py-24 px-8 border-t border-gray-50 text-center max-w-[1400px] mx-auto">
        <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-[#777] mb-12">Powering global sync protocols</p>
        <div className="flex flex-wrap justify-center gap-12 md:gap-24 opacity-30 grayscale">
          {["Milestone", "Track", "Sync", "Protocol", "Console"].map(name => (
            <span key={name} className="text-2xl font-black tracking-tighter uppercase">{name}</span>
          ))}
        </div>
      </section>

      {/* Grid Features */}
      <section className="py-40 px-8 max-w-[1400px] mx-auto grid md:grid-cols-3 gap-16 md:gap-24">
        {[
          { icon: Target, title: "Milestone Engine", desc: "Convert daily development logs into structured visual narratives for stakeholders." },
          { icon: Sparkles, title: "Real-time Sync", desc: "Instantly update project status across all client-facing portals with a single entry." },
          { icon: ArrowUpRight, title: "Secure Access", desc: "No-login required portals protected by enterprise-grade cryptographic signatures." }
        ].map((feat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
          >
            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mb-8">
              <feat.icon size={20} className="text-gray-900" />
            </div>
            <h3 className="text-xl font-bold uppercase tracking-tight mb-4">{feat.title}</h3>
            <p className="text-[#666] font-medium leading-relaxed">{feat.desc}</p>
          </motion.div>
        ))}
      </section>

      {/* Footer */}
      <footer className="py-24 bg-gray-50 border-t border-gray-100 px-8">
        <div className="max-w-[1400px] mx-auto flex flex-col items-center">
          <img src={LOGO_URL} alt="Logo" className="h-10 w-auto mb-16 grayscale opacity-20" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-20 text-center">
            {["Identity", "Security", "Protocol", "Changelog"].map(link => (
              <a key={link} href="#" className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#666] hover:text-black transition-colors">{link}</a>
            ))}
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-[#BBB]">© 2026 Milestone Infrastructure. bandung</p>
        </div>
      </footer>
    </div>
  );
}
