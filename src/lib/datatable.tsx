/* eslint-disable @typescript-eslint/ban-types */
import { DataTableColumnHeader } from "@/components/column-header-helper";
import { Button, type ButtonProps } from "@/components/ui/button";
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
  type Updater,
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

function useLocalStorage<T>(key: string | undefined, defaultValue: T) {
  const [changed, setChanged] = useState(false);
  const [value, setValue] = useState(() => {
    const savedValue = key && typeof window !== "undefined" ? window.localStorage.getItem(key) ?? "null" : "null";
    return (JSON.parse(savedValue) as T) ?? defaultValue;
  });

  const changeValue = useCallback(
    function changeValue(value: T | ((old: T) => T), save = true) {
      setValue((prev) => {
        const newVal = typeof value === "function" ? (value as (old: T) => T)(prev) : value;
        if (!key) return newVal;

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

type Visibilitys<T extends string | symbol | number = string> = {
  sm?: { [k in T | (string & {})]?: boolean };
  md?: { [k in T | (string & {})]?: boolean };
  lg?: { [k in T | (string & {})]?: boolean };
};

type Orders = {
  sm?: string[];
  md?: string[];
  lg?: string[];
};

function useView(key?: string, defaultVisibility?: Visibilitys) {
  const [size, setSize] = useState<"sm" | "md" | "lg">("lg");
  const [orders, setOrders, orderChanged] = useLocalStorage<Orders>(`table_${key}_order`, {});
  const [visibilitys, setVisibilitys, visibilityChanged] = useLocalStorage<Visibilitys>(
    `table_${key}_columns`,
    defaultVisibility ?? {}
  );

  useEffect(() => {
    function onResize() {
      if (window.innerWidth < 640) {
        setSize("sm");
      } else if (window.innerWidth < 1024) {
        setSize("md");
      } else {
        setSize("lg");
      }
    }

    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const visibility = visibilitys[size] as VisibilityState;
  const order = orders[size];

  const save = useCallback(() => {
    setVisibilitys((v) => v, true);
    setOrders((o) => o, true);
  }, [setVisibilitys, setOrders]);

  const changeOrder = useCallback(
    (order: Updater<string[]>, onSize = size) => {
      setOrders((prev) => {
        const newOrder = typeof order === "function" ? order(prev[onSize] ?? []) : order;
        return { ...prev, [onSize]: newOrder };
      }, false);
    },
    [setOrders, size]
  );

  const changeVisibility = useCallback(
    (visibility: Updater<VisibilityState>, onSize = size) => {
      setVisibilitys((prev) => {
        const newVisibility =
          typeof visibility === "function" ? visibility((prev[onSize] as VisibilityState) ?? {}) : visibility;
        return { ...prev, [onSize]: newVisibility };
      }, false);
    },
    [setVisibilitys, size]
  );

  const toggleVisibility = useCallback(
    (col: string, value: boolean, size: "sm" | "md" | "lg") => {
      changeVisibility((p) => {
        p = p ?? {};
        p[col] = value;
        return p;
      }, size);
    },
    [changeVisibility]
  );

  const getIsVisible = useCallback(
    (col: string, size: "sm" | "md" | "lg") => {
      return visibilitys[size]?.[col] ?? true;
    },
    [visibilitys]
  );

  return useMemo(
    () => ({
      order,
      orders,
      getIsVisible,
      visibility,
      size,
      changeOrder,
      changeVisibility,
      toggleVisibility,
      isChanged: orderChanged || visibilityChanged,
      save,
    }),
    [
      changeOrder,
      changeVisibility,
      getIsVisible,
      order,
      orderChanged,
      orders,
      save,
      size,
      toggleVisibility,
      visibility,
      visibilityChanged,
    ]
  );
}

const emptyArray: Array<Record<string, unknown>> = [];
export function useTable<T extends Array<Record<string, unknown>>>({
  key,
  data,
  sortMinDepth = 0,
  prerender = true,
  pagination,
  visibility,
}: {
  key?: string;
  data: T | undefined;
  sortMinDepth?: number;
  prerender?: boolean;
  pagination?: number;
  visibility?: Visibilitys<keyof T[number]>;
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
  const view = useView(key, visibility);

  const autoDepthSort = useCallback(
    (a: Row<Record<string, unknown>>, b: Row<Record<string, unknown>>, columnId: string) => {
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
        accessorKey: getAccessor(col),
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
      columnVisibility: view.visibility,
      expanded,
      pagination: paginationState,
      rowSelection: selected,
    },
    onGlobalFilterChange: setGlobalFilter,
    onExpandedChange: setExpanded,
    getExpandedRowModel: getExpandedRowModel(),
    onPaginationChange: setPaginationState,
    getSubRows: useCallback((row: Record<string, unknown>) => row.subRows, []) as never,
    onColumnVisibilityChange: view.changeVisibility,
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
        view,
        prerender,
        isEmpty: data?.length === 0,
        isLoading: data === undefined,
        globalFilter,
        setGlobalFilter,
      } satisfies UseTable),
    [columns, data, globalFilter, prerender, table, view]
  );

  return [returnValue, DataTable as DateTable] as const;
}

type UseTable = {
  table: TTable<Record<string, unknown>>;
  setColumns: Dispatch<SetStateAction<ColumnProps[]>>;
  columns: ColumnProps[];
  globalFilter: string;
  setGlobalFilter: Dispatch<SetStateAction<string>>;
  view: ReturnType<typeof useView>;
  prerender?: boolean;
  isEmpty: boolean;
  isLoading: boolean;
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
    const aOrder = table.view.order?.indexOf(getAccessor(a)) ?? -1;
    const bOrder = table.view.order?.indexOf(getAccessor(b)) ?? -1;

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
  if (title) title.col = table.table.getAllColumns().find((col) => col.id === title.accessor);

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
          {columns.map(({ props: { collapsable, className, ...props }, accessor, col }) => {
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

function DataTableAction({ className, ...props }: ButtonProps) {
  return <Button size="sm" {...props} className={cn("h-6 px-2", className)} />;
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
  Action: DataTableAction,
};
