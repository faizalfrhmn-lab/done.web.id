import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FileText, PlusCircle, LayoutDashboard, LogOut } from "lucide-react";
import { motion } from "motion/react";
import { supabase } from "../lib/supabase";

const LOGO_URL = "https://twuzynjcjourdhgscopt.supabase.co/storage/v1/object/public/asset/logo%20done.png";

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();

  // Paths that should not have the sidebar
  const publicPaths = ["/login", "/register", "/t/"];
  const isLandingPage = location.pathname === "/";
  const isPublicRoute = publicPaths.some(p => location.pathname.startsWith(p)) || isLandingPage;

  const handleLogout = async () => {
    localStorage.removeItem("ais_demo_user");
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Invoices", path: "/invoices", icon: FileText },
    { name: "Create Invoice", path: "/create", icon: PlusCircle },
  ];

  if (isPublicRoute) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex text-[#1A1A1A]">
      {/* Sidebar */}
      <aside className="w-68 bg-white border-r border-[#E5E5E5] flex flex-col">
        <div className="p-8 pb-4">
          <Link to="/dashboard" className="flex items-center hover:opacity-80 transition-opacity">
            <img src={LOGO_URL} alt="Logo" className="h-10 w-auto" />
          </Link>
        </div>
        
        <nav className="flex-1 px-4 py-8 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 ${
                  isActive 
                    ? "bg-gray-900 text-white font-bold shadow-xl shadow-gray-200" 
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon size={18} />
                <span className="text-xs uppercase font-black tracking-widest">{item.name}</span>
                {isActive && (
                  <motion.div
                    layoutId="pill"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 space-y-4 border-t border-[#E5E5E5]">
          <div className="flex items-center gap-3 p-2">
            <div className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-900 font-black text-sm">
              FA
            </div>
            <div className="text-sm">
              <p className="font-black uppercase text-gray-900">Faizal</p>
              <p className="text-gray-400 text-[9px] font-black uppercase tracking-[0.2em]">Console Access</p>
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-red-500 hover:bg-red-50 transition-all font-black uppercase text-xs tracking-tight"
          >
            <LogOut size={16} />
            Logout Session
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-gray-50/50">
        <div className="max-w-5xl mx-auto p-12">
          {children}
        </div>
      </main>
    </div>
  );
}
