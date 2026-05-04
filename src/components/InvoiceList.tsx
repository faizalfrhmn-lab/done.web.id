import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Invoice, InvoiceStatus } from "../types";
import { ChevronRight, Filter, Search, MoreHorizontal } from "lucide-react";
import { motion } from "motion/react";

export default function InvoiceList() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/invoices")
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch invoices");
        return data;
      })
      .then(data => {
        setInvoices(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const getStatusColor = (status: InvoiceStatus) => {
    switch (status) {
      case InvoiceStatus.PAID: return "bg-green-100 text-green-700";
      case InvoiceStatus.SENT: return "bg-blue-100 text-blue-700";
      case InvoiceStatus.OVERDUE: return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  if (loading) return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex items-end justify-between">
        <div className="space-y-3">
          <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-4 w-64 bg-gray-100 rounded-lg animate-pulse" />
        </div>
      </header>
      <div className="bg-white border border-[#E5E5E5] rounded-2xl overflow-hidden shadow-sm">
        <div className="p-8 space-y-6">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex justify-between items-center py-4 border-b border-gray-50 last:border-0 grow">
              <div className="space-y-2">
                <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
                <div className="h-3 w-48 bg-gray-50 rounded animate-pulse" />
              </div>
              <div className="h-8 w-16 bg-gray-100 rounded-full animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="p-8 bg-red-50 border border-red-100 rounded-2xl text-center space-y-4">
      <h2 className="text-xl font-bold text-red-900">Connection Error</h2>
      <p className="text-sm text-red-700 max-w-lg mx-auto">{error}</p>
      <button 
        onClick={() => window.location.reload()}
        className="px-6 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors"
      >
        Try Again
      </button>
    </div>
  );

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Recent Invoices</h1>
          <p className="text-[#666] mt-2">Manage your billing and tracks progress via direct timeline.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E5E5E5] rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
            <Filter size={16} />
            Filter
          </button>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]" />
            <input 
              type="text" 
              placeholder="Search invoices..." 
              className="pl-10 pr-4 py-2 bg-white border border-[#E5E5E5] rounded-xl text-sm w-64 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </header>

      <div className="bg-white border border-[#E5E5E5] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-bottom border-[#E5E5E5] bg-gray-50/50">
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[#999]">Invoice</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[#999]">Client</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[#999]">Date</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[#999]">Total</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[#999]">Status</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5]">
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[#999]">
                    <div className="flex flex-col items-center gap-2">
                      <p className="font-medium italic">No invoices found in your console.</p>
                      <Link to="/invoices/new" className="text-blue-600 hover:underline text-sm font-bold uppercase transition-all">Create your first invoice</Link>
                    </div>
                  </td>
                </tr>
              )}
              {invoices.map((invoice, index) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  key={invoice.id} 
                  className="hover:bg-gray-50/50 transition-colors group cursor-pointer"
                >
                  <td className="px-6 py-6 border-b border-[#F5F5F5]">
                    <div className="font-medium text-[#1A1A1A]">{invoice.invoiceNumber}</div>
                    <div className="text-xs text-blue-600 font-medium mt-1">
                      <Link to={`/invoices/${invoice.id}/timeline`} className="hover:underline">
                        View Direct Timeline
                      </Link>
                    </div>
                  </td>
                  <td className="px-6 py-6 border-b border-[#F5F5F5]">
                    <div className="font-medium">{invoice.clientName}</div>
                    <div className="text-xs text-[#999]">{invoice.clientEmail}</div>
                  </td>
                  <td className="px-6 py-6 border-b border-[#F5F5F5]">
                    <div className="text-sm">{new Date(invoice.date).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-6 border-b border-[#F5F5F5]">
                    <div className="font-mono text-sm">${invoice.total.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-6 border-b border-[#F5F5F5]">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide ${getStatusColor(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-6 border-b border-[#F5F5F5] text-right">
                    <Link 
                      to={`/invoices/${invoice.id}`}
                      className="inline-flex items-center gap-1 text-sm text-blue-600 font-medium hover:text-blue-700"
                    >
                      View
                      <ChevronRight size={16} />
                    </Link>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
