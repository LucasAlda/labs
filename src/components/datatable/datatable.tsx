/* eslint-disable @typescript-eslint/ban-types */
import { DataTableColumnHeader } from "@/components/datatable/column-header-helper";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ViewOptions } from "@/components/datatable/view-options";
import { Table, type TableCardProps, TableContainer, type rowVariants, useTableRowContext } from "@/lib/table";
import { cn, formatNumber } from "@/lib/utils";
import { type Row } from "@tanstack/react-table";
import { type VariantProps } from "class-variance-authority";
import { format } from "date-fns";
import { ChevronDown, ChevronRight, MoreHorizontal, Settings2 } from "lucide-react";
import { type ReactNode, useCallback, startTransition, Children, createContext, useContext } from "react";
import { DataTableCtx, useTableCtx, type UseTable, getAccessor, useColumns } from "@/components/datatable/hooks";
import { DataTablePagination } from "@/components/datatable/pagination";

function DataTableRoot({ table, ...props }: TableCardProps & { children: ReactNode; table: UseTable }) {
  return (
    <DataTableCtx.Provider value={table}>
      <TableContainer {...props} />
    </DataTableCtx.Provider>
  );
}

function Title({ children, className }: { children?: ReactNode; className?: string }) {
  return <h3 className={cn("font-medium leading-none text-slate-800", className)}>{children}</h3>;
}

function Search({ className }: { className?: string }) {
  const { globalFilter, setGlobalFilter } = useTableCtx();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    startTransition(() => {
      setGlobalFilter(e.target.value);
    });
  }

  return (
    <Input
      value={globalFilter ?? ""}
      onChange={handleChange}
      placeholder={`Buscar...`}
      className={cn("h-8 w-full max-w-[14rem]", className)}
    />
  );
}

export type ColumnProps = {
  isDate?: boolean;
  isNumber?: boolean;
  align?: "center" | "right" | "left";
  label?: string;
  className?: string;
  children?:
    | ReactNode
    | ((props: {
        row: Record<string, unknown>;
        controller: Row<Record<string, unknown>>;
        variant: VariantProps<typeof rowVariants>["variant"];
      }) => ReactNode);
  collapsable?: boolean;
  sortable?: boolean;
  colSpan?: number;
  title?: boolean;
} & ({ accessor: string } | { accessorAlias: string });

function Column(props: ColumnProps) {
  props;
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function ColumnBody({ collapsable, title, ...props }: ColumnProps & { row: Row<Record<string, unknown>> }) {
  const tableRowctx = useTableRowContext();
  const children =
    typeof props.children === "function"
      ? props.children({ row: props.row.original, controller: props.row, variant: tableRowctx.variant ?? "none" })
      : props.children;

  const accessor = getAccessor(props);
  if ("accessorAlias" in props) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { accessorAlias, ...rest } = props;
    props = { accessor, ...rest };
  }

  delete props.sortable;

  if (collapsable && props.row.getCanExpand()) {
    return (
      <Table.Cell {...props}>
        {children ?? (props.row.original[accessor] as ReactNode)}
        <button className="hidden cursor-pointer sm:inline" onClick={() => props.row.toggleExpanded()}>
          {props.row.getIsExpanded() ? (
            <ChevronDown className="-mb-1 ml-1 h-4 w-4 opacity-90" />
          ) : (
            <ChevronRight className="-mb-1 ml-1 h-4 w-4 opacity-90" />
          )}
        </button>
      </Table.Cell>
    );
  }

  return <Table.Cell {...props}>{children ?? (props.row.original[accessor] as ReactNode)}</Table.Cell>;
}

