import { ColumnVisibility } from "@/components/sortable-list";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTableCtx } from "@/lib/datatable";
import { cn } from "@/lib/utils";
import { Laptop, Monitor, Settings2, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";

export function ViewOptions() {
  const { view } = useTableCtx();
  const [size, setSize] = useState("lg");

  useEffect(() => {
    setSize(view.size);
  }, [view.size]);

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
          </div>

          <Tabs value={size} onValueChange={setSize}>
            <TabsList className="h-8 w-full">
              <TabsTrigger className="h-6 w-full" value="sm">
                <Smartphone className={cn("h-3.5 w-3.5", "sm" === view.size && "!stroke-[3px] !text-blue-500")} />
              </TabsTrigger>
              <TabsTrigger className="h-6 w-full" value="md">
                <Laptop className={cn("h-[18px] w-[18px]", "md" === view.size && "!stroke-[3px] !text-blue-500")} />
              </TabsTrigger>
              <TabsTrigger className="h-6 w-full" value="lg">
                <Monitor className={cn("h-4 w-4", "lg" === view.size && "!stroke-[3px] !text-blue-500")} />
              </TabsTrigger>
            </TabsList>
            <TabsContent value="sm">
              <ColumnVisibility size="sm" />
            </TabsContent>
            <TabsContent value="md">
              <ColumnVisibility size="md" />
            </TabsContent>
            <TabsContent value="lg">
              <ColumnVisibility size="lg" />
            </TabsContent>
          </Tabs>

          {view.isChanged && (
            <div className="mt-4 flex w-full items-center justify-between">
              <span className="text-xs text-slate-500">¿Fijar cambios?</span>
              <Button size="sm" className="h-6 px-2 text-xs" onClick={() => view.save()}>
                Guardar
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
