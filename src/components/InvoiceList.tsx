import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Invoice, InvoiceStatus } from "../types";
import { ChevronRight, Filter, Search, MoreHorizontal } from "lucide-react";
import { motion } from "motion/react";
import { api } from "../lib/api";

export default function InvoiceList() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getInvoices()
      .then(data => {
        setInvoices(data);
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
    <div className="flex flex-col items-center justify-center p-12 space-y-4">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm font-medium text-[#666]">Syncing with Supabase...</p>
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
              {invoices.map((invoice, index) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  key={`${invoice.id}-${index}`} 
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
