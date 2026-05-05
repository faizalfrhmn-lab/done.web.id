import { supabase } from "./supabase";
import { Invoice, InvoiceStatus, Timeline, TimelineEntry, TimelineEntryType, TimelineEntryStatus } from "../types";

export const api = {
  // Invoices
  async getInvoices(): Promise<Invoice[]> {
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) throw error;
    
    return (data || []).map(inv => ({
      ...inv,
      invoiceNumber: inv.invoice_number,
      clientName: inv.client_name,
      clientEmail: inv.client_email,
      dueDate: inv.due_date,
      timelineId: inv.timeline_id,
      isPrivate: inv.is_private
    }));
  },

  async getInvoice(id: string): Promise<Invoice> {
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", id)
      .single();
    
    if (error) throw error;
    
    return {
      ...data,
      invoiceNumber: data.invoice_number,
      clientName: data.client_name,
      clientEmail: data.client_email,
      dueDate: data.due_date,
      timelineId: data.timeline_id,
      isPrivate: data.is_private
    };
  },

  async createInvoice(invoiceData: Partial<Invoice>): Promise<Invoice> {
    const id = `inv-${Date.now()}`;
    const timelineId = `tl-${Date.now()}`;
    
    const newInvoice = {
      id,
      invoice_number: invoiceData.invoiceNumber,
      client_name: invoiceData.clientName,
      client_email: invoiceData.clientEmail,
      date: invoiceData.date,
      due_date: invoiceData.dueDate,
      items: invoiceData.items,
      total: invoiceData.total,
      status: invoiceData.status || InvoiceStatus.SENT,
      timeline_id: timelineId,
      is_private: true
    };

    const { error: invError } = await supabase.from("invoices").insert([newInvoice]);
    if (invError) throw invError;

    const newTimeline = {
      id: timelineId,
      invoice_id: id,
      is_public: false,
      agency_name: "My Agency",
      project_name: "New Project"
    };

    const { error: tlError } = await supabase.from("timelines").insert([newTimeline]);
    if (tlError) throw tlError;

    return {
      ...newInvoice,
      invoiceNumber: newInvoice.invoice_number,
      timelineId: newInvoice.timeline_id
    } as any;
  },

  // Timelines
  async getTimeline(id: string): Promise<Timeline> {
    const { data: timeline, error: tlError } = await supabase
      .from("timelines")
      .select("*")
      .eq("id", id)
      .single();
    
    if (tlError) throw tlError;

    const { data: entries, error: eError } = await supabase
      .from("timeline_entries")
      .select("*")
      .eq("timeline_id", id)
      .order("date", { ascending: true });

    if (eError) throw eError;

    return {
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
  },

  async updateTimelineInfo(id: string, updates: Partial<Timeline>): Promise<Timeline> {
    const dbUpdates: any = {};
    if (updates.agencyName !== undefined) dbUpdates.agency_name = updates.agencyName;
    if (updates.projectName !== undefined) dbUpdates.project_name = updates.projectName;
    if (updates.agencyLogoUrl !== undefined) dbUpdates.agency_logo_url = updates.agencyLogoUrl;

    const { data, error } = await supabase
      .from("timelines")
      .update(dbUpdates)
      .eq("id", id)
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      ...data,
      agencyName: data.agency_name,
      projectName: data.project_name,
      agencyLogoUrl: data.agency_logo_url
    };
  },

  async updateTimelineVisibility(id: string, isPublic: boolean): Promise<Timeline> {
    const { data, error } = await supabase
      .from("timelines")
      .update({ is_public: isPublic })
      .eq("id", id)
      .select()
      .single();
    
    if (error) throw error;
    return {
      ...data,
      isPublic: data.is_public
    };
  },

  async addTimelineEntries(timelineId: string, entries: Partial<TimelineEntry>[]): Promise<TimelineEntry[]> {
    const entriesToInsert = entries.map((entry, index) => ({
      id: `e-${Date.now()}-${index}`,
      timeline_id: timelineId,
      date: entry.date || new Date().toISOString(),
      description: entry.description,
      type: entry.type || TimelineEntryType.AI,
      status: TimelineEntryStatus.ON_PROGRESS,
      category: entry.category || "General"
    }));
    
    const { data, error } = await supabase.from("timeline_entries").insert(entriesToInsert).select();
    if (error) throw error;
    
    return data.map(e => ({ ...e, timelineId: e.timeline_id }));
  },

  async addSingleTimelineEntry(timelineId: string, entry: Partial<TimelineEntry>): Promise<TimelineEntry> {
    const newEntryPayload = {
      id: `e-${Date.now()}`,
      timeline_id: timelineId,
      date: entry.date || new Date().toISOString(),
      status: entry.status || TimelineEntryStatus.ON_PROGRESS,
      category: entry.category || "General",
      description: entry.description,
      type: entry.type || TimelineEntryType.MANUAL
    };

    const { data, error } = await supabase.from("timeline_entries").insert([newEntryPayload]).select().single();
    if (error) throw error;
    
    return { ...data, timelineId: data.timeline_id };
  },

  async updateEntryStatus(entryId: string, status: TimelineEntryStatus): Promise<TimelineEntry> {
    const { data, error } = await supabase
      .from("timeline_entries")
      .update({ status })
      .eq("id", entryId)
      .select()
      .single();
    
    if (error) throw error;
    return { ...data, timelineId: data.timeline_id };
  }
};
