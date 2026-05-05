import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FileText, PlusCircle, LayoutDashboard, LogOut } from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "./AuthContext";

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const navItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "Invoices", path: "/invoices", icon: FileText },
    { name: "Create Invoice", path: "/create", icon: PlusCircle },
  ];

  const userInitial = user?.email?.[0].toUpperCase() || "U";
  const displayName = user?.email?.split('@')[0] || "User";

  return (
    <div className="min-h-screen flex text-[#1A1A1A]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-[#E5E5E5] flex flex-col">
        <div className="p-8">
          <Link to="/">
            <img 
              src="https://twuzynjcjourdhgscopt.supabase.co/storage/v1/object/public/asset/logo%20done.png" 
              alt="Done Logo" 
              className="h-8"
            />
          </Link>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? "bg-blue-50 text-blue-600 font-medium" 
                    : "text-[#666] hover:bg-gray-50 hover:text-[#1A1A1A]"
                }`}
              >
                <Icon size={20} />
                <span>{item.name}</span>
                {isActive && (
                  <motion.div
                    layoutId="pill"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#E5E5E5] space-y-2">
          <div className="flex items-center gap-3 p-4">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-xs shrink-0">
              {userInitial}
            </div>
            <div className="text-sm truncate">
              <p className="font-medium truncate">{displayName}</p>
              <p className="text-[#999] text-xs truncate">{user?.email}</p>
            </div>
          </div>
          
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors text-sm font-medium"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-12">
          {children}
        </div>
      </main>
    </div>
  );
}
