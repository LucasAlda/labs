/* eslint-disable @typescript-eslint/ban-types, @typescript-eslint/no-unused-vars */
import { DataTableColumnHeader } from "@/components/datatable/column-header";
import { Button, type ButtonProps } from "@/components/ui/button";
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
import {
  Table,
  type TableCardProps,
  TableContainer,
  type rowVariants,
  useTableRowContext,
} from "@/components/datatable/table";
import { cn, formatNumber } from "@/lib/utils";
import { type Row } from "@tanstack/react-table";
import { type VariantProps } from "class-variance-authority";
import { format } from "date-fns";
import { ChevronDown, ChevronRight, MoreHorizontal, Settings2 } from "lucide-react";
import { type ReactNode, useCallback, startTransition, Children, createContext, useContext } from "react";
import {
  DataTableContext,
  useDataTable,
  type UseTable,
  getAccessor,
  useColumns,
  useColumnsFromChildren,
} from "@/components/datatable/hooks";
import { DataTablePagination } from "@/components/datatable/pagination";

export type DataTableRootProps<TRow = Record<string, unknown>> = TableCardProps & {
  children: ReactNode;
  table: UseTable<TRow>;
};
function DataTableRoot({ table, ...props }: DataTableRootProps) {
  return (
    <DataTableContext.Provider value={table}>
      <TableContainer {...props} />
    </DataTableContext.Provider>
  );
}

function Title({ children, className }: { children?: ReactNode; className?: string }) {
  return <h3 className={cn("font-medium leading-none text-slate-800", className)}>{children}</h3>;
}

