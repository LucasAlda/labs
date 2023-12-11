import { DataTableColumnHeader } from "@/components/column-header-helper";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ViewOptions } from "@/components/view-options";
import { Table, type TableCardProps, TableContainer, type rowVariants, useTableRowContext } from "@/lib/table";
import { cn, formatNumber } from "@/lib/utils";
import {
  type VisibilityState,
  type SortingState,
  type ExpandedState,
  type Row,
  sortingFns,
  useReactTable,
  getExpandedRowModel,
  getCoreRowModel,
  getSortedRowModel,
  type Table as TTable,
  getFilteredRowModel,
  getPaginationRowModel,
  type PaginationState,
  type RowSelectionState,
} from "@tanstack/react-table";
import { type VariantProps } from "class-variance-authority";
import { format } from "date-fns";
import { ChevronDown, ChevronRight, Settings2 } from "lucide-react";
import {
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  Children,
  useEffect,
  startTransition,
} from "react";

type GetRow<T> = T extends Array<infer K>
  ? K extends { subRows: unknown }
    ? { "Provide a type on useTable": true }
    : K
  : never;

function useLocalStorage<T>(key: string, defaultValue: T) {
  const [changed, setChanged] = useState(false);
  const [value, setValue] = useState(
    () =>
      (JSON.parse((typeof window !== "undefined" ? window.localStorage.getItem(key) : "null") ?? "null") as T) ??
      defaultValue
  );

  const changeValue = useCallback(
    function changeValue(value: T | ((old: T) => T), save = true) {
      setValue((prev) => {
        const newVal = typeof value === "function" ? (value as (old: T) => T)(prev) : value;
        if (save) {
          window.localStorage.setItem(key, JSON.stringify(newVal));
          setChanged(false);
        } else {
          setChanged(true);
        }

        return newVal;
      });
    },
    [key]
  );
  return [value, changeValue, changed] as const;
}

const emptyArray: Array<Record<string, unknown>> = [];
export function useTable<T extends Array<Record<string, unknown>>>({
  key,
  data,
  sortMinDepth = 0,
  prerender = true,
  pagination,
}: {
  key: string;
  data: T | undefined;
  sortMinDepth?: number;
  prerender?: boolean;
  pagination?: number;
}) {
  const [selected, setSelected] = useState<RowSelectionState>({});
  const [columns, setColumns] = useState<Array<ColumnProps>>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [paginationState, setPaginationState] = useState<PaginationState>(() => ({
    pageSize: pagination ?? 10000,
    pageIndex: 0,
  }));
  const [globalFilter, setGlobalFilter] = useState("");
  const [expanded, setExpanded] = useState<ExpandedState>(true);
  const [order, setOrder, orderChanged] = useLocalStorage<string[]>(`table_order_${key}`, []);
  const [columnVisibility, setColumnVisibility, visibilityChanged] = useLocalStorage<VisibilityState>(
    `table_columns_${key}`,
    {}
  );

  const saveView = useCallback(() => {
    setColumnVisibility(columnVisibility, true);
    setOrder(order, true);
  }, [columnVisibility, order, setColumnVisibility, setOrder]);

  const autoDepthSort = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (a: Row<any>, b: Row<any>, columnId: string) => {
      if (a.depth < sortMinDepth || b.depth < sortMinDepth) return 0;

      if (a.getValue(columnId) instanceof Date && b.getValue(columnId) instanceof Date) {
        return sortingFns.datetime(a, b, columnId);
      }
      return sortingFns.alphanumeric(a, b, columnId);
    },
    [sortMinDepth]
  );

  const tanstackColumns = useMemo(
    () =>
      columns.map((col) => ({
        accessorKey: "accessor" in col ? col.accessor : col.accessorAlias,
        header: col.label,
        sortingFn: autoDepthSort,
      })),
    [columns, autoDepthSort]
  );

  const table = useReactTable({
    data: data ?? emptyArray,
    columns: tanstackColumns,
    state: {
      sorting,
      columnVisibility,
      expanded,
      pagination: paginationState,
      rowSelection: selected,
    },
    onGlobalFilterChange: setGlobalFilter,
    onExpandedChange: setExpanded,
    getExpandedRowModel: getExpandedRowModel(),
    onPaginationChange: setPaginationState,
    getSubRows: useCallback((row: Record<string, unknown>) => row.subRows, []) as never,
    onColumnVisibilityChange: (v) => setColumnVisibility(v, false),
    onRowSelectionChange: setSelected,
    enableRowSelection: true,
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    sortingFns: {
      auto: autoDepthSort,
    },
    getSortedRowModel: getSortedRowModel(),
  });

  type DateTable = Omit<typeof DataTable, "Column" | "Rows"> & {
    Rows: (
      props: Omit<RowsProps, "variant"> & {
        variant?: (row: GetRow<T>) => ReturnType<NonNullable<RowsProps["variant"]>>;
      }
    ) => JSX.Element;
    Column: (
      props: Omit<ColumnProps, "accessor" | "accessorAlias" | "children"> & {
        children?:
          | ReactNode
          | ((props: {
              row: GetRow<T>;
              controller: Row<GetRow<T>>;
              variant: VariantProps<typeof rowVariants>["variant"];
            }) => ReactNode);
      } & ({ accessor: keyof GetRow<T> } | { accessorAlias: string })
    ) => null;
  };

  const returnValue = useMemo(
    () =>
      ({
        table,
        setColumns,
        columns,
        columnVisibility,
        saveView,
        order,
        setOrder,
        prerender,
        isEmpty: data?.length === 0,
        isLoading: data === undefined,
        viewChanged: visibilityChanged || orderChanged,
        globalFilter,
        setGlobalFilter,
      } satisfies UseTable),
    [
      columnVisibility,
      columns,
      data,
      globalFilter,
      order,
      orderChanged,
      prerender,
      saveView,
      setOrder,
      table,
      visibilityChanged,
    ]
  );

  return [returnValue, DataTable as DateTable] as const;
}

