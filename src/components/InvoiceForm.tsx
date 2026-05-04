import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { InvoiceStatus, InvoiceItem } from "../types";
import { Plus, Trash2, Save, X } from "lucide-react";
import { motion } from "motion/react";

export default function InvoiceForm() {
  const navigate = useNavigate();
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: "1", description: "", quantity: 1, unitPrice: 0, amount: 0 }
  ]);

  const addItem = () => {
    setItems([...items, { id: Date.now().toString(), description: "", quantity: 1, unitPrice: 0, amount: 0 }]);
  };

  const removeItem = (id: string) => {
    if (items.length === 1) return;
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === "quantity" || field === "unitPrice") {
          updated.amount = updated.quantity * updated.unitPrice;
        }
        return updated;
      }
      return item;
    }));
  };

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = items.reduce((sum, item) => sum + item.amount, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, "0")}`;
      const newInvoice = {
        invoiceNumber,
        clientName,
        clientEmail,
        date: new Date().toISOString(),
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        items,
        total,
        status: InvoiceStatus.DRAFT
      };

      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newInvoice),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        // Pre-fetch invoices in the background if possible or just navigate
        navigate("/invoices");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to save invoice. Please check if your Supabase tables are set up correctly.");
      }
    } catch (err: any) {
      console.error("Save Error:", err);
      if (err.name === 'AbortError') {
        setError("Connection timeout: Server is taking too long to respond. Please try again.");
      } else {
        setError("A network error occurred. Please check your internet or database connection.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <header className="space-y-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Create New Invoice</h1>
          <p className="text-[#666] mt-2">Set up a new billing cycle for your client.</p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700 animate-in fade-in slide-in-from-top-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-8 rounded-2xl border border-[#E5E5E5] shadow-sm space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#999] uppercase tracking-wider">Client Name</label>
              <input 
                required
                type="text" 
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. Acme Corp" 
                disabled={isSaving}
                className="w-full px-4 py-3 bg-gray-50 border border-[#E5E5E5] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#999] uppercase tracking-wider">Client Email</label>
              <input 
                required
                type="email" 
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="billing@client.com" 
                disabled={isSaving}
                className="w-full px-4 py-3 bg-gray-50 border border-[#E5E5E5] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>
          </div>

          <div className="pt-6 space-y-4">
            <label className="text-[11px] font-bold text-[#999] uppercase tracking-wider">Invoice Items</label>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 items-end animate-in fade-in slide-in-from-top-2">
                  <div className="flex-1 space-y-1">
                    <input 
                      required
                      type="text" 
                      value={item.description}
                      onChange={(e) => updateItem(item.id, "description", e.target.value)}
                      placeholder="Description" 
                      disabled={isSaving}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-[#E5E5E5] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                    />
                  </div>
                  <div className="w-20 space-y-1">
                    <input 
                      required
                      type="number" 
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, "quantity", parseInt(e.target.value) || 0)}
                      disabled={isSaving}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-[#E5E5E5] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                    />
                  </div>
                  <div className="w-32 space-y-1">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999] text-xs">$</span>
                      <input 
                        required
                        type="number" 
                        value={item.unitPrice}
                        onChange={(e) => updateItem(item.id, "unitPrice", parseInt(e.target.value) || 0)}
                        disabled={isSaving}
                        className="w-full pl-6 pr-4 py-2.5 bg-gray-50 border border-[#E5E5E5] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                      />
                    </div>
                  </div>
                  <div className="w-32 py-2.5 text-right font-mono text-sm">
                    ${item.amount.toLocaleString()}
                  </div>
                  {!isSaving && items.length > 1 && (
                    <button 
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="p-2.5 text-[#999] hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {!isSaving && (
              <button 
                type="button"
                onClick={addItem}
                className="flex items-center gap-2 text-sm text-blue-600 font-medium hover:text-blue-700 pt-2"
              >
                <Plus size={16} />
                Add Line Item
              </button>
            )}
          </div>

          <div className="pt-8 border-t border-[#E5E5E5] flex justify-end">
            <div className="text-right">
              <span className="text-sm text-[#666] mr-4">Total Amount</span>
              <span className="text-2xl font-bold font-mono">${total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button 
            type="button"
            disabled={isSaving}
            onClick={() => navigate("/invoices")}
            className="px-6 py-3 bg-white border border-[#E5E5E5] rounded-xl text-sm font-semibold hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
          >
            <X size={16} />
            Cancel
          </button>
          <button 
            type="submit"
            disabled={isSaving}
            className="px-8 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-200 disabled:opacity-50"
          >
            <Save size={16} />
            {isSaving ? "Saving..." : "Save Invoice"}
          </button>
        </div>
      </form>
    </div>
  );
}
