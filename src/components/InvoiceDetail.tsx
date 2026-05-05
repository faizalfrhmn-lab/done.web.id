import React, { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { Invoice } from "../types";
import TimelineView from "./Timeline";
import { ChevronLeft, Download, Send, Clock, CreditCard, Sparkles } from "lucide-react";
import { api } from "../lib/api";

export default function InvoiceDetail() {
  const { id } = useParams();
  const location = useLocation();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Determine if we should show the direct timeline based on URL
  const showTimelineOnly = location.pathname.endsWith("/timeline");

  useEffect(() => {
    setError(null);
    if (!id) return;
    api.getInvoice(id)
      .then(data => {
        setInvoice(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-12 space-y-4">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm font-medium text-[#666]">Fetching details...</p>
    </div>
  );

  if (error || !invoice) return (
    <div className="p-8 bg-red-50 border border-red-100 rounded-2xl text-center space-y-4 max-w-lg mx-auto mt-12">
      <h2 className="text-xl font-bold text-red-900">Error Loading Invoice</h2>
      <p className="text-sm text-red-700">{error || "The invoice you are looking for does not exist."}</p>
      <Link 
        to="/invoices"
        className="inline-block px-6 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors"
      >
        Back to List
      </Link>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex items-center justify-between">
        <Link to="/invoices" className="flex items-center gap-2 text-sm text-[#666] hover:text-[#1A1A1A]">
          <ChevronLeft size={16} />
          Back to Invoices
        </Link>
        <div className="flex gap-3">
          <Link 
            to={`/invoices/${id}/timeline`}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E5E5E5] rounded-xl text-sm font-medium hover:bg-gray-50"
          >
            <Clock size={16} />
            Manage Timeline
          </Link>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">
            <Send size={16} />
            Send Invoice
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-12 rounded-2xl border border-[#E5E5E5] shadow-sm min-h-[600px] relative">
            <div className="flex justify-between items-start mb-12">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Invoice</h2>
                <p className="text-[#999] font-mono text-xs mt-1">{invoice.invoiceNumber}</p>
              </div>
              <div className="text-right">
                <div className="font-bold">PromptInvoice Inc.</div>
                <div className="text-sm text-[#666]">123 Creative Way</div>
                <div className="text-sm text-[#666]">Jakarta, Indonesia</div>
              </div>
            </div>

            <div className="flex justify-between mb-12">
              <div>
                <div className="text-[11px] font-bold text-[#999] uppercase tracking-wider mb-2">Billed To</div>
                <div className="font-bold">{invoice.clientName}</div>
                <div className="text-sm text-[#666]">{invoice.clientEmail}</div>
              </div>
              <div className="text-right flex gap-12">
                <div>
                  <div className="text-[11px] font-bold text-[#999] uppercase tracking-wider mb-2">Date</div>
                  <div className="text-sm">{new Date(invoice.date).toLocaleDateString()}</div>
                </div>
                <div>
                  <div className="text-[11px] font-bold text-[#999] uppercase tracking-wider mb-2">Due Date</div>
                  <div className="text-sm">{new Date(invoice.dueDate).toLocaleDateString()}</div>
                </div>
              </div>
            </div>

            <table className="w-full text-left border-collapse mb-12">
              <thead>
                <tr className="border-y border-[#E5E5E5]">
                  <th className="py-4 text-[11px] font-bold uppercase tracking-wider text-[#999]">Description</th>
                  <th className="py-4 px-4 text-right text-[11px] font-bold uppercase tracking-wider text-[#999]">Qty</th>
                  <th className="py-4 px-4 text-right text-[11px] font-bold uppercase tracking-wider text-[#999]">Price</th>
                  <th className="py-4 text-right text-[11px] font-bold uppercase tracking-wider text-[#999]">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F5F5]">
                {invoice.items.map((item, idx) => (
                  <tr key={`${item.id}-${idx}`}>
                    <td className="py-6 text-sm font-medium">{item.description}</td>
                    <td className="py-6 px-4 text-right text-sm">{item.quantity}</td>
                    <td className="py-6 px-4 text-right text-sm font-mono">${item.unitPrice.toLocaleString()}</td>
                    <td className="py-6 text-right text-sm font-bold font-mono">${item.amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-between items-end pt-8">
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                  <Clock size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-blue-600 tracking-wide uppercase">Project Progress</p>
                  <Link 
                    to={`/invoices/${id}/timeline`} 
                    className="text-sm font-semibold text-blue-800 hover:underline flex items-center gap-1 mt-0.5"
                  >
                    View Project Timeline (Direct Link)
                  </Link>
                </div>
              </div>
              
              <div className="w-64 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[#666]">Subtotal</span>
                  <span className="font-mono">${invoice.total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-[#E5E5E5] text-lg font-bold">
                  <span>Total Due</span>
                  <span className="font-mono text-blue-600">${invoice.total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-[#E5E5E5] shadow-sm">
            <h3 className="text-sm font-bold text-[#1A1A1A] mb-4 flex items-center gap-2">
              <CreditCard size={16} className="text-blue-600" />
              Payment Summary
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-[10px] text-[#999] uppercase font-bold tracking-wider mb-1">Current Status</p>
                <p className="text-sm font-semibold capitalize">{invoice.status}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#E5E5E5] shadow-sm">
            <h3 className="text-sm font-bold text-[#1A1A1A] mb-4 flex items-center gap-2">
              <Sparkles size={16} className="text-purple-600" />
              AI Timeline Actions
            </h3>
            <div className="space-y-4">
              <p className="text-xs text-[#666] leading-relaxed">
                Control if your client can see the project progression logs via the direct link.
              </p>
              <Link 
                to={`/invoices/${id}/timeline`} 
                className="w-full flex items-center justify-center gap-2 py-3 bg-purple-50 text-purple-600 rounded-xl text-sm font-semibold hover:bg-purple-100 transition-colors"
              >
                Manage & Update Timeline
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
