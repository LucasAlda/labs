import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTableCtx } from "@/lib/datatable";
import { useTableContext } from "@/lib/table";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

export function DataTablePagination({ allwaysShow = false }: { allwaysShow?: boolean }) {
  const { table } = useTableCtx();
  const { rounded } = useTableContext();

  if (table.getPageCount() < 2 && table.getRowModel().flatRows.length < 10 && !allwaysShow) return null;
  return (
    <div
      className={cn("mt-auto flex items-center justify-between pt-3 text-slate-500", {
        "mb-3": rounded !== "all",
        "border-t border-slate-200 px-3": rounded === "none",
      })}
    >
      <div className="flex-1 text-sm">
        {table.getFilteredSelectedRowModel().flatRows.length > 0 && (
          <>{table.getFilteredSelectedRowModel().flatRows.length} fila(s) seleccionadas.</>
        )}
      </div>
      <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="flex items-center space-x-2">
          <p className="text-xs">Filas por página</p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="h-7 w-[70px] bg-white">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 40, 50, 10000].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize === 10000 ? "Máx" : pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-[90px] items-center justify-center text-xs">
          Pág. {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="hidden h-7 w-7 bg-white p-0 lg:flex"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to first page</span>
            <ChevronsLeft className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            className="h-7 w-7 bg-white p-0"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            className="h-7 w-7 bg-white p-0"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            className="hidden h-7 w-7 bg-white p-0 lg:flex"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to last page</span>
            <ChevronsRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
