import { useTableCtx } from "@/lib/datatable";
import { Eye, EyeOff, GripHorizontal } from "lucide-react";
import { type ReactNode, type SetStateAction } from "react";
import React from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  useSortable,
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export const ColumnVisibility = ({ size }: { size: "sm" | "md" | "lg" }) => {
  const { table, view } = useTableCtx();

  const columns = table
    .getAllColumns()
    .filter((column) => typeof column.accessorFn !== "undefined")
    .sort((a, b) => {
      const aOrder = view.orders[size]?.indexOf(a.id) ?? -1;
      const bOrder = view.orders[size]?.indexOf(b.id) ?? -1;
      if (aOrder === -1 && bOrder === -1) return 0;
      if (aOrder === -1) return 1;
      if (bOrder === -1) return -1;
      return aOrder - bOrder;
    });

  const order = columns.map((column) => ({ id: column.id, name: column.columnDef.header }));

  function setItems(items: SetStateAction<SortableItemProps[]>) {
    view.changeOrder(
      (typeof items === "function" ? items(order) : items).map((i) => i.id),
      size
    );
  }

  return (
    <div className="bg-white">
      <SortableList items={order} setItems={setItems}>
        {columns.map((col) => (
          <SortableColumn key={col.id} id={col.id}>
            <div className="flex grow items-center justify-between">
              <span className={cn(!view.getIsVisible(col.id, size) ? "text-slate-400/90" : "text-slate-900")}>
                {col.columnDef.header?.toString()}
              </span>
              {view.getIsVisible(col.id, size) ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => view.toggleVisibility(col.id, false, size)}
                >
                  <Eye className="h-4 w-4 text-slate-400/80" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => view.toggleVisibility(col.id, true, size)}
                >
                  <EyeOff className="h-4 w-4 text-slate-400/80" />
                </Button>
              )}
            </div>
          </SortableColumn>
        ))}
      </SortableList>
    </div>
  );
};

function SortableColumn(props: { id: string; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative -mx-2 flex touch-none items-center gap-3 rounded-md bg-white px-2  py-0.5 text-sm leading-6 text-slate-700",
        isDragging && "z-50 bg-slate-100 shadow-lg shadow-slate-200"
      )}
      {...attributes}
      style={style}
    >
      <div {...props} {...listeners} className="-mx-1 flex h-6 w-6 items-center justify-center " ref={setNodeRef}>
        <GripHorizontal className="h-4 w-4 text-slate-400/80" />
      </div>
      {props.children}
    </div>
  );
}

type SortableItemProps = {
  id: string;
  [k: string]: unknown;
};

function SortableList({
  children,
  items,
  setItems,
}: {
  children: ReactNode;
  items: Array<SortableItemProps>;
  setItems: (fn: SetStateAction<SortableItemProps[]>) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event as { active: { id: string }; over: { id: string } };

    if (active.id !== over.id) {
      setItems((items: SortableItemProps[]) => {
        const ids = items.map((item: SortableItemProps) => item.id);
        const oldIndex = ids.indexOf(active.id);
        const newIndex = ids.indexOf(over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }
}
