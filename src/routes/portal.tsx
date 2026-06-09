import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { mockInvoices } from "@/mock/invoices";
import { Building2, Search, ArrowLeft, FileText, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/portal")({
  head: () => ({
    meta: [{ title: "InvoicePortal-mySchneider · Vendor Reference" }],
  }),
  component: PortalPage,
});

function fmt(n: number, ccy = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: ccy,
    maximumFractionDigits: 0,
  }).format(n);
}

function PortalPage() {
  const [q, setQ] = useState("");
  const records = useMemo(() => {
    const term = q.toLowerCase().trim();
    return mockInvoices
      .map((i) => ({
        invoiceNumber: i.portal.invoiceNumber,
        vendor: i.portal.vendorName,
        gstin: i.portal.gstNumber,
        poNumber: `PO-2026-${i.id.slice(-4)}`,
        invoiceDate: i.portal.invoiceDate,
        subtotal: i.portal.subtotal,
        taxRate: i.portal.taxRate,
        taxAmount: i.portal.taxAmount,
        total: i.portal.totalAmount,
        currency: i.portal.currency,
        status:
          i.status === "auto_submitted"
            ? "ACCEPTED"
            : i.status === "submission_failed"
              ? "REJECTED"
              : "PENDING",
      }))
      .filter(
        (r) =>
          !term ||
          r.invoiceNumber.toLowerCase().includes(term) ||
          r.vendor.toLowerCase().includes(term) ||
          r.poNumber.toLowerCase().includes(term) ||
          r.gstin.toLowerCase().includes(term),
      );
  }, [q]);

  return (
    <div className="min-h-screen bg-[#F4F4F4] text-[#222222]">
      {/* Portal "external" chrome — Schneider Electric branded */}
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded bg-[#3DCD58] text-white">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <div className="text-base font-semibold text-[#222222]">InvoicePortal-mySchneider</div>
              <div className="text-[11px] uppercase tracking-wider text-[#626469]">
                Schneider Electric · Vendor Invoice Records
              </div>
            </div>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-[#222222] hover:bg-[#F4F4F4]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to InvoiceAI-mySchneider
          </Link>
        </div>
        <div className="border-t border-slate-200 bg-[#F4F4F4]">
          <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-2 text-xs text-[#626469]">
            <span className="font-medium text-[#222222]">Modules:</span>
            <span>Purchase Orders</span>
            <span>Goods Receipt</span>
            <span className="font-semibold text-[#22B14C]">Invoices</span>
            <span>Payments</span>
            <span>Vendor Master</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h1 className="text-xl font-semibold">Submitted Invoices</h1>
            <p className="text-sm text-slate-500">
              Authoritative portal record set. The Invoice AI dashboard reconciles extracted
              invoice fields against these values.
            </p>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search invoice / vendor / PO / GSTIN"
              className="w-80 rounded border border-slate-300 bg-white py-2 pl-8 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Total Records" value={records.length} icon={<FileText className="h-4 w-4" />} />
          <StatCard
            label="Accepted"
            value={records.filter((r) => r.status === "ACCEPTED").length}
            icon={<ShieldCheck className="h-4 w-4" />}
            tone="success"
          />
          <StatCard
            label="Rejected / Pending"
            value={records.filter((r) => r.status !== "ACCEPTED").length}
            icon={<ShieldCheck className="h-4 w-4" />}
            tone="warn"
          />
        </div>

        <div className="mt-6 overflow-hidden rounded border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-left text-xs uppercase tracking-wider text-slate-600">
              <tr>
                <th className="px-4 py-2.5 font-medium">Invoice #</th>
                <th className="px-4 py-2.5 font-medium">PO #</th>
                <th className="px-4 py-2.5 font-medium">Vendor</th>
                <th className="px-4 py-2.5 font-medium">GSTIN</th>
                <th className="px-4 py-2.5 font-medium">Date</th>
                <th className="px-4 py-2.5 font-medium text-right">Subtotal</th>
                <th className="px-4 py-2.5 font-medium text-right">Tax</th>
                <th className="px-4 py-2.5 font-medium text-right">Total</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.invoiceNumber} className="border-t border-slate-200 hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-mono text-xs">{r.invoiceNumber}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-slate-600">{r.poNumber}</td>
                  <td className="px-4 py-2.5">{r.vendor}</td>
                  <td className="px-4 py-2.5 font-mono text-[11px] text-slate-600">{r.gstin}</td>
                  <td className="px-4 py-2.5 text-slate-600">{r.invoiceDate}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{fmt(r.subtotal, r.currency)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">
                    {r.taxRate}% · {fmt(r.taxAmount, r.currency)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-medium tabular-nums">
                    {fmt(r.total, r.currency)}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={
                        "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium " +
                        (r.status === "ACCEPTED"
                          ? "bg-emerald-100 text-emerald-700"
                          : r.status === "REJECTED"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700")
                      }
                    >
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs text-slate-500">
          Reference portal · Read-only · Data shown here mirrors the source-of-truth used by the
          AI validation engine.
        </p>
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone?: "success" | "warn";
}) {
  const color =
    tone === "success"
      ? "text-emerald-700 bg-emerald-50 border-emerald-200"
      : tone === "warn"
        ? "text-amber-700 bg-amber-50 border-amber-200"
        : "text-blue-700 bg-blue-50 border-blue-200";
  return (
    <div className="rounded border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wider text-slate-500">{label}</div>
        <div className={`grid h-7 w-7 place-items-center rounded border ${color}`}>{icon}</div>
      </div>
      <div className="mt-2 text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}
