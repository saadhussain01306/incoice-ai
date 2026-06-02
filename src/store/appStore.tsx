import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { Invoice } from "@/types/invoice";
import { mockInvoices } from "@/mock/invoices";

interface AppState {
  invoices: Invoice[];
  selectedInvoiceId: string | null;
  selectInvoice: (id: string | null) => void;
  updateInvoice: (id: string, patch: Partial<Invoice>) => void;
  uploadQueue: { name: string; progress: number; status: "uploading" | "done" | "error" }[];
  enqueueUpload: (files: File[]) => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [uploadQueue, setUploadQueue] = useState<AppState["uploadQueue"]>([]);

  const value = useMemo<AppState>(
    () => ({
      invoices,
      selectedInvoiceId,
      selectInvoice: setSelectedInvoiceId,
      updateInvoice: (id, patch) =>
        setInvoices((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i))),
      uploadQueue,
      enqueueUpload: (files) => {
        const entries = files.map((f) => ({
          name: f.name,
          progress: 0,
          status: "uploading" as const,
        }));
        setUploadQueue((q) => [...entries, ...q]);
        // Simulate upload progress
        entries.forEach((entry, idx) => {
          let p = 0;
          const t = setInterval(() => {
            p += 12 + Math.random() * 18;
            setUploadQueue((q) =>
              q.map((u, i) =>
                u.name === entry.name && i === idx
                  ? { ...u, progress: Math.min(100, p), status: p >= 100 ? "done" : "uploading" }
                  : u,
              ),
            );
            if (p >= 100) clearInterval(t);
          }, 400);
        });
      },
    }),
    [invoices, selectedInvoiceId, uploadQueue],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
