import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import { InvoiceStatus, TimelineEntryType, TimelineEntryStatus } from "./src/types.ts";
import "dotenv/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Supabase Setup
  const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "";

  if (!supabaseUrl || !supabaseKey) {
    console.error("CRITICAL: Supabase URL or Key missing from environment variables.");
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // API Routes
  app.get("/api/invoices", async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) {
        console.error("Supabase Error (List Invoices):", error);
        return res.status(500).json({ error: `Database Error: ${error.message}. Make sure your 'invoices' table exists.` });
      }
      
      const invoices = (data || []).map(inv => ({
        ...inv,
        invoiceNumber: inv.invoice_number,
        clientName: inv.client_name,
        clientEmail: inv.client_email,
        dueDate: inv.due_date,
        timelineId: inv.timeline_id,
        isPrivate: inv.is_private
      }));
      
      res.json(invoices);
    } catch (err) {
      console.error("Unexpected Error:", err);
      res.status(500).json({ error: "An unexpected error occurred." });
    }
  });

  app.get("/api/invoices/:id", async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("id", req.params.id)
        .single();
      
      if (error) {
        return res.status(404).json({ error: "Invoice not found or database error." });
      }
      
      const invoice = {
        ...data,
        invoiceNumber: data.invoice_number,
        clientName: data.client_name,
        clientEmail: data.client_email,
        dueDate: data.due_date,
        timelineId: data.timeline_id,
        isPrivate: data.is_private
      };
      
      res.json(invoice);
    } catch (err) {
      res.status(500).json({ error: "Internal server error." });
    }
  });

  app.post("/api/invoices", async (req, res) => {
    try {
      const id = `inv-${Date.now()}`;
      const timelineId = `tl-${Date.now()}`;
      
      const newInvoice = {
        id,
        invoice_number: req.body.invoiceNumber,
        client_name: req.body.clientName,
        client_email: req.body.clientEmail,
        date: req.body.date,
        due_date: req.body.dueDate,
        items: req.body.items,
        total: req.body.total,
        status: req.body.status,
        timeline_id: timelineId,
        is_private: true
      };

      const { error: invError } = await supabase.from("invoices").insert([newInvoice]);
      if (invError) {
        console.error("FULL INVOICE ERROR:", JSON.stringify(invError, null, 2));
        return res.status(500).json({ 
          error: `Failed to create invoice: ${invError.message}`,
          details: invError.details,
          hint: invError.hint 
        });
      }

      const newTimeline = {
        id: timelineId,
        invoice_id: id,
        is_public: false,
        agency_name: "My Agency",
        project_name: "New Project"
      };

      const { error: tlError } = await supabase.from("timelines").insert([newTimeline]);
      if (tlError) {
        console.error("FULL TIMELINE ERROR:", JSON.stringify(tlError, null, 2));
        return res.status(500).json({ 
          error: `Failed to create timeline: ${tlError.message}`,
          details: tlError.details,
          hint: tlError.hint
        });
      }

      res.status(201).json({
        ...newInvoice,
        invoiceNumber: newInvoice.invoice_number,
        timelineId: newInvoice.timeline_id
      });
    } catch (err) {
      console.error("POST Invoice Error:", err);
      res.status(500).json({ error: "Internal server error during invoice creation." });
    }
  });

  app.get("/api/timelines/:id", async (req, res) => {
    const { data: timeline, error: tlError } = await supabase
      .from("timelines")
      .select("*")
      .eq("id", req.params.id)
      .single();
    
    if (tlError) return res.status(404).json({ error: "Timeline not found" });

    const { data: entries, error: eError } = await supabase
      .from("timeline_entries")
      .select("*")
      .eq("timeline_id", req.params.id)
      .order("date", { ascending: true });

    if (eError) return res.status(500).json({ error: eError.message });

    const timelineData = {
      ...timeline,
      agencyName: timeline.agency_name,
      projectName: timeline.project_name,
      agencyLogoUrl: timeline.agency_logo_url,
      invoiceId: timeline.invoice_id,
      isPublic: timeline.is_public,
      entries: entries ? entries.map(e => ({
        ...e,
        timelineId: e.timeline_id
      })) : []
    };

    res.json(timelineData);
  });

  app.patch("/api/timelines/:id/info", async (req, res) => {
    const updates: any = {};
    if (req.body.agencyName !== undefined) updates.agency_name = req.body.agencyName;
    if (req.body.projectName !== undefined) updates.project_name = req.body.projectName;
    if (req.body.agencyLogoUrl !== undefined) updates.agency_logo_url = req.body.agencyLogoUrl;

    const { data, error } = await supabase
      .from("timelines")
      .update(updates)
      .eq("id", req.params.id)
      .select()
      .single();
    
    if (error) return res.status(404).json({ error: error.message });
    
    res.json({
      ...data,
      agencyName: data.agency_name,
      projectName: data.project_name,
      agencyLogoUrl: data.agency_logo_url
    });
  });

  app.patch("/api/timelines/:id/visibility", async (req, res) => {
    const { data, error } = await supabase
      .from("timelines")
      .update({ is_public: req.body.isPublic })
      .eq("id", req.params.id)
      .select()
      .single();
    
    if (error) return res.status(404).json({ error: error.message });
    res.json({
      ...data,
      isPublic: data.is_public
    });
  });

  app.post("/api/timelines/:id/entries/bulk", async (req, res) => {
    const entriesToInsert = req.body.entries.map((entry: any, index: number) => ({
      id: `e-${Date.now()}-${index}`,
      timeline_id: req.params.id,
      date: entry.date || new Date().toISOString(),
      description: entry.description,
      type: entry.type || TimelineEntryType.AI,
      status: TimelineEntryStatus.ON_PROGRESS,
      category: entry.category || "General"
    }));
    
    const { data, error } = await supabase.from("timeline_entries").insert(entriesToInsert).select();
    if (error) return res.status(500).json({ error: error.message });
    
    const entries = data.map(e => ({ ...e, timelineId: e.timeline_id }));
    res.status(201).json(entries);
  });

  app.post("/api/timelines/:id/entries", async (req, res) => {
    const newEntryPayload = {
      id: `e-${Date.now()}`,
      timeline_id: req.params.id,
      date: req.body.date || new Date().toISOString(),
      status: req.body.status || TimelineEntryStatus.ON_PROGRESS,
      category: req.body.category || "General",
      description: req.body.description,
      type: req.body.type || TimelineEntryType.MANUAL
    };

    const { data, error } = await supabase.from("timeline_entries").insert([newEntryPayload]).select().single();
    if (error) return res.status(500).json({ error: error.message });
    
    res.status(201).json({ ...data, timelineId: data.timeline_id });
  });

  app.patch("/api/timelines/:id/entries/:entryId", async (req, res) => {
    const { data, error } = await supabase
      .from("timeline_entries")
      .update({ status: req.body.status })
      .eq("id", req.params.entryId)
      .select()
      .single();
    
    if (error) return res.status(404).json({ error: error.message });
    res.json({ ...data, timelineId: data.timeline_id });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