export function DataTableViewOptions() {
  const { table } = useTableCtx();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="ml-auto hidden h-8 bg-white lg:flex">
          <Settings2 className="mr-2 h-4 w-4" />
          Vista
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[150px]">
        <DropdownMenuLabel>Mostrar columnas</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {table
          .getAllColumns()
          .filter((column) => typeof column.accessorFn !== "undefined" && column.getCanHide())
          .map((column) => {
            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
              >
                {column.columnDef.header?.toString() ?? column.id}
              </DropdownMenuCheckboxItem>
            );
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export type RowsProps = {
  children: ReactNode;
  selectable?: boolean;
  variant?: (row: Record<string, unknown>) => {
    [k in NonNullable<VariantProps<typeof rowVariants>["variant"]>]?: boolean;
  };
};

function getRowColumns(
  columns: ReturnType<typeof useColumns>[0],
  row: Row<Record<string, unknown>>,
  variant: string,
  title: ReturnType<typeof useColumns>[1]
) {
  if (variant === "none") return columns;
  if (!title) return columns;

  const titleIndex = columns.findIndex((col) => col.props.title);

  const firstValue = columns.findIndex((col) => {
    const value = row.original[col.accessor];
    if (col.props.title) return false;

    return value || col.props.children;
  });

  if (firstValue < 1) return columns;

  const variantColumns: typeof columns = [...columns];
  const firstCol = variantColumns[0]!;

  if (titleIndex > 0) variantColumns[titleIndex] = firstCol;

  variantColumns.splice(0, firstValue, { ...title, props: { ...title.props, colSpan: firstValue } });

  return variantColumns;
}

function Rows({ children, selectable = false, variant }: RowsProps) {
  const table = useTableCtx();
  const [columns, title] = useColumns(children);

  const globalFilterFn = useCallback(
    (row: Row<Record<string, unknown>>) => {
      const res = row.getVisibleCells().some((cell) => {
        const value = cell.getValue();
        if (value instanceof Date) {
          return (
            format(value, "dd-MM-yyyy").includes(table.globalFilter) ||
            format(value, "dd/MM/yyyy").includes(table.globalFilter)
          );
        } else if (typeof value === "number") {
          return (
            value.toString().toUpperCase().includes(table.globalFilter.toUpperCase()) ||
            formatNumber(value).toUpperCase().includes(table.globalFilter.toUpperCase())
          );
        }
        // eslint-disable-next-line @typescript-eslint/no-base-to-string
        if (typeof value === "string") {
          return value.toUpperCase().includes(table.globalFilter.toUpperCase());
        }
        return value === table.globalFilter;
      });

      return res;
    },
    [table.globalFilter]
  );

  if (!table.prerender && table.columns.length === 0) return null;
  if (table.isLoading || table.isEmpty) return null;

  return (
    <>
      <Table.Head>
        <tr>
          {selectable && (
            <Table.Column className="w-8">
              <input
                type="checkbox"
                checked={table.table.getIsAllRowsSelected()}
                onChange={(e) => table.table.toggleAllRowsSelected(e.target.checked)}
              />
            </Table.Column>
          )}
          {/* eslint-disable-next-line @typescript-eslint/no-unused-vars */}
          {columns.map(({ props: { title, collapsable, className, ...props }, accessor, col }) => {
            if (table.columns.length > 0 && !col) return null;

            return (
              <Table.Column key={accessor} {...props}>
                <DataTableColumnHeader
                  column={col}
                  title={props.label ?? ""}
                  labelPlace={props.isNumber ? "right" : props.isDate ? "center" : props.align}
                />
              </Table.Column>
            );
          })}
        </tr>
      </Table.Head>
      <tbody>
        {table.table
          .getRowModel()
          .rows.filter(globalFilterFn)
          .map((row) => {
            const entries = Object.entries(variant?.(row.original) ?? {}) as Array<
              [NonNullable<VariantProps<typeof rowVariants>["variant"]>, boolean]
            >;
            const selectedVariant = entries.find(([, value]) => value)?.[0] ?? "none";
            const rowColumns = getRowColumns(columns, row, selectedVariant, title);

            return (
              <Table.Row key={row.id} variant={selectedVariant}>
                {selectable && (
                  <Table.Cell className="w-8">
                    <input
                      type="checkbox"
                      checked={row.getIsSelected()}
                      onChange={(e) => row.toggleSelected(e.target.checked)}
                    />
                  </Table.Cell>
                )}
                {rowColumns.map(({ props, accessor }) => {
                  if (props.columnType === "Actions") return <ActionsBody key={accessor} {...props} row={row} />;
                  return <ColumnBody key={accessor} {...props} row={row} />;
                })}
              </Table.Row>
            );
          })}
      </tbody>
    </>
  );
}

function Actions(props: ColumnProps) {
  props;
  return null;
}

const ActionsContext = createContext<Row<Record<string, unknown>>>(null as never);

function ActionsBody({ children: childrenRaw, ...props }: ColumnProps & { row: Row<Record<string, unknown>> }) {
  const { variant } = useTableRowContext();
  const children =
    typeof childrenRaw === "function"
      ? childrenRaw({ row: props.row.original, variant: variant ?? "none", controller: props.row })
      : childrenRaw;

  return (
    <ColumnBody {...props}>
      <ActionsContext.Provider value={props.row}>
        <div className="hidden gap-1 md:flex">{children}</div>
        <div className="md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actiones</DropdownMenuLabel>
              {Children.toArray(children).map(((
                { props: { onClick, children } }: { props: ActionProps },
                i: number
              ) => {
                function handleClick() {
                  if (onClick)
                    onClick?.({ row: props.row.original, variant: variant ?? "none", controller: props.row });
                }
                return (
                  <DropdownMenuItem key={i} onClick={handleClick}>
                    {children}
                  </DropdownMenuItem>
                );
              }) as never)}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </ActionsContext.Provider>
    </ColumnBody>
  );
}

export type ActionProps = {
  children: ReactNode;
  className?: string;
  onClick?: (props: {
    row: Record<string, unknown>;
    controller: Row<Record<string, unknown>>;
    variant: VariantProps<typeof rowVariants>["variant"];
  }) => void;
};
function DataTableAction({ className, ...props }: ActionProps) {
  const { variant } = useTableRowContext();
  const row = useContext(ActionsContext);

  function handleClick() {
    if (props.onClick) props.onClick({ row: row.original, variant: variant ?? "none", controller: row });
  }

  return <Button size="sm" {...props} className={cn("h-6 px-2", className)} onClick={handleClick} />;
}

function Loading({ children, height, className }: { children?: ReactNode; height?: string; className?: string }) {
  const { isLoading } = useTableCtx();
  if (!isLoading) return null;
  return (
    <div
      className={cn(
        "flex h-40 flex-col items-center gap-4 pt-16 text-sm font-medium text-slate-500",
        height,
        className
      )}
    >
      {children}
    </div>
  );
}

function Empty({ children, height, className }: { children?: ReactNode; height?: string; className?: string }) {
  const { isEmpty } = useTableCtx();
  if (!isEmpty) return null;
  return (
    <div
      className={cn(
        "flex h-40 flex-col items-center gap-4 pt-16 text-sm font-medium text-slate-500",
        height,
        className
      )}
    >
      {children}
    </div>
  );
}

export const DataTable = {
  Root: DataTableRoot,
  Header: TableContainer.Header,
  Title: Title,
  Search: Search,
  Config: ViewOptions,
  Content: Table,
  Rows: Rows,
  Column: Column,
  Loading,
  Empty,
  Actions: Actions,
  Action: DataTableAction,
  Pagination: DataTablePagination,
};
