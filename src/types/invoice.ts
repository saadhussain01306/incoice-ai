export type InvoiceStatus =
  | "extracting"
  | "validating"
  | "auto_submitted"
  | "human_review"
  | "submission_failed"
  | "pending_retry";

export type InvoiceSource = "email" | "shared_drive" | "manual_upload";

export interface ExtractedFields {
  invoiceNumber: string;
  vendorName: string;
  gstNumber: string;
  invoiceDate: string;
  currency: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
}

export interface PortalFields extends ExtractedFields {}

export interface Invoice {
  id: string;
  vendor: string;
  amount: number;
  portalAmount: number;
  uploadedAt: string;
  source: InvoiceSource;
  status: InvoiceStatus;
  confidence: number;
  assignedTo?: string;
  reason?: string;
  priority: "low" | "medium" | "high";
  extracted: ExtractedFields;
  portal: PortalFields;
  mismatches: string[];
  aiExplanation: string;
}

export interface AuditEvent {
  id: string;
  invoiceId: string;
  actor: string;
  action: string;
  timestamp: string;
  status: "success" | "warning" | "error" | "info";
}
