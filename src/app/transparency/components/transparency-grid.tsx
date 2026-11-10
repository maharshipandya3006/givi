"use client";

import { useState, useRef, useMemo, useCallback } from "react";
import { AgGridReact } from "ag-grid-react";
import { ColDef, ModuleRegistry } from "ag-grid-community";
import { AllCommunityModule } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { TransparencyRecord } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { ShieldCheck, Download, Search, CheckCircle2, Zap, Sparkles } from "lucide-react";

// Register AG Grid Community modules
ModuleRegistry.registerModules([AllCommunityModule]);

interface TransparencyGridProps {
  initialData: TransparencyRecord[];
}

export function TransparencyGrid({ initialData }: TransparencyGridProps) {
  const gridRef = useRef<AgGridReact>(null);
  const [quickFilterText, setQuickFilterText] = useState("");

  const columnDefs = useMemo<ColDef<TransparencyRecord>[]>(
    () => [
      {
        field: "timestamp",
        headerName: "Settlement Time",
        width: 170,
        valueFormatter: (params) => {
          if (!params.value) return "";
          const d = new Date(params.value);
          return d.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
        },
      },
      {
        field: "causeTitle",
        headerName: "Verified Statement Need",
        flex: 2,
        minWidth: 220,
        cellRenderer: (params: { data?: TransparencyRecord }) => {
          if (!params.data) return null;
          return (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-ink line-clamp-1">
                {params.data.causeTitle}
              </span>
            </div>
          );
        },
      },
      {
        field: "category",
        headerName: "Category",
        width: 130,
        cellRenderer: (params: { value?: string }) => {
          return (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-surface-elevated text-ink-dim border border-border">
              {params.value}
            </span>
          );
        },
      },
      {
        field: "amount",
        headerName: "Amount Disbursed",
        width: 140,
        cellRenderer: (params: { value?: number }) => (
          <span className="font-bold text-emerald-400 tabular-nums">
            {formatCurrency(params.value || 0)}
          </span>
        ),
      },
      {
        field: "donorName",
        headerName: "Donor / Judge",
        width: 175,
        cellRenderer: (params: { value?: string; data?: any }) => {
          const isAgent = params.data?.isAgentic;
          return (
            <div className="flex items-center gap-1.5 truncate">
              {isAgent && <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
              <span className={`font-medium text-xs truncate block ${isAgent ? "text-[#166534] dark:text-emerald-400 font-semibold" : "text-ink"}`}>
                {params.value || "Kind Supporter"}
              </span>
            </div>
          );
        },
      },
      {
        field: "receiverEmail",
        headerName: "Recipient PayPal Rail",
        flex: 1.5,
        minWidth: 220,
        cellRenderer: (params: { value?: string }) => {
          const email = params.value || "givibeneficiary@business.example.com";
          return (
            <div className="flex items-center gap-1.5 font-mono text-xs text-[#166534] dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="truncate select-all" title={email}>{email}</span>
            </div>
          );
        },
      },
      {
        field: "trustScore",
        headerName: "Trust Percentage",
        width: 140,
        cellRenderer: (params: { value?: number }) => (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            {params.value}%
          </span>
        ),
      },
      {
        field: "paypalPayoutBatchId",
        headerName: "PayPal Settlement Hash",
        flex: 1.5,
        minWidth: 200,
        cellRenderer: (params: { value?: string }) => (
          <span className="font-mono text-xs text-emerald-400 hover:text-emerald-300 select-all cursor-pointer">
            {params.value}
          </span>
        ),
      },
      {
        field: "settlementStatus",
        headerName: "Settlement Status",
        width: 165,
        cellRenderer: (params: { value?: string }) => {
          const status = (params.value || "SETTLED").toUpperCase();
          if (status === "FAILED") {
            return (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                Failed / Refunded
              </span>
            );
          }
          if (status === "PENDING") {
            return (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Disbursing
              </span>
            );
          }
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Settled (100%)
            </span>
          );
        },
      },
      {
        field: "isAgentic",
        headerName: "Initiator",
        width: 160,
        cellRenderer: (params: { value?: boolean }) => {
          if (params.value) {
            return (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <Zap className="w-3 h-3 fill-emerald-400" />
                Autonomous agent
              </span>
            );
          }
          return (
            <span className="text-[11px] text-ink-muted font-medium">Human swipe</span>
          );
        },
      },
      {
        field: "receiverLocation",
        headerName: "Beneficiary City",
        width: 140,
        cellRenderer: (params: { value?: string }) => (
          <span className="text-ink-muted text-xs">{params.value}</span>
        ),
      },
    ],
    []
  );

  const defaultColDef = useMemo<ColDef>(
    () => ({
      sortable: true,
      filter: true,
      resizable: true,
    }),
    []
  );

  const onExportCsv = useCallback(() => {
    gridRef.current?.api.exportDataAsCsv({
      fileName: `givi-audit-ledger-${new Date().toISOString().slice(0, 10)}.csv`,
    });
  }, []);

  return (
    <div className="flex flex-col w-full text-left">
      {/* Control Bar: Quick Filter & CSV Export */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={quickFilterText}
            onChange={(e) => setQuickFilterText(e.target.value)}
            placeholder="Search PayPal settlement IDs, causes, locations..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-surface border border-border text-xs text-ink placeholder-ink-muted focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
          />
        </div>

        <button
          onClick={onExportCsv}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-[#166534] hover:bg-[#14532d] text-white font-bold text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#166534]"
        >
          <Download className="w-4 h-4" />
          <span>Export Ledger (CSV)</span>
        </button>
      </div>

      {/* AG Grid Table Container */}
      <div className="ag-theme-quartz w-full h-[560px] rounded-3xl overflow-hidden border border-border shadow-card bg-surface">
        <AgGridReact
          ref={gridRef}
          rowData={initialData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          quickFilterText={quickFilterText}
          pagination={true}
          paginationPageSize={20}
          paginationPageSizeSelector={[10, 20, 50]}
          rowHeight={48}
          headerHeight={44}
          animateRows={false}
        />
      </div>
    </div>
  );
}