type UseTable = {
  table: TTable<Record<string, unknown>>;
  setColumns: Dispatch<SetStateAction<ColumnProps[]>>;
  columns: ColumnProps[];
  columnVisibility: VisibilityState;
  globalFilter: string;
  setGlobalFilter: Dispatch<SetStateAction<string>>;
  order: string[] | undefined;
  saveView: () => void;
  setOrder: (value: string[], save?: boolean) => void;
  prerender?: boolean;
  isEmpty: boolean;
  isLoading: boolean;
  viewChanged: boolean;
};
const DataTableCtx = createContext<UseTable>(null as unknown as UseTable);

export const useTableCtx = () => useContext(DataTableCtx);

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

type ColumnProps = {
  isDate?: boolean;
  isNumber?: boolean;
  align?: "center" | "right" | "left";
  label: string;
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
        <button
          {...{
            onClick: props.row.getToggleExpandedHandler(),
            style: { cursor: "pointer" },
          }}
        >
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

function getAccessor(column: ColumnProps) {
  return "accessor" in column ? column.accessor : column.accessorAlias;
}

function useColumns(children: ReactNode) {
  const table = useTableCtx();
  const tanstackColumns = table.table.getVisibleFlatColumns();

  const columns = Children.map(children as never, ({ props }: { props: ColumnProps }) => props);

  // Columns reactivity limited to accessor and accessorAlias;
  useEffect(() => {
    table.setColumns(columns);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns.map((col) => getAccessor(col)).join(",")]);

  const sortedColumns = columns.sort((a, b) => {
    const aOrder = table.order?.indexOf(getAccessor(a)) ?? -1;
    const bOrder = table.order?.indexOf(getAccessor(b)) ?? -1;

    if (aOrder === -1 && bOrder === -1) return 0;
    if (aOrder === -1) return 1;
    if (bOrder === -1) return -1;
    return aOrder - bOrder;
  });

  const columnsInfo = sortedColumns.map((props) => {
    const accessor = getAccessor(props);
    const col = tanstackColumns.find((col) => col.id === accessor);
    return {
      accessor,
      props,
      col,
    };
  });

  const title = columnsInfo.find((col) => col.props.title);
  if (title) title.col = table.table.getColumn(title.accessor);

  const visibleColumns = columnsInfo.filter((col) => col.col?.getIsVisible());
  return [visibleColumns, title] as const;
}

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

  console.log("title", title);

  variantColumns.splice(0, firstValue, { ...title, props: { ...title.props, colSpan: firstValue } });
  console.log(variantColumns);

  // [...columns].forEach((col, i) => {
  //   if (col.props.title) {
  //     if (firstEmpty) {
  //       variantColumns.splice(0, 1, {
  //         ...col,
  //         props: { ...col.props, colSpan: variantColumns[0]?.props.colSpan },
  //       });
  //     }
  //     colSpan++;
  //     return;
  //   }
  //   const value = row.original[col.accessor];
  //   if (i === 0 || value || col.props.children) {
  //     if (i === 0 && !value && !col.props.children) firstEmpty = true;

  //     const lastColumn = variantColumns.at(-1);
  //     if (lastColumn) lastColumn.props.colSpan = colSpan;
  //     variantColumns.push({ ...col, props: { ...col.props, colSpan: 1 } });
  //     colSpan = 1;
  //   } else {
  //     colSpan++;
  //   }
  // });

  // const lastColumn = variantColumns.at(-1);
  // if (lastColumn) lastColumn.props.colSpan = colSpan;

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
          {columns.map(({ props: { collapsable, ...props }, accessor, col }) => {
            if (table.columns.length > 0 && !col) return null;

            return (
              <Table.Column key={accessor} {...props}>
                <DataTableColumnHeader
                  column={col}
                  title={props.label}
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
                  return <ColumnBody key={accessor} {...props} row={row} />;
                })}
              </Table.Row>
            );
          })}
      </tbody>
    </>
  );
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
};
