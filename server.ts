import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { createClient } from "@supabase/supabase-js";
import { InvoiceStatus, TimelineEntryType, TimelineEntryStatus } from "./src/types.ts";
import "dotenv/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // Supabase Setup
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";

  console.log("--- Supabase Diagnostics ---");
  console.log("URL:", supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : "Missing");
  
  // Initialize Supabase only if URl is valid to prevent library crash
  let supabase: any;
  if (supabaseUrl && supabaseKey && supabaseUrl.startsWith("http")) {
    supabase = createClient(supabaseUrl, supabaseKey);
  } else {
    console.error("Supabase config invalid or missing URL/Key!");
    // Create a dummy object that returns helpful errors instead of crashing
    const dummyHandler = {
      get: (target: any, prop: string) => {
        if (prop === 'from') {
          return () => ({
            select: () => ({ order: () => ({ timeout: () => Promise.resolve({ data: [], error: { message: "Supabase not configured" } }) }), single: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }), eq: () => ({ single: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }) }) }),
            insert: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
            update: () => ({ eq: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }) }) }) })
          });
        }
        return () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } });
      }
    };
    supabase = new Proxy({}, dummyHandler);
  }

  // Request logger middleware
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
    });
    next();
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      supabase: !!supabaseUrl && !!supabaseKey,
      env: process.env.NODE_ENV
    });
  });

  // API Routes
  app.get("/api/debug/supabase", async (req, res) => {
    try {
      const { data, error } = await supabase.from("invoices").select("*", { count: 'exact', head: true }).limit(1);
      res.json({
        connection: error ? "Error" : "Success",
        error: error || null,
        url_preview: supabaseUrl ? `${supabaseUrl.substring(0, 15)}...` : null,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.post("/api/waitlist", async (req, res) => {
    try {
      const { email } = req.body;
      
      const { error } = await supabase.from("waitlist").insert([{ email, created_at: new Date().toISOString() }]);
      if (error && error.code !== '23505') {
        console.error("Waitlist Error:", error);
      }
      
      res.json({ success: true, message: "Maaf, antrean saat ini sudah penuh. Kami akan mengabari Anda jika slot baru tersedia." });
    } catch (err) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/invoices", async (req, res) => {
    console.log("Fetching invoices...");
    try {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .order("created_at", { ascending: false })
        .timeout(10000); // 10s timeout
      
      if (error) {
        console.error("Supabase Error (List Invoices):", error.message, error.details, error.hint);
        return res.status(500).json({ error: `Database Error: ${error.message}` });
      }
      
      console.log(`Found ${data?.length || 0} invoices.`);
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
      console.error("Unexpected Error (GET Invoices):", err);
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
      const { randomUUID } = await import('node:crypto');
      const id = randomUUID();
      const timelineId = randomUUID();
      
      console.log(`Creating invoice ${req.body.invoiceNumber} with ID ${id}`);

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
        is_private: true,
        created_at: new Date().toISOString()
      };

      const newTimeline = {
        id: timelineId,
        invoice_id: id,
        is_public: false,
        agency_name: "My Agency",
        project_name: "New Project",
        created_at: new Date().toISOString()
      };

      // Sequential insert for better error control
      const { error: invError } = await supabase.from("invoices").insert([newInvoice]);
      if (invError) {
        console.error("INVOICE INSERT ERROR:", invError);
        return res.status(500).json({ error: `Invoice Save Error: ${invError.message}` });
      }

      const { error: tlError } = await supabase.from("timelines").insert([newTimeline]);
      if (tlError) {
        console.error("TIMELINE INSERT ERROR:", tlError);
        return res.status(500).json({ error: `Timeline Save Error: ${tlError.message}` });
      }

      res.status(201).json({
        ...newInvoice,
        invoiceNumber: newInvoice.invoice_number,
        timelineId: newInvoice.timeline_id
      });
    } catch (err: any) {
      console.error("POST Invoice Error:", err);
      res.status(500).json({ error: `Server Error: ${err.message}` });
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
    const { randomUUID } = await import('node:crypto');
    const entriesToInsert = req.body.entries.map((entry: any) => ({
      id: randomUUID(),
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
    try {
      const { randomUUID } = await import('node:crypto');
      const newEntryPayload = {
        id: randomUUID(),
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
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
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
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    const indexPath = path.join(distPath, 'index.html');
    
    app.use(express.static(distPath, {
      index: false,
      redirect: false
    }));

    // Help debug asset 404s
    app.get('/assets/*', (req, res, next) => {
      const assetPath = path.join(distPath, req.url);
      if (!fs.existsSync(assetPath)) {
        console.error(`[Production] Asset 404: ${req.url} (Checked: ${assetPath})`);
      }
      next();
    });
    
    app.get('*', (req, res) => {
      console.log(`[Production] Serving request for: ${req.url}`);
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        console.error(`Index not found at: ${indexPath}`);
        res.status(500).send(`Build production files not found. Search path: ${distPath}`);
      }
    });
  }

  if (process.env.NODE_ENV !== "test" && !process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
  
  return app;
}

const appPromise = startServer();
export default async (req: any, res: any) => {
  const app = await appPromise;
  return app(req, res);
};
