// Placeholder API services. Replace mock returns with real axios calls.
// import axios from "axios";
import { mockInvoices, mockAudit } from "@/mock/invoices";
import type { Invoice, AuditEvent } from "@/types/invoice";

// const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL });

export const invoiceService = {
  // TODO: GET /invoices — fetch from API Gateway → Lambda → DynamoDB
  async list(): Promise<Invoice[]> {
    return Promise.resolve(mockInvoices);
  },

  // TODO: GET /invoices/:id — fetch full invoice incl. extraction + portal values
  async get(id: string): Promise<Invoice | undefined> {
    return Promise.resolve(mockInvoices.find((i) => i.id === id));
  },

  // TODO: POST /invoices/upload (multipart) — upload to S3 via presigned URL,
  // then trigger Step Functions extraction pipeline
  async upload(_files: File[]): Promise<{ uploadIds: string[] }> {
    return Promise.resolve({ uploadIds: _files.map((_, i) => `upl_${i}`) });
  },

  // TODO: POST /invoices/:id/submit — trigger ECS Fargate Playwright auto-submission
  async forceSubmit(id: string): Promise<void> {
    console.log("[service] forceSubmit", id);
  },

  // TODO: POST /invoices/:id/override — store reviewer corrections for
  // feedback learning loop (Bedrock fine-tuning dataset)
  async overrideFields(id: string, _payload: Record<string, unknown>): Promise<void> {
    console.log("[service] overrideFields", id);
  },

  // TODO: POST /invoices/:id/reject
  async reject(id: string, _reason: string): Promise<void> {
    console.log("[service] reject", id);
  },

  // TODO: POST /invoices/:id/reprocess — re-run extraction pipeline
  async reprocess(id: string): Promise<void> {
    console.log("[service] reprocess", id);
  },
};

export const auditService = {
  // TODO: GET /audit — query DynamoDB audit-trail table
  async list(): Promise<AuditEvent[]> {
    return Promise.resolve(mockAudit);
  },
};

export const validationService = {
  // TODO: GET /validate/:id — calls validation Lambda which cross-checks
  // extracted fields against portal API + duplicate detection
  async validate(id: string) {
    console.log("[service] validate", id);
    return { ok: true };
  },
};

export const analyticsService = {
  // TODO: GET /analytics/summary — aggregated metrics from DynamoDB
  async summary() {
    return {
      processed: 12_487,
      autoRate: 0.82,
      flagged: 211,
      avgConfidence: 0.913,
    };
  },
};
