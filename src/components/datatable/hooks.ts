/* eslint-disable @typescript-eslint/ban-types */
import { DataTable, type ColumnProps, type RowsProps, type ActionProps } from "@/components/datatable/datatable";
import { type rowVariants } from "@/lib/table";
import {
  type SortingState,
  type RowSelectionState,
  type Updater,
  type VisibilityState,
  type PaginationState,
  type ExpandedState,
  type Row,
  sortingFns,
  type Table,
  useReactTable,
  getExpandedRowModel,
  getFilteredRowModel,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
} from "@tanstack/react-table";
import { type VariantProps } from "class-variance-authority";
import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useContext,
  createContext,
  type ReactNode,
  Children,
} from "react";

export function getAccessor(column: ColumnProps) {
  return "accessor" in column ? column.accessor : column.accessorAlias;
}

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

export function useColumns(children: ReactNode) {
  const table = useTableCtx();
  const tanstackColumns = table.table.getVisibleFlatColumns();

  const columns = Children.map(
    children as never,
    ({ props, type }: { props: ColumnProps; type?: { name: string } }) => ({
      columnType: type?.name,
      ...props,
    })
  ).filter((col) => {
    const validChild = ["Column", "Actions", "Select"].includes(col.columnType ?? "NOT EXISTS");
    if (!validChild) console.error(`Invalid child component "${col.columnType}" for DataTable, ignoring...`);
    return validChild;
  });

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

export function useView(key?: string, defaultVisibility?: Visibilitys) {
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
      isChanged: key && (orderChanged || visibilityChanged),
      save,
    }),
    [
      changeOrder,
      changeVisibility,
      getIsVisible,
      key,
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

type GetRow<T> = T extends Array<infer K>
  ? K extends { subRows: unknown }
    ? { "Provide a type on useTable": true }
    : K
  : never;

export type UseTable = {
  table: Table<Record<string, unknown>>;
  setColumns: Dispatch<SetStateAction<ColumnProps[]>>;
  columns: ColumnProps[];
  globalFilter: string;
  setGlobalFilter: Dispatch<SetStateAction<string>>;
  view: ReturnType<typeof useView>;
  prerender?: boolean;
  isEmpty: boolean;
  isLoading: boolean;
};

const emptyArray: Array<Record<string, unknown>> = [];
export function useTable<T extends Array<Record<string, unknown>>>({
  data,
  sortMinDepth = 0,
  prerender = true,
  pagination,
  view,
}: {
  key?: string;
  data: T | undefined;
  sortMinDepth?: number;
  prerender?: boolean;
  pagination?: number;
  view?: ReturnType<typeof useView>;
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
  const defaultView = useView(undefined);

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
      columnVisibility: view?.visibility ?? defaultView.visibility,
      expanded,
      pagination: paginationState,
      rowSelection: selected,
    },
    onGlobalFilterChange: setGlobalFilter,
    onExpandedChange: setExpanded,
    getExpandedRowModel: getExpandedRowModel(),
    onPaginationChange: setPaginationState,
    getSubRows: useCallback((row: Record<string, unknown>) => row.subRows, []) as never,
    onColumnVisibilityChange: view?.changeVisibility ?? defaultView.changeVisibility,
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

  type DTColumnProps = Omit<ColumnProps, "accessor" | "accessorAlias" | "children"> & {
    children?:
      | ReactNode
      | ((props: {
          row: GetRow<T>;
          controller: Row<GetRow<T>>;
          variant: VariantProps<typeof rowVariants>["variant"];
        }) => ReactNode);
  } & ({ accessor: keyof GetRow<T> } | { accessorAlias: string });

  type DateTable = Omit<typeof DataTable, "Column" | "Rows" | "Actions" | "Action"> & {
    Rows: (
      props: Omit<RowsProps, "variant"> & {
        variant?: (row: GetRow<T>) => ReturnType<NonNullable<RowsProps["variant"]>>;
      }
    ) => JSX.Element;
    Column: (props: DTColumnProps) => null;
    Actions: (props: DTColumnProps) => null;
    Action: (
      props: Omit<ActionProps, "onClick"> & {
        onClick: (props: {
          row: GetRow<T>;
          controller: Row<GetRow<T>>;
          variant: VariantProps<typeof rowVariants>["variant"];
        }) => void;
      }
    ) => JSX.Element;
  };

  const returnValue = useMemo(
    () =>
      ({
        table,
        setColumns,
        columns,
        view: view ?? defaultView,
        prerender,
        isEmpty: data?.length === 0,
        isLoading: data === undefined,
        globalFilter,
        setGlobalFilter,
      } satisfies UseTable),
    [columns, data, defaultView, globalFilter, prerender, table, view]
  );

  // FIX
  return [returnValue, DataTable as unknown as DateTable] as const;
}

export const DataTableCtx = createContext<UseTable>(null as unknown as UseTable);

export const useTableCtx = () => useContext(DataTableCtx);
