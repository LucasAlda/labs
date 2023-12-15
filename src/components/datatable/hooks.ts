/* eslint-disable @typescript-eslint/ban-types */
import {
  DataTable,
  type ColumnProps,
  type RowsProps,
  type ActionProps,
  type DataTableRootProps,
  type ColumnPropsGeneric,
} from "@/components/datatable/datatable";
import {
  type SortingState,
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
import { type ValueOf } from "next/dist/shared/lib/constants";
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

export function getAccessor(column: ColumnPropsGeneric) {
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

const columnTypes = {
  ColumnDummy: "column",
  Column: "column",
  ButtonsDummy: "buttons",
  Buttons: "buttons",
  DropdownDummy: "dropdown",
  Dropdown: "dropdown",
} as const;

type ColumnType = ValueOf<typeof columnTypes>;

export function useColumnsFromChildren(children: ReactNode) {
  const table = useDataTable();

  const columns = Children.map(
    children as never,
    ({ props, type }: { props: ColumnPropsGeneric; type?: { name: string } }) => {
      const name = type?.name ?? "NO EXISTS";
      return {
        columnType: ((name in columnTypes ? columnTypes[name as never] : undefined) ?? "NOT EXISTS") as ColumnType,
        ...props,
      } satisfies ColumnProps;
    }
  ).filter((col) => {
    if (col.columnType === ("NOT EXISTS" as ColumnType))
      console.error(`Invalid child component for DataTable, ignoring...`, col);
    return col.columnType;
  });

  // Columns reactivity limited to accessor and accessorAlias;
  useEffect(() => {
    table.setColumns(columns);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns.map((col) => getAccessor(col)).join(",")]);

  return columns;
}

export function useColumns(columns: ColumnProps[]) {
  const table = useDataTable();
  const tanstackColumns = table.table.getVisibleFlatColumns();

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

export type ViewSizes = "sm" | "md" | "lg";
export function useView<T extends string | symbol | number = string>(
  key: string | undefined,
  defaultVisibility?: Visibilitys<T>
) {
  const [size, setSize] = useState<ViewSizes>("lg");
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
    (col: string, value: boolean, size: ViewSizes) => {
      changeVisibility((p) => {
        p = p ?? {};
        p[col] = value;
        return p;
      }, size);
    },
    [changeVisibility]
  );

  const getIsVisible = useCallback(
    (col: string, size: ViewSizes) => {
      return visibilitys[size]?.[col] ?? true;
    },
    [visibilitys]
  );

  const reset = useCallback(
    (onSize = size) => {
      console.log(onSize, size);
      changeVisibility(() => defaultVisibility?.[onSize ?? size] as VisibilityState, onSize ?? size);
      changeOrder(() => [], onSize ?? size);
    },
    [changeOrder, changeVisibility, defaultVisibility, size]
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
      reset,
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
      reset,
      save,
      size,
      toggleVisibility,
      visibility,
      visibilityChanged,
    ]
  );
}

type GetRow<T> = T extends Array<infer K extends Record<string, unknown>>
  ? K extends { subRows: unknown }
    ? { "Provide a type on useTable": true }
    : K
  : never;

export type UseTable<TRow = Record<string, unknown>> = {
  table: Table<TRow>;
  setColumns: Dispatch<SetStateAction<ColumnProps[]>>;
  columns: ColumnProps[];
  globalFilter: string;
  setGlobalFilter: Dispatch<SetStateAction<string>>;
  view: ReturnType<typeof useView>;
  minDepth: number;
  prerender?: boolean;
  isEmpty: boolean;
  isLoading: boolean;
};

const emptyArray: Array<Record<string, unknown>> = [];
export function useTable<T extends Array<Record<string, unknown>>, TRow = GetRow<T>>({
  data,
  minDepth = 0,
  prerender = true,
  pagination,
  view,
}: {
  key?: string;
  data: T | undefined;
  minDepth?: number;
  prerender?: boolean;
  pagination?: number;
  view?: ReturnType<typeof useView>;
}) {
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
      if (a.depth < minDepth || b.depth < minDepth) return 0;
      if (a.getValue(columnId) instanceof Date && b.getValue(columnId) instanceof Date) {
        return sortingFns.datetime(a, b, columnId);
      }
      return sortingFns.alphanumeric(a, b, columnId);
    },
    [minDepth]
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
    },
    onGlobalFilterChange: setGlobalFilter,
    onExpandedChange: setExpanded,
    getExpandedRowModel: getExpandedRowModel(),
    onPaginationChange: setPaginationState,
    getSubRows: useCallback((row: Record<string, unknown>) => row.subRows, []) as never,
    onColumnVisibilityChange: view?.changeVisibility ?? defaultView.changeVisibility,
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

  type DTColumnProps = ColumnProps<TRow>;

  type DateTable = Omit<
    typeof DataTable,
    "Root" | "Column" | "Rows" | "Buttons" | "Button" | "Dropdown" | "DropdownItem"
  > & {
    Root: (props: DataTableRootProps<TRow>) => JSX.Element;
    Rows: (props: RowsProps<TRow>) => JSX.Element;
    Column: (props: DTColumnProps) => null;
    Buttons: (props: ColumnProps<TRow> & { responsive?: boolean }) => null;
    Dropdown: (props: ColumnProps<TRow>) => null;
    Button: (props: ActionProps<TRow>) => JSX.Element;
    DropdownItem: (props: ActionProps<TRow>) => JSX.Element;
  };

  const returnValue = useMemo(
    () =>
      ({
        table,
        setColumns,
        columns,
        view: view ?? defaultView,
        prerender,
        minDepth,
        isEmpty: data?.length === 0,
        isLoading: data === undefined,
        globalFilter,
        setGlobalFilter,
      } satisfies UseTable),
    [columns, data, defaultView, globalFilter, minDepth, prerender, table, view]
  ) as UseTable<TRow>;

  return [returnValue, DataTable as DateTable] as const;
}

export const DataTableContext = createContext<UseTable>(null as unknown as UseTable);

export const useDataTable = () => useContext(DataTableContext);
