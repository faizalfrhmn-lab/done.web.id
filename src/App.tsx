/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Link, useNavigate, BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import InvoiceList from "./components/InvoiceList";
import InvoiceDetail from "./components/InvoiceDetail";
import InvoiceForm from "./components/InvoiceForm";
import TimelinePage from "./components/TimelinePage";
import LoginPage from "./components/LoginPage";
import { AuthProvider, useAuth } from "./components/AuthContext";
import { Invoice, InvoiceStatus } from "./types";
import { Plus, Clock, Loader2 } from "lucide-react";
import { api } from "./lib/api";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5]">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
};

const Dashboard = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    api.getInvoices()
      .then(data => {
        setInvoices(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Dashboard Fetch Error:", err);
        setLoading(false);
      });
  }, []);

  const totalBilled = invoices.reduce((sum, inv) => sum + inv.total, 0);
  const pendingAmount = invoices
    .filter(inv => inv.status !== InvoiceStatus.PAID)
    .reduce((sum, inv) => sum + inv.total, 0);
  const activeProjects = invoices.length;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Welcome back, {user?.email?.split('@')[0] || 'Faizal'}</h1>
        <p className="text-[#666] mt-2">Here's a summary of your invoicing and project progression.</p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-[#E5E5E5] shadow-sm">
          <p className="text-xs font-bold text-[#999] uppercase tracking-wider mb-2">Total Billed</p>
          <p className="text-2xl font-bold font-mono">${totalBilled.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-[#E5E5E5] shadow-sm">
          <p className="text-xs font-bold text-[#999] uppercase tracking-wider mb-2">Pending</p>
          <p className="text-2xl font-bold font-mono">${pendingAmount.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-[#E5E5E5] shadow-sm">
          <p className="text-xs font-bold text-[#999] uppercase tracking-wider mb-2">Total Invoices</p>
          <p className="text-2xl font-bold">{activeProjects}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-3">
            <button 
              onClick={() => navigate("/create")}
              className="p-4 bg-white border border-[#E5E5E5] rounded-xl text-left hover:border-blue-500 transition-colors group flex items-start gap-4"
            >
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Plus size={20} />
              </div>
              <div>
                <p className="font-medium group-hover:text-blue-600 transition-colors">Create New Invoice</p>
                <p className="text-xs text-[#999]">Start a new billing cycle for a client.</p>
              </div>
            </button>
            <button 
              disabled
              className="p-4 bg-white border border-[#E5E5E5] rounded-xl text-left opacity-50 cursor-not-allowed flex items-start gap-4"
            >
              <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                <Clock size={20} />
              </div>
              <div>
                <p className="font-medium">AI Timeline Scan</p>
                <p className="text-xs text-[#999]">Paste your chat logs to update project timelines.</p>
              </div>
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 group flex items-center gap-2">
            Recent Activity
            <Link to="/invoices" className="text-xs font-normal text-blue-600 hover:underline">View all</Link>
          </h2>
          <div className="bg-white border border-[#E5E5E5] rounded-2xl overflow-hidden divide-y divide-[#E5E5E5]">
            {loading ? (
              <div className="p-8 text-center text-sm text-gray-500">Loading activity...</div>
            ) : invoices.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">No recent activity</div>
            ) : (
              invoices.slice(0, 3).map(inv => (
                <Link key={inv.id} to={`/invoices/${inv.id}`} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="text-sm font-medium">{inv.clientName}</p>
                    <p className="text-xs text-gray-500">{inv.invoiceNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono font-medium">${inv.total.toLocaleString()}</p>
                    <p className="text-[10px] uppercase font-bold text-gray-400">{inv.status}</p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/invoices" element={<ProtectedRoute><InvoiceList /></ProtectedRoute>} />
          <Route path="/invoices/:id" element={<ProtectedRoute><InvoiceDetail /></ProtectedRoute>} />
          <Route path="/invoices/:id/timeline" element={<ProtectedRoute><TimelinePage /></ProtectedRoute>} />
          <Route path="/create" element={<ProtectedRoute><InvoiceForm /></ProtectedRoute>} />
          
          {/* Public Route */}
          <Route path="/t/:slug" element={<TimelinePage isPublicView={true} />} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}
