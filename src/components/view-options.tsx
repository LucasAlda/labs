import { ColumnVisibility } from "@/components/sortable-list";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useTableCtx } from "@/lib/datatable";
import { Settings2 } from "lucide-react";

export function ViewOptions() {
  const table = useTableCtx();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="ml-auto  flex h-8 bg-white">
          <Settings2 className="mr-2 h-4 w-4" />
          Vista
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="end">
        <div className="grid gap-2">
          <div className="mb-2 space-y-2">
            <h4 className="font-medium leading-none">Columnas</h4>
            {/* <p className="text-sm text-slate-500">Cambiar y guardar vista.</p> */}
          </div>
          <ColumnVisibility />

          {table.viewChanged && (
            <div className="mt-4 flex w-full items-center justify-between">
              <span className="text-xs text-slate-500">¿Fijar cambios?</span>
              <Button size="sm" className="h-6 px-2 text-xs" onClick={() => table.saveView()}>
                Guardar
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