function Search({ className }: { className?: string }) {
  const { globalFilter, setGlobalFilter } = useDataTable();

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

export type ColumnPropsGeneric<TRow = Record<string, unknown>> = {
  isDate?: boolean;
  isNumber?: boolean;
  align?: "center" | "right" | "left";
  label?: string;
  className?: string;
  children?:
    | ReactNode
    | ((props: {
        row: TRow;
        controller: Row<TRow>;
        variant: VariantProps<typeof rowVariants>["variant"];
      }) => ReactNode);
  collapsable?: boolean;
  sortable?: boolean;
  colSpan?: number;
  title?: boolean;
  showEmpty?: (props: {
    row: TRow;
    controller: Row<TRow>;
    variant: VariantProps<typeof rowVariants>["variant"];
  }) => ReactNode;
} & ({ accessor: keyof TRow } | { accessorAlias: string });

export type ColumnProps<TRow = Record<string, unknown>> = ColumnPropsGeneric<TRow> & {
  columnType: "column" | "buttons" | "dropdown";
};

export function DataTableViewOptions() {
  const { table } = useDataTable();
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

export type RowsProps<TRow = Record<string, unknown>> = {
  children: ReactNode;
  onClick?: (props: { row: TRow; controller: Row<TRow>; variant: VariantProps<typeof rowVariants>["variant"] }) => void;
  variant?: (row: TRow) => {
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

  let firstValue = columns.findIndex((col) => {
    const value = row.original[col.accessor];
    if (col.props.title) return false;

    return value || col.props.children;
  });

  if (firstValue === 0) return columns;

  const variantColumns: typeof columns = [...columns];
  const firstCol = variantColumns[0]!;

  if (titleIndex > 0) variantColumns[titleIndex] = firstCol;

  if (firstValue === -1) {
    firstValue = columns.length;
  }

  variantColumns.splice(0, firstValue, { ...title, props: { ...title.props, colSpan: firstValue } });

  return variantColumns;
}

const RowContext = createContext<Row<Record<string, unknown>>>(null as never);
const useRow = () => useContext(RowContext);

function Rows({ children, onClick, variant }: RowsProps) {
  const table = useDataTable();
  const columnsProps = useColumnsFromChildren(children);
  const [columns, title] = useColumns(columnsProps);

  const globalFilterFn = useCallback(
    (row: Row<Record<string, unknown>>) => {
      if (row.depth < table.minDepth) return true;

      const res = row.getVisibleCells().some((cell) => {
        if (!table.globalFilter) return true;
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
    [table.globalFilter, table.minDepth]
  );

  if (!table.prerender && table.columns.length === 0) return null;
  if (table.isLoading || table.isEmpty) return null;

  return (
    <>
      <Table.Head>
        <tr>
          {columns.map(
            ({ props: { title, showEmpty, collapsable, className, columnType, ...props }, accessor, col }) => {
              if (table.columns.length > 0 && !col) return null;

              return (
                <Table.Column key={accessor} {...props}>
                  <div
                    className={cn(columnType === "buttons" && "hidden sm:block", columnType === "dropdown" && "hidden")}
                  >
                    <DataTableColumnHeader
                      column={col}
                      title={props.label ?? ""}
                      labelPlace={props.isNumber ? "right" : props.isDate ? "center" : props.align}
                    />
                  </div>
                </Table.Column>
              );
            }
          )}
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
              <Table.Row
                key={row.id}
                variant={selectedVariant}
                onClick={(e) => {
                  if (!(e.target instanceof HTMLTableCellElement) && !(e.target instanceof HTMLTableRowElement)) {
                    e.stopPropagation();
                    return;
                  }
                  onClick?.({ row: row.original, controller: row, variant: selectedVariant });
                }}
              >
                <RowContext.Provider value={row}>
                  {rowColumns.map(({ props, accessor }) => {
                    if (props.columnType === "buttons") return <Buttons key={accessor} {...props} />;
                    if (props.columnType === "dropdown") return <DatabaseDropdown key={accessor} {...props} />;
                    return <Column key={accessor} {...props} />;
                  })}
                </RowContext.Provider>
              </Table.Row>
            );
          })}
      </tbody>
    </>
  );
}

function ColumnDummy(props: ColumnPropsGeneric) {
  props;
  return null;
}

function ButtonsDummy(props: ColumnPropsGeneric & { responsive?: boolean }) {
  props;
  return null;
}

function DropdownDummy(props: ColumnPropsGeneric) {
  props;
  return null;
}

function Column({ collapsable, title, columnType, showEmpty, children: childrenRaw, ...props }: ColumnProps) {
  const row = useRow();
  const tableRowctx = useTableRowContext();
  const children =
    typeof childrenRaw === "function"
      ? childrenRaw({ row: row.original, controller: row, variant: tableRowctx.variant ?? "none" })
      : childrenRaw;

  const accessor = getAccessor(props);
  if ("accessorAlias" in props) {
    const { accessorAlias, ...rest } = props;
    props = { accessor, ...rest };
  }

  delete props.sortable;

  if (showEmpty?.({ row: row.original, controller: row, variant: tableRowctx.variant ?? "none" })) {
    return <Table.Cell {...props}></Table.Cell>;
  }

  if (collapsable && row.getCanExpand()) {
    return (
      <Table.Cell {...props}>
        {children ?? (row.original[accessor] as ReactNode)}
        <button className="hidden cursor-pointer sm:inline" onClick={() => row.toggleExpanded()}>
          {row.getIsExpanded() ? (
            <ChevronDown className="-mb-1 ml-1 h-4 w-4 opacity-90" />
          ) : (
            <ChevronRight className="-mb-1 ml-1 h-4 w-4 opacity-90" />
          )}
        </button>
      </Table.Cell>
    );
  }

  return <Table.Cell {...props}>{children ?? (row.original[accessor] as ReactNode)}</Table.Cell>;
}

function Buttons({ responsive = true, children: childrenRaw, ...props }: ColumnProps & { responsive?: boolean }) {
  const row = useRow();
  const { variant } = useTableRowContext();
  const children =
    typeof childrenRaw === "function"
      ? childrenRaw({ row: row.original, variant: variant ?? "none", controller: row })
      : childrenRaw;

  return (
    <Column {...props}>
      <div className={cn("flex gap-1", responsive && "hidden md:flex")}>{children}</div>
      {responsive && (
        <div className={"md:hidden"}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              {Children.toArray(children).map((({ props }: { props: ActionProps }, i: number) => (
                <DatabaseDropdownItem key={i} {...props} />
              )) as never)}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </Column>
  );
}

function DatabaseDropdown({ label, children: childrenRaw, ...props }: ColumnProps) {
  const row = useRow();
  const { variant } = useTableRowContext();
  const children =
    typeof childrenRaw === "function"
      ? childrenRaw({ row: row.original, variant: variant ?? "none", controller: row })
      : childrenRaw;

  return (
    <Column {...props}>
      <div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{label ?? "Acciones"}</DropdownMenuLabel>
            {children}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Column>
  );
}

export type ActionProps<TRow = Record<string, unknown>> = Omit<ButtonProps, "onClick"> & {
  onClick?: (props: { row: TRow; controller: Row<TRow>; variant: VariantProps<typeof rowVariants>["variant"] }) => void;
};

function DatabaseButton({ className, ...props }: ActionProps) {
  const { variant } = useTableRowContext();
  const row = useRow();

  function handleClick(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    e.stopPropagation();
    if (props.onClick) props.onClick({ row: row.original, variant: variant ?? "none", controller: row });
  }

  return <Button size="sm" {...props} className={cn("h-6 px-2", className)} onClick={handleClick} />;
}

function DatabaseDropdownItem({ className, children, ...props }: ActionProps) {
  const { variant } = useTableRowContext();
  const row = useRow();

  function handleClick(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    e.stopPropagation();
    if (props.onClick) props.onClick({ row: row.original, variant: variant ?? "none", controller: row });
  }

  return <DropdownMenuItem onClick={handleClick}>{children}</DropdownMenuItem>;
}

function Loading({ children, height, className }: { children?: ReactNode; height?: string; className?: string }) {
  const { isLoading } = useDataTable();
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
  const { isEmpty } = useDataTable();
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
  Column: ColumnDummy,
  Loading,
  Empty,
  Buttons: ButtonsDummy,
  Button: DatabaseButton,
  Dropdown: DropdownDummy,
  DropdownItem: DatabaseDropdownItem,
  Pagination: DataTablePagination,
};
