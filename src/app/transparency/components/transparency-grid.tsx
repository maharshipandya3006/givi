"use client";

import { useMemo, useState, useRef, useCallback } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  ColDef,
  ModuleRegistry,
  AllCommunityModule,
  GridApi,
  GridReadyEvent,
} from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { TransparencyRecord } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Download, Search, ShieldCheck, Zap } from "lucide-react";

// Register AG Grid Community modules
ModuleRegistry.registerModules([AllCommunityModule]);

interface TransparencyGridProps {
  initialData: TransparencyRecord[];
}

export function TransparencyGrid({ initialData }: TransparencyGridProps) {
  const gridRef = useRef<AgGridReact>(null);
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const [quickFilterText, setQuickFilterText] = useState("");

  const onGridReady = useCallback((params: GridReadyEvent) => {
    setGridApi(params.api);
  }, []);

  const onExportCsv = useCallback(() => {
    if (gridApi) {
      gridApi.exportDataAsCsv({
        fileName: `givi_tax_audit_ledger_${new Date().toISOString().split("T")[0]}.csv`,
      });
    }
  }, [gridApi]);

  const columnDefs: ColDef<TransparencyRecord>[] = useMemo(
    () => [
      {
        field: "timestamp",
        headerName: "Settlement Time",
        sort: "desc",
        width: 150,
        valueFormatter: (params) => (params.value ? formatDate(params.value) : ""),
      },
      {
        field: "causeTitle",
        headerName: "Verified Cause",
        flex: 2,
        minWidth: 200,
        cellRenderer: (params: { data?: TransparencyRecord }) => {
          if (!params.data) return null;
          return (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-zinc-100 line-clamp-1">
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
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase bg-zinc-800 text-zinc-300 border border-zinc-700">
              {params.value}
            </span>
          );
        },
      },
      {
        field: "amount",
        headerName: "Amount",
        width: 120,
        cellRenderer: (params: { value?: number }) => (
          <span className="font-bold font-mono text-emerald-400">
            {formatCurrency(params.value || 0)}
          </span>
        ),
      },
      {
        field: "trustScore",
        headerName: "Gemini Trust",
        width: 140,
        cellRenderer: (params: { value?: number }) => (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="w-3 h-3" />
            {params.value}%
          </span>
        ),
      },
      {
        field: "paypalPayoutBatchId",
        headerName: "PayPal Settlement Hash",
        flex: 1.5,
        minWidth: 180,
        cellRenderer: (params: { value?: string }) => (
          <span className="font-mono text-xs text-sky-400 select-all hover:underline cursor-pointer">
            {params.value}
          </span>
        ),
      },
      {
        field: "isAgentic",
        headerName: "Initiated By",
        width: 150,
        cellRenderer: (params: { value?: boolean }) => {
          if (params.value) {
            return (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Zap className="w-3 h-3" />
                Autonomous Agent
              </span>
            );
          }
          return (
            <span className="text-[11px] text-zinc-400">Human Swipe</span>
          );
        },
      },
      {
        field: "receiverLocation",
        headerName: "Beneficiary City",
        width: 140,
        cellRenderer: (params: { value?: string }) => (
          <span className="text-zinc-400 font-mono text-xs">{params.value}</span>
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

  return (
    <div className="flex flex-col w-full text-left">
      {/* Control Bar: Quick Filter & CSV Export */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={quickFilterText}
            onChange={(e) => setQuickFilterText(e.target.value)}
            placeholder="Search PayPal settlement IDs, causes..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-400"
          />
        </div>

        <button
          onClick={onExportCsv}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02]"
        >
          <Download className="w-4 h-4" />
          <span>Export Tax Deductible Ledger (CSV)</span>
        </button>
      </div>

      {/* AG Grid Table Container */}
      <div className="ag-theme-quartz-dark w-full h-[540px] rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl">
        <AgGridReact
          ref={gridRef}
          rowData={initialData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          quickFilterText={quickFilterText}
          pagination={true}
          paginationPageSize={10}
          paginationPageSizeSelector={[10, 20, 50]}
          onGridReady={onGridReady}
          animateRows={true}
        />
      </div>
    </div>
  );
}
