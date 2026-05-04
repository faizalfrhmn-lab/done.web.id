/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum InvoiceStatus {
  DRAFT = "draft",
  SENT = "sent",
  PAID = "paid",
  OVERDUE = "overdue",
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  date: string;
  dueDate: string;
  items: InvoiceItem[];
  total: number;
  status: InvoiceStatus;
  timelineId: string;
  isPrivate: boolean;
}

export enum TimelineEntryType {
  MANUAL = "manual",
  AI = "ai",
  SYSTEM = "system",
}

export enum TimelineEntryStatus {
  ON_PROGRESS = "on progress",
  WAIT_FEEDBACK = "wait feedback",
  DONE = "done",
}

export interface TimelineEntry {
  id: string;
  date: string;
  description: string;
  type: TimelineEntryType;
  status: TimelineEntryStatus;
  category?: string;
}

export interface Timeline {
  id: string;
  invoiceId: string;
  entries: TimelineEntry[];
  isPublic: boolean;
  agencyName?: string;
  projectName?: string;
  agencyLogoUrl?: string;
}
