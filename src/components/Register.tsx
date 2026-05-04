import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "motion/react";
import { Mail, Lock, User, UserPlus, ChevronLeft } from "lucide-react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

const LOGO_URL = "https://twuzynjcjourdhgscopt.supabase.co/storage/v1/object/public/asset/logo%20done.png";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Mock registration if Supabase is not configured
    if (!isSupabaseConfigured) {
      const mockUser = { id: `user-${Date.now()}`, email, user_metadata: { full_name: fullName } };
      localStorage.setItem("ais_demo_user", JSON.stringify(mockUser));
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      window.location.href = "/dashboard";
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;
      
      // Usually Supabase sends confirmation email, but for demo we can navigate
      navigate("/login?registered=true");
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col justify-center items-center p-6 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] relative overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[400px] bg-white rounded-[32px] p-10 shadow-2xl shadow-gray-200/50 border border-gray-100"
      >
        <div className="flex flex-col items-center mb-10">
          <Link to="/" className="mb-8 hover:opacity-80 transition-opacity">
            <img src={LOGO_URL} alt="Logo" className="h-[42px] w-auto" />
          </Link>
          <h1 className="text-3xl font-black tracking-tight text-gray-900">Create Account</h1>
          <p className="text-gray-400 text-sm mt-3 font-medium tracking-tight">Join the next-gen tracking protocol</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-[10px] font-bold uppercase tracking-widest flex items-center gap-3">
             <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
             {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 ml-4">Full Name</label>
            <div className="relative">
              <User className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              <input 
                type="text" 
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe" 
                className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/5 focus:bg-white transition-all font-bold"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 ml-4">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com" 
                className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/5 focus:bg-white transition-all font-bold"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 ml-4">Password</label>
            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters" 
                className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/5 focus:bg-white transition-all font-bold"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-gradient-to-r from-[#1E40AF] to-[#2DD4BF] text-white rounded-full font-bold uppercase tracking-[0.2em] text-[11px] hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 mt-6 shadow-xl shadow-blue-500/30"
          >
            {loading ? "Creating..." : "Start Tracking"}
            <UserPlus size={16} />
          </button>
        </form>

        <div className="mt-10 text-center">
          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">
            Already have an account?{" "}
            <Link to="/login" className="text-black hover:underline ml-1">Login</Link>
          </p>
        </div>
      </motion.div>

      <Link to="/" className="mt-8 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors">
        <ChevronLeft size={16} />
        Back to Home
      </Link>
    </div>
  );
}
